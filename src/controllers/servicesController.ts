import { Response } from "express";
import { ServicesService } from "../services/servicesService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

const servicesService = new ServicesService();

export const servicesController = {
  // Get authenticated barber's services (using token)
  getMyServices: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const services = await servicesService.getBarberServicesByUserId(userId);

    res.status(200).json({
      success: true,
      data: services,
    });
  }),

  // Get services by barberId (public endpoint for viewing other barbers)
  getBarberServices: asyncHandler(
    async (req: AuthRequest | Request, res: Response) => {
      const { barberId } = req.params;

      const services = await servicesService.getBarberServices(barberId);

      res.status(200).json({
        success: true,
        data: services,
      });
    }
  ),

  // Create service for authenticated barber (using token)
  createService: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { name, description, duration, price } = req.body;

    const service = await servicesService.createServiceByUserId(userId, {
      name,
      description,
      duration,
      price,
    });

    res.status(201).json({
      success: true,
      data: service,
    });
  }),

  updateService: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const service = await servicesService.updateService(id, req.body);

    res.status(200).json({
      success: true,
      data: service,
    });
  }),

  deleteService: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await servicesService.deleteService(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),
};
