import { prisma } from "../config/database";
import { NotFoundError, ConflictError } from "../errors/AppError";

export class FavoritesService {
  async addToFavorites(userId: string, barberId: string) {
    // Check if barber exists
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    // Check if already favorite
    const existing = await prisma.favorite.findUnique({
      where: { userId_barberId: { userId, barberId } },
    });

    if (existing) {
      throw new ConflictError("Barber is already in favorites");
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        barberId,
      },
      include: {
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
            services: {
              orderBy: {
                price: "asc",
              },
              take: 1,
            },
          },
        },
      },
    });

    return favorite;
  }

  async removeFromFavorites(userId: string, barberId: string) {
    const favorite = await prisma.favorite.findUnique({
      where: { userId_barberId: { userId, barberId } },
    });

    if (!favorite) {
      throw new NotFoundError("Barber not in favorites");
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return { message: "Removed from favorites" };
  }

  async getUserFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        barber: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatar: true,
                email: true,
              },
            },
            services: {
              orderBy: {
                price: "asc",
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return favorites.map((fav) => ({
      id: fav.id,
      barber: {
        ...fav.barber,
        name: `${fav.barber.user.firstName} ${fav.barber.user.lastName}`,
        image: fav.barber.image,
        rating: fav.barber.rating,
        totalReviews: fav.barber.totalReviews,
        location: fav.barber.location,
        distance: "2.3 km", // To be calculated
        available: fav.barber.isAvailable,
        priceFrom: fav.barber.services[0]?.price || 0,
      },
      createdAt: fav.createdAt,
    }));
  }
}
