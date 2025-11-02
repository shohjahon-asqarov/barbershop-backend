import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { BookingStatus, Prisma } from "@prisma/client";

export class BookingService {
  async createBooking(
    userId: string,
    data: {
      barberId: string;
      serviceId: string;
      date: Date;
      startTime: string;
      notes?: string;
    }
  ) {
    // Use transaction to prevent concurrent bookings
    return await prisma.$transaction(async (tx) => {
      // Validate service
      const service = await tx.service.findUnique({
        where: { id: data.serviceId },
      });

      if (!service) {
        throw new NotFoundError("Service not found");
      }

      // Calculate end time
      const endTime = this.calculateEndTime(data.startTime, service.duration);

      // Check if slot is available (within transaction)
      const availabilityCheck = await this.checkAvailability(
        data.barberId,
        data.date,
        data.startTime,
        endTime,
        tx
      );

      if (!availabilityCheck.isAvailable) {
        throw new ValidationError(
          availabilityCheck.reason ||
            "Bu vaqt band qilingan yoki mavjud emas. Boshqa vaqt tanlang."
        );
      }

      // Create booking (within transaction)
      const booking = await tx.booking.create({
        data: {
          userId,
          barberId: data.barberId,
          serviceId: data.serviceId,
          date: data.date,
          startTime: data.startTime,
          endTime: endTime,
          notes: data.notes,
          status: "PENDING",
        },
        include: {
          service: true,
          barber: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      return booking;
    });
  }

  async getBookings(
    userId: string,
    filters: {
      status?: BookingStatus;
      date?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const { status, date, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: true,
        barber: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
        review: true,
      },
      orderBy: {
        date: "desc",
      },
      skip,
      take: limit,
    });

    const total = await prisma.booking.count({ where });

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBarberBookings(
    barberId: string,
    filters: {
      status?: BookingStatus;
      date?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const { status, date, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { barberId };

    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        review: true,
      },
      orderBy: {
        date: "desc",
      },
      skip,
      take: limit,
    });

    const total = await prisma.booking.count({ where });

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        barber: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Agar status COMPLETED ga o'zgargan bo'lsa, daromad statistikaga tushadi
    // Booking yakunlandi - daromad avtomatik hisoblanadi
    // Statistics service orqali realtime hisoblanadi

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        service: true,
        barber: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    return updatedBooking;
  }

  async cancelBooking(bookingId: string) {
    return this.updateBookingStatus(bookingId, "CANCELLED");
  }

  async rescheduleBooking(
    bookingId: string,
    newDate: Date,
    newStartTime: string,
    reason?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        barber: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
      throw new ValidationError(
        "Yakunlangan yoki bekor qilingan booking'ni qayta rejalashtirib bo'lmaydi"
      );
    }

    // Calculate new end time
    const endTime = this.calculateEndTime(
      newStartTime,
      booking.service.duration
    );

    // Check if new time slot is available
    const availabilityCheck = await this.checkAvailability(
      booking.barberId,
      newDate,
      newStartTime,
      endTime
    );

    if (!availabilityCheck.isAvailable) {
      throw new ValidationError(
        availabilityCheck.reason || "Bu vaqt mavjud emas"
      );
    }

    // Check for conflicts (excluding current booking)
    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(newDate);
    endOfDay.setHours(23, 59, 59, 999);

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        barberId: booking.barberId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: "CANCELLED",
        },
        id: {
          not: bookingId,
        },
        OR: [
          { startTime: { lte: newStartTime }, endTime: { gt: newStartTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: newStartTime }, endTime: { lte: endTime } },
          { startTime: { lte: newStartTime }, endTime: { gte: endTime } },
        ],
      },
    });

    if (overlappingBooking) {
      throw new ValidationError("Bu vaqt allaqachon band qilingan");
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        date: newDate,
        startTime: newStartTime,
        endTime: endTime,
        notes: reason
          ? `${booking.notes || ""}\n[Rescheduled: ${reason}]`.trim()
          : booking.notes,
      },
      include: {
        service: true,
        barber: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    return updatedBooking;
  }

  async bulkUpdateBookingStatus(
    bookingIds: string[],
    status: BookingStatus,
    reason?: string
  ) {
    if (bookingIds.length === 0) {
      throw new ValidationError("Hech bo'lmaganda bitta booking ID kerak");
    }

    return await prisma.$transaction(async (tx) => {
      const bookings = await tx.booking.findMany({
        where: {
          id: { in: bookingIds },
        },
        include: {
          service: true,
          barber: true,
          user: true,
        },
      });

      if (bookings.length !== bookingIds.length) {
        throw new NotFoundError("Ba'zi booking'lar topilmadi");
      }

      const updatedBookings = await Promise.all(
        bookings.map(async (booking) => {
          return tx.booking.update({
            where: { id: booking.id },
            data: {
              status,
              notes: reason
                ? `${booking.notes || ""}\n[Bulk Update: ${reason}]`.trim()
                : booking.notes,
            },
            include: {
              service: true,
              barber: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      phone: true,
                    },
                  },
                },
              },
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          });
        })
      );

      return updatedBookings;
    });
  }

  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    return `${endHours.toString().padStart(2, "0")}:${endMinutes
      .toString()
      .padStart(2, "0")}`;
  }

  private async checkAvailability(
    barberId: string,
    date: Date,
    startTime: string,
    endTime: string,
    prismaClient: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<{ isAvailable: boolean; reason?: string }> {
    // Check if booking date is in the past
    // Compare only dates (not datetime) to allow same day bookings
    const now = new Date();
    const bookingDateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    
    // If booking date is before today, it's invalid
    if (bookingDateOnly < todayOnly) {
      return {
        isAvailable: false,
        reason:
          "O'tgan sanani tanlash mumkin emas. Iltimos, bugun yoki kelajakni tanlang.",
      };
    }
    
    // If booking date is today, check if the time is in the past
    if (bookingDateOnly.getTime() === todayOnly.getTime()) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const bookingDateTime = new Date(date);
      bookingDateTime.setHours(hours, minutes, 0, 0);
      
      if (bookingDateTime <= now) {
        return {
          isAvailable: false,
          reason:
            "O'tib ketgan vaqtni tanlash mumkin emas. Iltimos, kelajakdagi vaqtni tanlang.",
        };
      }
    }

    // Check if barber is available on that day
    const dayOfWeek = this.getDayName(date);
    const schedule = await prismaClient.schedule.findUnique({
      where: { barberId_day: { barberId, day: dayOfWeek } },
    });

    if (!schedule || !schedule.isWorking) {
      return {
        isAvailable: false,
        reason: "Bu kunda barber ishlamaydi. Boshqa kuni tanlang.",
      };
    }

    // Check if time is within working hours
    if (startTime < schedule.startTime || endTime > schedule.endTime) {
      return {
        isAvailable: false,
        reason: `Vaqt ${schedule.startTime} - ${schedule.endTime} oralig'ida bo'lishi kerak.`,
      };
    }

    // Check for lunch break
    if (schedule.lunchStart && schedule.lunchEnd) {
      if (
        (startTime >= schedule.lunchStart && startTime < schedule.lunchEnd) ||
        (endTime > schedule.lunchStart && endTime <= schedule.lunchEnd)
      ) {
        return {
          isAvailable: false,
          reason: `Bu vaqt tushlik vaqti (${schedule.lunchStart} - ${schedule.lunchEnd}). Boshqa vaqt tanlang.`,
        };
      }
    }

    // Check for overlapping bookings
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const overlappingBooking = await prismaClient.booking.findFirst({
      where: {
        barberId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          in: ["CONFIRMED", "IN_PROGRESS", "PENDING"],
        },
        OR: [
          {
            // New booking starts within existing booking
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            // New booking ends within existing booking
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            // New booking completely overlaps existing booking
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
          {
            // Existing booking completely overlaps new booking
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    });

    if (overlappingBooking) {
      return {
        isAvailable: false,
        reason: "Bu vaqt allaqachon band qilingan. Boshqa vaqt tanlang.",
      };
    }

    return { isAvailable: true };
  }

  private getDayName(date: Date): string {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return days[date.getDay()];
  }
}
