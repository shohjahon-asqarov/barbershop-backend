import { prisma } from "../config/database";
import { NotificationType } from "@prisma/client";

export class NotificationService {
  // Create notification
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    bookingId?: string;
    metadata?: any;
  }) {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        bookingId: data.bookingId,
        metadata: data.metadata || {},
      },
    });
  }

  // Get user notifications
  async getUserNotifications(userId: string, filters?: { read?: boolean; limit?: number }) {
    const { read, limit = 50 } = filters || {};
    
    const where: any = { userId };
    if (read !== undefined) {
      where.read = read;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        booking: {
          include: {
            service: true,
            barber: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return {
      notifications,
      unreadCount,
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: { read: true },
    });
  }

  // Mark all as read
  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string) {
    return await prisma.notification.delete({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
    });
  }
}

