import { prisma } from "../config/database";
import { NotFoundError } from "../errors/AppError";
import { Prisma } from "@prisma/client";

export class OffersService {
  async getActiveOffers(barberId?: string) {
    const now = new Date();

    const where: Prisma.OfferWhereInput = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (barberId) {
      where.barberId = barberId;
    } else {
      // Global offers (no specific barber)
      where.barberId = null;
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      startDate: offer.startDate,
      endDate: offer.endDate,
      isActive: offer.isActive,
      barberId: offer.barberId,
      // Generate promo code from title
      code: this.generatePromoCode(offer.title),
    }));
  }

  async getOfferById(id: string) {
    const offer = await prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundError("Offer not found");
    }

    return offer;
  }

  async createOffer(data: {
    barberId?: string;
    title: string;
    description?: string;
    discount: number;
    startDate: Date;
    endDate: Date;
  }) {
    return await prisma.offer.create({
      data: {
        barberId: data.barberId || null,
        title: data.title,
        description: data.description,
        discount: data.discount,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
      },
    });
  }

  async updateOffer(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      discount: number;
      startDate: Date;
      endDate: Date;
      isActive: boolean;
    }>
  ) {
    const offer = await prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundError("Offer not found");
    }

    return await prisma.offer.update({
      where: { id },
      data,
    });
  }

  async deleteOffer(id: string) {
    const offer = await prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundError("Offer not found");
    }

    return await prisma.offer.delete({
      where: { id },
    });
  }

  private generatePromoCode(title: string): string {
    // Generate promo code from title (e.g., "Birinchi kelganlar uchun" -> "BIRINCHI")
    const words = title.toUpperCase().split(" ");
    if (words.length >= 1) {
      const firstWord = words[0].substring(0, 8);
      const random = Math.floor(Math.random() * 100);
      return `${firstWord}${random}`;
    }
    return `PROMO${Math.floor(Math.random() * 10000)}`;
  }
}
