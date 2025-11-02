import { prisma } from "../config/database";
import { NotFoundError } from "../errors/AppError";

export class ClientManagementService {
  // Get barber's clients (users who have bookings with this barber)
  async getBarberClients(barberId: string, filters?: { search?: string; limit?: number }) {
    const { search, limit = 100 } = filters || {};

    // Get all completed bookings for this barber to get unique clients
    const bookings = await prisma.booking.findMany({
      where: {
        barberId,
        status: "COMPLETED", // Only completed bookings count
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Group by user and calculate statistics
    const clientsMap = new Map();

    bookings.forEach((booking) => {
      const userId = booking.userId;
      
      if (!clientsMap.has(userId)) {
        clientsMap.set(userId, {
          user: booking.user,
          totalBookings: 0,
          totalSpent: 0,
          lastVisit: null,
          favoriteServices: [] as Array<{ id: string; name: string; count: number }>,
          allBookings: [] as any[],
        });
      }

      const client = clientsMap.get(userId);
      client.totalBookings += 1;
      client.totalSpent += booking.service.price;
      
      if (!client.lastVisit || booking.date > client.lastVisit) {
        client.lastVisit = booking.date;
      }

      // Track favorite services
      const serviceIndex = client.favoriteServices.findIndex(
        (s: any) => s.id === booking.service.id
      );
      if (serviceIndex >= 0) {
        client.favoriteServices[serviceIndex].count += 1;
      } else {
        client.favoriteServices.push({
          id: booking.service.id,
          name: booking.service.name,
          count: 1,
        });
      }

      client.allBookings.push(booking);
    });

    // Convert to array and sort by last visit
    let clients = Array.from(clientsMap.values()).map((client) => ({
      ...client,
      favoriteServices: client.favoriteServices
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3), // Top 3 favorite services
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(
        (client) =>
          client.user.firstName.toLowerCase().includes(searchLower) ||
          client.user.lastName.toLowerCase().includes(searchLower) ||
          client.user.phone.includes(search)
      );
    }

    // Sort by last visit (most recent first)
    clients.sort((a, b) => {
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return b.lastVisit.getTime() - a.lastVisit.getTime();
    });

    // Apply limit
    if (limit) {
      clients = clients.slice(0, limit);
    }

    return clients;
  }

  // Get client detail with full history
  async getClientDetail(barberId: string, userId: string) {
    // Verify barber exists
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Client not found");
    }

    // Get all bookings for this client with this barber
    const bookings = await prisma.booking.findMany({
      where: {
        barberId,
        userId,
      },
      include: {
        service: true,
        review: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Get client note if exists
    const clientNote = await prisma.clientNote.findUnique({
      where: {
        barberId_userId: {
          barberId,
          userId,
        },
      },
    });

    // Calculate statistics
    const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
    const totalSpent = completedBookings.reduce(
      (sum, b) => sum + (b.service?.price || 0),
      0
    );

    // Payment type breakdown
    const cashBookings = completedBookings.filter((b) => b.paymentType === "CASH");
    const cardBookings = completedBookings.filter((b) => b.paymentType === "CARD");

    // Favorite services
    const serviceCounts = new Map();
    completedBookings.forEach((b) => {
      const serviceId = b.serviceId;
      serviceCounts.set(
        serviceId,
        (serviceCounts.get(serviceId) || 0) + 1
      );
    });

    const favoriteServices = Array.from(serviceCounts.entries())
      .map(([serviceId, count]) => {
        const service = completedBookings.find((b) => b.serviceId === serviceId)?.service;
        return {
          id: serviceId,
          name: service?.name || "Unknown",
          count: count as number,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      user,
      clientNote: clientNote?.note || null,
      statistics: {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        totalSpent,
        averageBookingValue: completedBookings.length > 0 
          ? totalSpent / completedBookings.length 
          : 0,
        paymentTypes: {
          cash: cashBookings.length,
          card: cardBookings.length,
        },
        favoriteServices,
      },
      bookings,
    };
  }

  // Create or update client note
  async upsertClientNote(barberId: string, userId: string, note: string) {
    // Verify barber exists
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    return await prisma.clientNote.upsert({
      where: {
        barberId_userId: {
          barberId,
          userId,
        },
      },
      create: {
        barberId,
        userId,
        note,
      },
      update: {
        note,
      },
    });
  }

  // Delete client note
  async deleteClientNote(barberId: string, userId: string) {
    return await prisma.clientNote.delete({
      where: {
        barberId_userId: {
          barberId,
          userId,
        },
      },
    });
  }
}

