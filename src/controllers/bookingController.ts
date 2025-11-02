import { Response } from "express";
import { BookingService } from "../services/bookingService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";
import { BookingStatus } from "@prisma/client";

const bookingService = new BookingService();

export const bookingController = {
  createBooking: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { barberId, serviceId, date, startTime, notes } = req.body;

    const booking = await bookingService.createBooking(userId, {
      barberId,
      serviceId,
      date: new Date(date),
      startTime,
      notes,
    });

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
