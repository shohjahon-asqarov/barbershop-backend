import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { Prisma } from "@prisma/client";
import {
  DEFAULT_WORKING_HOURS,
  DEFAULT_WORKING_DAYS,
} from "../config/workingHours";
import { findBarberIdByUserId } from "../utils/barberUtils";

export class BarberService {
  async getAllBarbers(filters: {
    search?: string;
    minRating?: number;
    maxPrice?: number;
    sortBy?: "distance" | "rating" | "price";
    page?: number;
    limit?: number;
  }) {
    const { search, minRating, maxPrice, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BarberWhereInput = {};

    if (minRating) {
      where.rating = { gte: minRating };
    }

    // Get all barbers with optional search
    const barbers = await prisma.barber.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phone: true,
          },
        },
        services: {
          orderBy: {
            price: "asc",
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        rating: "desc",
      },
      skip,
      take: limit,
    });

    // Apply search filter
    let filteredBarbers = barbers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBarbers = barbers.filter(
        (barber) =>
          barber.user.firstName.toLowerCase().includes(searchLower) ||
          barber.user.lastName.toLowerCase().includes(searchLower) ||
          barber.specialty?.toLowerCase().includes(searchLower) ||
          barber.location?.toLowerCase().includes(searchLower)
      );
    }

    // Apply price filter
    if (maxPrice) {
      filteredBarbers = filteredBarbers.filter(
        (barber) =>
          !barber.services.length ||
          barber.services.some((service) => service.price <= maxPrice)
      );
    }

    const total = filteredBarbers.length;

    return {
      barbers: filteredBarbers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get barber by ID or by userId from token
   * Priority: If barberId is empty/undefined and userId provided → use userId
   *           If barberId is provided → try barberId first, then fallback to userId
   *
   * @param barberId - Barber ID from URL params (can be empty)
   * @param userId - User ID from JWT token (for authenticated requests)
   */
  async getBarberById(barberId: string, userId?: string) {
    const isValidBarberId = barberId && barberId.trim() !== "";
    let barber = null;

    // Helper function to get barber with all relations
    const getBarberWithRelations = (
      where: { id: string } | { userId: string }
    ) => {
      return prisma.barber.findUnique({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
              phone: true,
            },
          },
          services: true,
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      });
    };

    // Strategy 1: If barberId is NOT provided (empty/undefined) and userId exists, use userId (read-only)
    if (!isValidBarberId && userId) {
      barber = await getBarberWithRelations({ userId });
      if (barber) {
        return {
          ...barber,
          bio: barber.bio || "",
          specialty: barber.specialty || "",
          experience: barber.experience || 0,
          location: barber.location || "",
          rating: barber.rating || 0,
          totalReviews: barber.totalReviews || 0,
          isAvailable: barber.isAvailable ?? true,
          portfolio: barber.portfolio || [],
          workingDays: barber.workingDays || [],
        };
      }
    }

    // Strategy 2: If barberId is provided, try to find by barberId first
    if (isValidBarberId) {
      barber = await getBarberWithRelations({ id: barberId.trim() });
    }

    // Strategy 3: If not found by barberId and userId exists, try userId
    if (!barber && userId) {
      barber = await getBarberWithRelations({ userId });
    }

    // Strategy 4: Do not auto-create in GET. If not found, return NotFound with clear message.

    // If still not found, throw appropriate error
    if (!barber) {
      if (isValidBarberId && !userId) {
        throw new NotFoundError("Barber not found");
      }
      if (userId) {
        throw new NotFoundError("Barber profile topilmadi");
      }
      throw new NotFoundError("Barber ID yoki userId kerak");
    }

    // Ensure all fields have default values
    return {
      ...barber,
      bio: barber.bio || "",
      specialty: barber.specialty || "",
      experience: barber.experience || 0,
      location: barber.location || "",
      rating: barber.rating || 0,
      totalReviews: barber.totalReviews || 0,
      isAvailable: barber.isAvailable ?? true,
      portfolio: barber.portfolio || [],
      workingDays: barber.workingDays || [],
    };
  }

  async createBarber(
    userId: string,
    data: {
      bio?: string;
      specialty?: string;
      experience?: number;
      location?: string;
      latitude?: number;
      longitude?: number;
      image?: string;
      portfolio?: string[];
      workingDays?: string[];
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existingBarber = await tx.barber.findUnique({
        where: { userId },
      });

      if (existingBarber) {
        throw new ValidationError("Barber profile already exists");
      }

      const barber = await tx.barber.create({
        data: {
          userId,
          bio: data.bio || "",
          specialty: data.specialty || "",
          experience: data.experience || 0,
          location: data.location || "",
          latitude: data.latitude,
          longitude: data.longitude,
          image: data.image,
          portfolio: data.portfolio || [],
          workingDays: data.workingDays || [],
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      const defaultSchedule = DEFAULT_WORKING_DAYS.map((day) => ({
        day,
        startTime: DEFAULT_WORKING_HOURS.START,
        endTime: DEFAULT_WORKING_HOURS.END,
        lunchStart: DEFAULT_WORKING_HOURS.LUNCH_START,
        lunchEnd: DEFAULT_WORKING_HOURS.LUNCH_END,
        isWorking: true,
      }));

      await tx.schedule.createMany({
        data: defaultSchedule.map((schedule) => ({
          barberId: barber.id,
          ...schedule,
        })),
      });

      return barber;
    });
  }

  async updateBarberByUserId(
    userId: string,
    data: Partial<{
      bio: string;
      specialty: string;
      experience: number;
      location: string;
      latitude: number;
      longitude: number;
      image: string;
      portfolio: any; // JSON type - array of PortfolioItem
      isAvailable: boolean;
      workingDays: string[];
    }>
  ) {
    const barberId = await findBarberIdByUserId(userId);
    return this.updateBarber(barberId, data);
  }

  async updateBarber(
    barberId: string,
    data: Partial<{
      bio: string;
      specialty: string;
      experience: number;
      location: string;
      latitude: number;
      longitude: number;
      image: string;
      portfolio: any; // JSON type - array of PortfolioItem
      isAvailable: boolean;
      workingDays: string[];
    }>
  ) {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    const updatedBarber = await prisma.barber.update({
      where: { id: barberId },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return updatedBarber;
  }

  async getBarberDashboard(userId: string) {
    // Find barber by userId (token-based)
    const barber = await prisma.barber.findUnique({
      where: { userId },
      include: {
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"],
            },
          },
          include: {
            service: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
          orderBy: {
            date: "asc",
          },
        },
        services: true,
      },
    });

    // If barber profile doesn't exist, create it with default values
    if (!barber) {
      try {
        await this.createBarber(userId, {
          bio: "",
          specialty: "",
          experience: 0,
          location: "",
        });
        // Re-fetch after creation
        const newBarber = await prisma.barber.findUnique({
          where: { userId },
          include: {
            bookings: {
              where: {
                status: {
                  in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"],
                },
              },
              include: {
                service: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
              orderBy: {
                date: "asc",
              },
            },
            services: true,
          },
        });

        if (!newBarber) {
          throw new NotFoundError("Barber profile topilmadi");
        }

        const payload = this.calculateDashboardData(newBarber);
        return {
          barber: { id: newBarber.id },
          ...payload,
        };
      } catch (error) {
        throw new NotFoundError("Barber profile topilmadi");
      }
    }

    const payload = this.calculateDashboardData(barber);
    return {
      barber: { id: barber.id },
      ...payload,
    };
  }

  private calculateDashboardData(barber: {
    bookings: Array<{
      date: Date;
      status: string;
      service?: { price: number } | null;
      user?: { firstName: string; lastName: string; phone: string } | null;
    }>;
    rating: number;
    totalReviews: number;
    services: Array<unknown>;
  }) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's appointments
    const todayAppointments = barber.bookings.filter(
      (b) =>
        b.date >= todayStart && b.date <= todayEnd && b.status !== "CANCELLED"
    );

    // This week's appointments
    const thisWeekAppointments = barber.bookings.filter(
      (b) =>
        b.date >= weekStart && b.date <= weekEnd && b.status !== "CANCELLED"
    );

    // Current month revenue (only from COMPLETED bookings)
    const completedBookings = barber.bookings.filter(
      (b) => b.status === "COMPLETED" && b.date >= currentMonthStart
    );
    const currentMonthRevenue = completedBookings.reduce(
      (sum: number, b) => sum + (b.service?.price || 0),
      0
    );

    // Upcoming bookings (future appointments, not cancelled)
    const upcomingBookings = barber.bookings
      .filter(
        (b) =>
          b.date >= todayStart &&
          b.status !== "CANCELLED" &&
          b.status !== "COMPLETED"
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10); // Limit to 10

    return {
      stats: {
        todayAppointments: todayAppointments.length,
        thisWeekAppointments: thisWeekAppointments.length,
        currentMonthRevenue,
        rating: barber.rating || 0,
        totalReviews: barber.totalReviews || 0,
      },
      upcomingBookings,
      services: barber.services || [],
    };
  }
}
