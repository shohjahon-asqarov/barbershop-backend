import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../errors/AppError";

export class ReviewsService {
  async getBarberReviews(
    barberId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const reviews = await prisma.review.findMany({
      where: { barberId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const total = await prisma.review.count({
      where: { barberId },
    });

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createReview(
    userId: string,
    data: {
      barberId: string;
      bookingId?: string;
      rating: number;
      comment?: string;
    }
  ) {
    const { barberId, bookingId, rating, comment } = data;

    if (rating < 1 || rating > 5) {
      throw new ValidationError("Rating must be between 1 and 5");
    }

    // Check if barber exists
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    // Create review and update barber rating in transaction
    return await prisma.$transaction(async (tx) => {
      // Create review
      const review = await tx.review.create({
        data: {
          userId,
          barberId,
          bookingId,
          rating,
          comment,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          booking: {
            select: {
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update barber rating atomically
      const reviews = await tx.review.findMany({
        where: { barberId },
      });

      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      await tx.barber.update({
        where: { id: barberId },
        data: {
          rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
          totalReviews: reviews.length,
        },
      });

      return review;
    });
  }

  async getReviewStats(barberId: string) {
    const reviews = await prisma.review.findMany({
      where: { barberId },
    });

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      total: reviews.length,
      average: avgRating.toFixed(1),
      distribution: ratingDistribution,
    };
  }
}
