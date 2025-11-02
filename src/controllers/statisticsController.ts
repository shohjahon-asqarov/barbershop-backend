import { Response } from "express";
import { StatisticsService } from "../services/statisticsService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

const statisticsService = new StatisticsService();

export const statisticsController = {
  // Get authenticated barber's statistics (uses token)
  getMyStatistics: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const stats = await statisticsService.getBarberStatisticsByUserId(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  }),

  // Get statistics by barberId (admin only)
  getBarberStatistics: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const stats = await statisticsService.getBarberStatistics(id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  }),

  // Get authenticated barber's monthly stats (uses token)
  getMonthlyStats: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const months = req.query.months ? Number(req.query.months) : 6;

    const monthlyStats = await statisticsService.getMonthlyStatsByUserId(userId, months);

    res.status(200).json({
      success: true,
      data: monthlyStats,
    });
  }),

  // Get authenticated barber's peak hours (uses token)
  getPeakHours: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const peakHours = await statisticsService.getPeakHoursByUserId(userId);

    res.status(200).json({
      success: true,
      data: peakHours,
    });
  }),
};
