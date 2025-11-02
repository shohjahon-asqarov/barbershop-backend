import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../errors/AppError";
import {
  SERVICE_LIMITS,
  SERVICE_VALIDATION_MESSAGES,
} from "../config/serviceLimits";
import { findBarberIdByUserId } from "../utils/barberUtils";

export class ServicesService {
  async getBarberServicesByUserId(userId: string) {
    const barberId = await findBarberIdByUserId(userId);

    const services = await prisma.service.findMany({
      where: { barberId },
      orderBy: {
        price: "asc",
      },
    });

    return services;
  }

  async getBarberServices(barberId: string) {
    const services = await prisma.service.findMany({
      where: { barberId },
      orderBy: {
        price: "asc",
      },
    });

    return services;
  }

  async createServiceByUserId(
    userId: string,
    data: {
      name: string;
      description?: string;
      duration: number;
      price: number;
    }
  ) {
    const barberId = await findBarberIdByUserId(userId);
    return this.createService(barberId, data);
  }

  async createService(
    barberId: string,
    data: {
      name: string;
      description?: string;
      duration: number;
      price: number;
    }
  ) {
    // Validate name
    if (
      !data.name ||
      data.name.trim().length < SERVICE_LIMITS.NAME.MIN_LENGTH
    ) {
      throw new ValidationError(SERVICE_VALIDATION_MESSAGES.NAME_REQUIRED);
    }

    if (data.name.length > SERVICE_LIMITS.NAME.MAX_LENGTH) {
      throw new ValidationError(SERVICE_VALIDATION_MESSAGES.NAME_TOO_LONG);
    }

    // Validate description if provided
    if (
      data.description &&
      data.description.length > SERVICE_LIMITS.DESCRIPTION.MAX_LENGTH
    ) {
      throw new ValidationError(
        SERVICE_VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG
      );
    }

    // Validate service duration
    if (
      data.duration < SERVICE_LIMITS.DURATION.MIN_MINUTES ||
      data.duration > SERVICE_LIMITS.DURATION.MAX_MINUTES
    ) {
      throw new ValidationError(SERVICE_VALIDATION_MESSAGES.DURATION_INVALID);
    }

    // Validate price
    if (data.price <= 0) {
      throw new ValidationError(SERVICE_VALIDATION_MESSAGES.PRICE_POSITIVE);
    }

    if (data.price < SERVICE_LIMITS.PRICE.MIN) {
      throw new ValidationError(SERVICE_VALIDATION_MESSAGES.PRICE_MIN);
    }

    if (data.price > SERVICE_LIMITS.PRICE.MAX) {
      throw new ValidationError(SERVICE_VALIDATION_MESSAGES.PRICE_MAX);
    }

    // Check if barber exists
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) {
      throw new NotFoundError("Barber topilmadi");
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        barberId,
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: data.price,
      },
    });

    return service;
  }

  async updateService(
    serviceId: string,
    data: Partial<{
      name: string;
      description: string;
      duration: number;
      price: number;
    }>
  ) {
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundError("Service not found");
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (
        !data.name ||
        data.name.trim().length < SERVICE_LIMITS.NAME.MIN_LENGTH
      ) {
        throw new ValidationError(SERVICE_VALIDATION_MESSAGES.NAME_REQUIRED);
      }
      if (data.name.length > SERVICE_LIMITS.NAME.MAX_LENGTH) {
        throw new ValidationError(SERVICE_VALIDATION_MESSAGES.NAME_TOO_LONG);
      }
    }

    // Validate description if provided
    if (
      data.description !== undefined &&
      data.description &&
      data.description.length > SERVICE_LIMITS.DESCRIPTION.MAX_LENGTH
    ) {
      throw new ValidationError(
        SERVICE_VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG
      );
    }

    // Validate duration if provided
    if (data.duration !== undefined) {
      if (
        data.duration < SERVICE_LIMITS.DURATION.MIN_MINUTES ||
        data.duration > SERVICE_LIMITS.DURATION.MAX_MINUTES
      ) {
        throw new ValidationError(SERVICE_VALIDATION_MESSAGES.DURATION_INVALID);
      }
    }

    // Validate price if provided
    if (data.price !== undefined) {
      if (data.price <= 0) {
        throw new ValidationError(SERVICE_VALIDATION_MESSAGES.PRICE_POSITIVE);
      }
      if (data.price < SERVICE_LIMITS.PRICE.MIN) {
        throw new ValidationError(SERVICE_VALIDATION_MESSAGES.PRICE_MIN);
      }
      if (data.price > SERVICE_LIMITS.PRICE.MAX) {
        throw new ValidationError(SERVICE_VALIDATION_MESSAGES.PRICE_MAX);
      }
    }

    // Update service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data,
    });

    return updatedService;
  }

  async deleteService(serviceId: string) {
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundError("Service not found");
    }

    // Delete service
    await prisma.service.delete({
      where: { id: serviceId },
    });

    return { message: "Service deleted successfully" };
  }
}
