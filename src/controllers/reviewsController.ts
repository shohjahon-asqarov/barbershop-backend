import { Response } from "express";
import { ReviewsService } from "../services/reviewsService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

const reviewsService = new ReviewsService();

export const reviewsController = {
  createReview: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { barberId, bookingId, rating, comment } = req.body;

    const review = await reviewsService.createReview(userId, {
      barberId,
      bookingId,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  }),

  getBarberReviews: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { barberId } = req.params;
    const { page, limit } = req.query;

    const result = await reviewsService.getBarberReviews(
      barberId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  getReviewStats: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { barberId } = req.params;

    const stats = await reviewsService.getReviewStats(barberId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  }),
};
