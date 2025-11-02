import { Response } from "express";
import { BookingService } from "../services/bookingService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";
import { BookingStatus } from "@prisma/client";
import { prisma } from "../config/database";

const bookingService = new BookingService();

export const bookingController = {
  createBooking: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { barberId, serviceId, date, startTime, paymentType, notes } = req.body;

    // Parse date string to Date object, handling potential timezone issues
    // If date is a string like "2024-11-03", create date in local timezone
    let bookingDate: Date;
    if (typeof date === 'string') {
      // Parse YYYY-MM-DD format
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        bookingDate = new Date(year, month, day, 0, 0, 0, 0);
      } else {
        bookingDate = new Date(date);
      }
    } else {
      bookingDate = date instanceof Date ? date : new Date(date);
    }

    const booking = await bookingService.createBooking(userId, {
      barberId,
      serviceId,
      date: bookingDate,
      startTime,
      paymentType,
      notes,
    });

    // Create notification for barber - new booking request
    try {
      const barber = await prisma.barber.findUnique({
        where: { id: barberId },
        select: { userId: true, user: { select: { firstName: true, lastName: true } } },
      });

      if (barber) {
        await notificationService.createNotification({
          userId: barber.userId,
          type: "BOOKING_CREATED",
          title: "Yangi bandlik so'rovi",
          message: `${booking.user.firstName} ${booking.user.lastName} bandlik so'rovi yubordi`,
          bookingId: booking.id,
          metadata: {
            serviceName: booking.service.name,
            date: date,
            time: startTime,
          },
        });
      }

      // Notification for user - booking created
      await notificationService.createNotification({
        userId: userId,
        type: "BOOKING_CREATED",
        title: "Bandlik so'rovi yuborildi",
        message: `Barber "${barber?.user.firstName} ${barber?.user.lastName}" sizning so'rovingizni ko'rib chiqmoqda`,
        bookingId: booking.id,
        metadata: {
          serviceName: booking.service.name,
          date: date,
          time: startTime,
        },
      });
    } catch (error) {
      // Don't fail booking creation if notification fails
      console.error("Failed to create notification:", error);
    }

    res.status(201).json({
      success: true,
      data: booking,
    });
  }),

  getMyBookings: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { status, date, page, limit } = req.query;

    const result = await bookingService.getBookings(userId, {
      status: status as BookingStatus | undefined,
      date: date ? new Date(date as string) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  getBarberBookings: asyncHandler(async (req: AuthRequest, res: Response) => {
    const barberId = req.params.id;
    const { status, date, page, limit } = req.query;

    const result = await bookingService.getBarberBookings(barberId, {
      status: status as BookingStatus | undefined,
      date: date ? new Date(date as string) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  // Token-based: get bookings for authenticated barber
  getMyBarberBookings: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { status, date, page, limit } = req.query;

    // Find barber by userId first
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      return res
        .status(404)
        .json({ success: false, error: "Barber profile topilmadi" });
    }

    const result = await bookingService.getBarberBookings(barber.id, {
      status: status as BookingStatus | undefined,
      date: date ? new Date(date as string) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100, // Increase limit to show more bookings
    });

    res.status(200).json({ success: true, data: result });
  }),

  updateBookingStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await bookingService.updateBookingStatus(id, status);

    // Create notifications based on status change
    try {
      let notificationType: "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "BOOKING_STATUS_CHANGED" = "BOOKING_STATUS_CHANGED";
      let userTitle = "";
      let userMessage = "";
      let barberTitle = "";
      let barberMessage = "";

      if (status === "CONFIRMED") {
        notificationType = "BOOKING_CONFIRMED";
        userTitle = "Bandlik tasdiqlandi";
        userMessage = `Barber "${booking.barber.user.firstName} ${booking.barber.user.lastName}" sizning bandligingizni tasdiqladi`;
        barberTitle = "Bandlik tasdiqlandi";
        barberMessage = `Siz "${booking.user.firstName} ${booking.user.lastName}" uchun bandlikni tasdiqladingiz`;
      } else if (status === "CANCELLED") {
        notificationType = "BOOKING_CANCELLED";
        userTitle = "Bandlik bekor qilindi";
        userMessage = `Barber "${booking.barber.user.firstName} ${booking.barber.user.lastName}" bandlikni bekor qildi`;
        barberTitle = "Bandlik bekor qilindi";
        barberMessage = `Siz "${booking.user.firstName} ${booking.user.lastName}" uchun bandlikni bekor qildingiz`;
      } else {
        userTitle = "Bandlik holati o'zgardi";
        userMessage = `Bandlik holati "${status}" ga o'zgardi`;
        barberTitle = "Bandlik holati o'zgardi";
        barberMessage = `Bandlik holati "${status}" ga o'zgardi`;
      }

      // Notification for user
      await notificationService.createNotification({
        userId: booking.userId,
        type: notificationType,
        title: userTitle,
        message: userMessage,
        bookingId: booking.id,
        metadata: {
          status,
          serviceName: booking.service.name,
        },
      });

      // Notification for barber
      await notificationService.createNotification({
        userId: booking.barber.userId,
        type: notificationType,
        title: barberTitle,
        message: barberMessage,
        bookingId: booking.id,
        metadata: {
          status,
          serviceName: booking.service.name,
        },
      });
    } catch (error) {
      // Don't fail status update if notification fails
      console.error("Failed to create notification:", error);
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  }),

  cancelBooking: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const booking = await bookingService.cancelBooking(id);

    res.status(200).json({
      success: true,
      data: booking,
    });
  }),

  rescheduleBooking: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { date, startTime, reason } = req.body;

    const booking = await bookingService.rescheduleBooking(
      id,
      new Date(date),
      startTime,
      reason
    );

    res.status(200).json({
      success: true,
      data: booking,
    });
  }),

  bulkUpdateStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { bookingIds, status, reason } = req.body;

    const bookings = await bookingService.bulkUpdateBookingStatus(
      bookingIds,
      status,
      reason
    );

    res.status(200).json({
      success: true,
      data: bookings,
      message: `${bookings.length} ta booking yangilandi`,
    });
  }),
};
