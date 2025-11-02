import { Response } from "express";
import { FavoritesService } from "../services/favoritesService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

const favoritesService = new FavoritesService();

export const favoritesController = {
  addToFavorites: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { barberId } = req.body;

    const favorite = await favoritesService.addToFavorites(userId, barberId);

    res.status(201).json({
      success: true,
      data: favorite,
    });
  }),

  removeFromFavorites: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { barberId } = req.params;

    const result = await favoritesService.removeFromFavorites(userId, barberId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  getMyFavorites: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const favorites = await favoritesService.getUserFavorites(userId);

    res.status(200).json({
      success: true,
      data: favorites,
    });
  }),
};
