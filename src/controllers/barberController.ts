import { Request, Response } from "express";
import { BarberService } from "../services/barberService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/database";
import { PortfolioItem } from "../types/portfolio";
import { randomUUID } from "crypto";

const barberService = new BarberService();

export const barberController = {
  getAllBarbers: asyncHandler(async (req: Request, res: Response) => {
    const { search, minRating, maxPrice, sortBy, page, limit } = req.query;

    const result = await barberService.getAllBarbers({
      search: search as string,
      minRating: minRating ? Number(minRating) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy: sortBy as "distance" | "rating" | "price" | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  getBarberById: asyncHandler(
    async (req: Request | AuthRequest, res: Response) => {
      const { id } = req.params;
      const authReq = req as AuthRequest;
      const userId = authReq.userId; // Get userId if authenticated

      // Support special alias "me" → token-based lookup
      if (id === "me") {
        if (!userId) {
          return res
            .status(401)
            .json({ success: false, error: "Token required" });
        }
        const barber = await barberService.getBarberById("", userId);
        return res.status(200).json({ success: true, data: barber });
      }

      // If id is empty, undefined, or only whitespace, use userId from token
      const barberId = id && id.trim() !== "" ? id.trim() : undefined;

      // If no barberId provided and user is authenticated, use userId to find barber
      // Otherwise, try to find by barberId first, then fallback to userId
      const barber = await barberService.getBarberById(barberId || "", userId);

      res.status(200).json({
        success: true,
        data: barber,
      });
    }
  ),

  // Get authenticated barber profile using token (no id required)
  getMyProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const barber = await barberService.getBarberById("", userId);

    res.status(200).json({
      success: true,
      data: barber,
    });
  }),

  createBarber: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const barber = await barberService.createBarber(userId, req.body);

    res.status(201).json({
      success: true,
      data: barber,
    });
  }),

  // Update authenticated barber (uses token)
  updateMyProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const barber = await barberService.updateBarberByUserId(userId, req.body);

    res.status(200).json({
      success: true,
      data: barber,
    });
  }),

  // Update barber by id (for admin or with authorization)
  updateBarber: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const barber = await barberService.updateBarber(id, req.body);

    res.status(200).json({
      success: true,
      data: barber,
    });
  }),

  getDashboard: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const dashboard = await barberService.getBarberDashboard(userId);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  }),

  // Add portfolio items to authenticated barber
  addPortfolioImages: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { items } = req.body as { items: Array<{ image: string; title: string; description?: string; category?: string }> };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Items array is required and must not be empty",
      });
    }

    // Get current barber data
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true, portfolio: true },
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barber profile not found",
      });
    }

    // Parse existing portfolio (can be null, empty array, or legacy string array)
    let existing: PortfolioItem[] = [];
    if (barber.portfolio) {
      if (Array.isArray(barber.portfolio)) {
        // Check if legacy format (string[]) or new format (PortfolioItem[])
        if (barber.portfolio.length > 0 && typeof barber.portfolio[0] === 'string') {
          // Legacy format: convert to new format
          existing = (barber.portfolio as string[]).map((image: string) => ({
            id: randomUUID(),
            image,
            title: 'Portfolio rasmi',
            createdAt: new Date().toISOString(),
          }));
        } else {
          // New format: PortfolioItem[]
          existing = barber.portfolio as PortfolioItem[];
        }
      }
    }

    // Create new portfolio items with IDs and timestamps
    const newItems: PortfolioItem[] = items.map((item) => ({
      id: randomUUID(),
      image: item.image,
      title: item.title,
      description: item.description,
      category: item.category,
      createdAt: new Date().toISOString(),
    }));

    // Combine existing with new items, limit to 20 total
    const combined = [...existing, ...newItems].slice(0, 20);

    const updated = await barberService.updateBarberByUserId(userId, { portfolio: combined });

    res.status(200).json({ success: true, data: updated.portfolio });
  }),

  // Update portfolio item for authenticated barber
  updatePortfolioItem: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id, title, description, category, image } = req.body as {
      id: string;
      title?: string;
      description?: string;
      category?: string;
      image?: string;
    };

    // Get current barber data
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true, portfolio: true },
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barber profile not found",
      });
    }

    // Parse existing portfolio
    let existing: PortfolioItem[] = [];
    if (barber.portfolio && Array.isArray(barber.portfolio)) {
      if (barber.portfolio.length > 0 && typeof barber.portfolio[0] === 'string') {
        // Legacy format
        existing = (barber.portfolio as string[]).map((img: string) => ({
          id: randomUUID(),
          image: img,
          title: 'Portfolio rasmi',
          createdAt: new Date().toISOString(),
        }));
      } else {
        existing = barber.portfolio as PortfolioItem[];
      }
    }

    // Find and update the item
    const itemIndex = existing.findIndex((item) => item.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Portfolio item not found",
      });
    }

    // Update the item
    existing[itemIndex] = {
      ...existing[itemIndex],
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(image !== undefined && { image }),
    };

    const updated = await barberService.updateBarberByUserId(userId, { portfolio: existing });
    res.status(200).json({ success: true, data: updated.portfolio });
  }),

  // Remove portfolio item by id for authenticated barber
  removePortfolioImage: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = (req.body || {}) as { id: string };

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Portfolio item ID is required",
      });
    }

    // Get current barber data directly from database
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true, portfolio: true },
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barber profile not found",
      });
    }

    // Parse existing portfolio
    let existing: PortfolioItem[] = [];
    if (barber.portfolio && Array.isArray(barber.portfolio)) {
      if (barber.portfolio.length > 0 && typeof barber.portfolio[0] === 'string') {
        // Legacy format: convert to new format
        existing = (barber.portfolio as string[]).map((img: string) => ({
          id: randomUUID(),
          image: img,
          title: 'Portfolio rasmi',
          createdAt: new Date().toISOString(),
        }));
      } else {
        existing = barber.portfolio as PortfolioItem[];
      }
    }

    // Remove item by id
    const filtered = existing.filter((item) => item.id !== id);

    if (filtered.length === existing.length) {
      return res.status(404).json({
        success: false,
        error: "Portfolio item not found",
      });
    }

    const updated = await barberService.updateBarberByUserId(userId, { portfolio: filtered });
    res.status(200).json({ success: true, data: updated.portfolio });
  }),
};
