import { Response } from "express";
import { OffersService } from "../services/offersService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

const offersService = new OffersService();

export const offersController = {
  getActiveOffers: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { barberId } = req.query;

    const offers = await offersService.getActiveOffers(
      barberId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: offers,
    });
  }),

  getOfferById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const offer = await offersService.getOfferById(id);

    res.status(200).json({
      success: true,
      data: offer,
    });
  }),

  createOffer: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { barberId, title, description, discount, startDate, endDate } =
      req.body;

    const offer = await offersService.createOffer({
      barberId,
      title,
      description,
      discount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    res.status(201).json({
      success: true,
      data: offer,
    });
  }),

  updateOffer: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const offer = await offersService.updateOffer(id, req.body);

    res.status(200).json({
      success: true,
      data: offer,
    });
  }),

  deleteOffer: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    await offersService.deleteOffer(id);

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  }),
};
