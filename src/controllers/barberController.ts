import { Request, Response } from "express";
import { BarberService } from "../services/barberService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

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

  // Add portfolio images to authenticated barber
  addPortfolioImages: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { images } = req.body as { images: string[] };

    const current = await barberService.updateBarberByUserId(userId, {});
    const existing = Array.isArray(current.portfolio) ? current.portfolio : [];
    const combined = Array.from(new Set([...(existing as string[]), ...images])).slice(0, 20);

    const updated = await barberService.updateBarberByUserId(userId, { portfolio: combined });

    res.status(200).json({ success: true, data: updated.portfolio });
  }),

  // Remove portfolio image by index or url for authenticated barber
  removePortfolioImage: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { index, url } = req.body as { index?: number; url?: string };

    const current = await barberService.updateBarberByUserId(userId, {});
    const existing = Array.isArray(current.portfolio) ? (current.portfolio as string[]) : [];

    let next = existing;
    if (typeof index === "number") {
      next = existing.filter((_, i) => i !== index);
    } else if (url) {
      next = existing.filter((u) => u !== url);
    }

    const updated = await barberService.updateBarberByUserId(userId, { portfolio: next });
    res.status(200).json({ success: true, data: updated.portfolio });
  }),
};
