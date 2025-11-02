import { prisma } from "../config/database";
import { NotFoundError } from "../errors/AppError";

export class StatisticsService {
  async getBarberStatisticsByUserId(userId: string) {
    // Find barber by userId
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundError("Barber profile topilmadi");
    }

    return this.getBarberStatistics(barber.id);
  }

  async getBarberStatistics(barberId: string) {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        bookings: {
          include: {
            service: true,
            user: true,
          },
        },
        services: true,
        reviews: true,
      },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    // Get current date range
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ✅ COMPLETED bookinglar FAQAT daromadga tushadi
    const completedBookings = barber.bookings.filter(
      (b) => b.status === "COMPLETED"
    );

    // Monthly revenue - faqat COMPLETED bookinglar
    const currentMonthRevenue = completedBookings
      .filter((b) => b.date >= currentMonthStart)
      .reduce((sum, b) => sum + (b.service?.price || 0), 0);

    const lastMonthRevenue = completedBookings
      .filter((b) => b.date >= lastMonthStart && b.date < currentMonthStart)
      .reduce((sum, b) => sum + (b.service?.price || 0), 0);

    const revenueChange =
      lastMonthRevenue > 0
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    // Clients count - faqat COMPLETED bookings
    const currentMonthClients = completedBookings.filter(
      (b) => b.date >= currentMonthStart
    ).length;

    const lastMonthClients = completedBookings.filter(
      (b) => b.date >= lastMonthStart && b.date < currentMonthStart
    ).length;

    const clientsChange =
      lastMonthClients > 0
        ? ((currentMonthClients - lastMonthClients) / lastMonthClients) * 100
        : 0;

    // Booking days count
    const bookedDaysCount = new Set(
      barber.bookings
        .filter((b) => b.date >= currentMonthStart && b.status !== "CANCELLED")
        .map((b) => b.date.toISOString().split("T")[0])
    ).size;

    // Average rating
    const avgRating =
      barber.reviews.length > 0
        ? barber.reviews.reduce((sum, r) => sum + r.rating, 0) /
          barber.reviews.length
        : 0;

    // Top services - faqat COMPLETED bookings hisoblanadi
    const serviceStats = barber.services.map((service) => {
      const serviceBookings = completedBookings.filter(
        (b) => b.serviceId === service.id
      );
      const totalRevenue = serviceBookings.reduce(
        (sum, b) => sum + (b.service?.price || 0),
        0
      );
      return {
        id: service.id,
        name: service.name,
        count: serviceBookings.length,
        totalRevenue,
        percentage:
          currentMonthClients > 0
            ? (serviceBookings.length / currentMonthClients) * 100
            : 0,
      };
    });

    // Payment type statistics - faqat COMPLETED bookings
    const cashBookings = completedBookings.filter(
      (b) => b.paymentType === "CASH"
    );
    const cardBookings = completedBookings.filter(
      (b) => b.paymentType === "CARD"
    );

    const cashRevenue = cashBookings.reduce(
      (sum, b) => sum + (b.service?.price || 0),
      0
    );
    const cardRevenue = cardBookings.reduce(
      (sum, b) => sum + (b.service?.price || 0),
      0
    );

    const paymentTypeStats = {
      cash: {
        count: cashBookings.length,
        revenue: cashRevenue,
        percentage:
          completedBookings.length > 0
            ? (cashBookings.length / completedBookings.length) * 100
            : 0,
      },
      card: {
        count: cardBookings.length,
        revenue: cardRevenue,
        percentage:
          completedBookings.length > 0
            ? (cardBookings.length / completedBookings.length) * 100
            : 0,
      },
      total: completedBookings.length,
    };

    return {
      revenue: {
        current: currentMonthRevenue,
        previous: lastMonthRevenue,
        change: revenueChange,
        trend: revenueChange >= 0 ? "up" : "down",
        formatted: currentMonthRevenue.toLocaleString("uz-UZ"),
      },
      clients: {
        current: currentMonthClients,
        previous: lastMonthClients,
        change: clientsChange,
        trend: clientsChange >= 0 ? "up" : "down",
      },
      bookings: {
        current: bookedDaysCount,
      },
      rating: {
        average: avgRating.toFixed(1),
        total: barber.reviews.length,
      },
      topServices: serviceStats.sort((a, b) => b.count - a.count).slice(0, 5),
      satisfaction: {
        positiveReviews: Math.round(
          (barber.reviews.filter((r) => r.rating >= 4).length /
            barber.reviews.length) *
            100 || 0
        ),
        returningClients: 0, // To be calculated based on history
        averageRating: avgRating.toFixed(1),
      },
      paymentTypes: paymentTypeStats,
    };
  }

  async getMonthlyStatsByUserId(userId: string, months: number = 6) {
    // Find barber by userId
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundError("Barber profile topilmadi");
    }

    return this.getMonthlyStats(barber.id, months);
  }

  async getMonthlyStats(barberId: string, months: number = 6) {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        bookings: {
          include: {
            service: true,
            user: true,
          },
        },
      },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    const monthlyData = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthBookings = barber.bookings.filter(
        (b) =>
          b.date >= monthStart && b.date <= monthEnd && b.status === "COMPLETED"
      );

      const clients = monthBookings.length;
      const revenue = monthBookings.reduce(
        (sum, b) => sum + (b.service?.price || 0),
        0
      );

      const monthNames = [
        "Yanvar",
        "Fevral",
        "Mart",
        "Aprel",
        "May",
        "Iyun",
        "Iyul",
        "Avgust",
        "Sentabr",
        "Oktabr",
        "Noyabr",
        "Dekabr",
      ];

      monthlyData.push({
        month: monthNames[monthStart.getMonth()],
        year: monthStart.getFullYear(),
        clients,
        revenue,
        formattedRevenue: revenue.toLocaleString("uz-UZ"),
      });
    }

    return monthlyData;
  }

  async getPeakHoursByUserId(userId: string) {
    // Find barber by userId
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundError("Barber profile topilmadi");
    }

    return this.getPeakHours(barber.id);
  }

  async getPeakHours(barberId: string) {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        bookings: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    // Get current month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthBookings = barber.bookings.filter(
      (b) => b.date >= currentMonthStart && b.status !== "CANCELLED"
    );

    // Group by time slots
    const timeSlots = [
      { start: "09:00", end: "10:00" },
      { start: "10:00", end: "12:00" },
      { start: "12:00", end: "14:00" },
      { start: "14:00", end: "16:00" },
      { start: "16:00", end: "18:00" },
    ];

    const peakHours = timeSlots.map((slot) => {
      const bookingsInSlot = currentMonthBookings.filter((b) => {
        const bookingHour = parseInt(b.startTime.split(":")[0]);
        const slotStart = parseInt(slot.start.split(":")[0]);
        const slotEnd = parseInt(slot.end.split(":")[0]);
        return bookingHour >= slotStart && bookingHour < slotEnd;
      });

      const totalBookings = currentMonthBookings.length;
      const load =
        totalBookings > 0 ? (bookingsInSlot.length / totalBookings) * 100 : 0;

      return {
        time: `${slot.start} - ${slot.end}`,
        load: Math.round(load),
        bookings: bookingsInSlot.length,
      };
    });

    return peakHours.sort((a, b) => b.load - a.load);
  }
}
