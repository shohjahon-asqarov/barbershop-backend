import { Response } from "express";
import { NotificationService } from "../services/notificationService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

const notificationService = new NotificationService();

export const notificationController = {
  getMyNotifications: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { read, limit } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      read: read === "true" ? true : read === "false" ? false : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  markAsRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      data: notification,
    });
  }),

  markAllAsRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "Barcha xabarnomalar o'qilgan deb belgilandi",
    });
  }),

  deleteNotification: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    await notificationService.deleteNotification(id, userId);

    res.status(200).json({
      success: true,
      message: "Xabarnoma o'chirildi",
    });
  }),
};

