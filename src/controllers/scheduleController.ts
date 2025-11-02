import { Response } from "express";
import { ScheduleService } from "../services/scheduleService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

const scheduleService = new ScheduleService();

export const scheduleController = {
  // Get authenticated barber's schedule (uses token)
  getMySchedule: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const weekStart = req.query.weekStart as string;

    const schedule = await scheduleService.getBarberScheduleByUserId(
      userId,
      weekStart ? new Date(weekStart) : undefined
    );

    res.status(200).json({
      success: true,
      data: schedule,
    });
  }),

  // Get schedule by barberId (public endpoint for viewing other barbers)
  getBarberSchedule: asyncHandler(async (req: AuthRequest | Request, res: Response) => {
    const { barberId } = req.params;
    const weekStart = req.query.weekStart as string;

    const schedule = await scheduleService.getBarberSchedule(
      barberId,
      weekStart ? new Date(weekStart) : undefined
    );

    res.status(200).json({
      success: true,
      data: schedule,
    });
  }),

  // Update authenticated barber's schedule (uses token)
  updateSchedule: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const result = await scheduleService.updateBarberScheduleByUserId(userId, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),
};

