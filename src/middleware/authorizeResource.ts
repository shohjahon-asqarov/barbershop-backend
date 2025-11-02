import { Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { AuthorizationError } from "../errors/AppError";
import { AuthRequest } from "./auth";

/**
 * Resource-based authorization middleware
 * Checks if user owns the resource or has admin access
 */

export const authorizeBookingOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.userRole!;

    // If no id parameter, skip this middleware (for routes like /me/barber)
    if (!id) {
      return next();
    }

    // Admin can access any booking
    if (userRole === "ADMIN") {
      return next();
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { userId: true, barberId: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Check if user is the booking owner
    if (booking.userId === userId) {
      return next();
    }

    // Check if user is the barber for this booking
    if (userRole === "BARBER") {
      const barber = await prisma.barber.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (barber && booking.barberId === barber.id) {
        return next();
      }
    }

    throw new AuthorizationError(
      "You don't have permission to access this booking"
    );
  } catch (error) {
    next(error);
  }
};

export const authorizeBarberOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const userRole = req.userRole!;

    // Admin can access any barber
    if (userRole === "ADMIN") {
      return next();
    }

    const barber = await prisma.barber.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barber not found",
      });
    }

    // Check if user owns this barber profile
    if (barber.userId === userId) {
      return next();
    }

    throw new AuthorizationError(
      "You don't have permission to access this barber profile"
    );
  } catch (error) {
    next(error);
  }
};

export const authorizeServiceOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, barberId } = req.params;
    const userId = req.userId!;
    const userRole = req.userRole!;

    // Admin can access any service
    if (userRole === "ADMIN") {
      return next();
    }

    // Get service to find its barber
    const service = id
      ? await prisma.service.findUnique({
          where: { id },
          select: { barberId: true },
        })
      : null;

    const targetBarberId = barberId || service?.barberId;

    if (!targetBarberId) {
      return res.status(404).json({
        success: false,
        error: "Service or barber not found",
      });
    }

    // Check if user owns the barber that owns this service
    const barber = await prisma.barber.findUnique({
      where: { id: targetBarberId },
      select: { userId: true },
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barber not found",
      });
    }

    if (barber.userId === userId) {
      return next();
    }

    throw new AuthorizationError(
      "You don't have permission to access this service"
    );
  } catch (error) {
    next(error);
  }
};
