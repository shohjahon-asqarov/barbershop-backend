import { Response } from "express";
import { ClientManagementService } from "../services/clientManagementService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/database";

const clientManagementService = new ClientManagementService();

export const clientManagementController = {
  getMyClients: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { search, limit } = req.query;

    // Find barber by userId
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barber profile topilmadi",
      });
    }

    const clients = await clientManagementService.getBarberClients(barber.id, {
      search: search as string | undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      data: clients,
    });
  }),

  getClientDetail: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { clientId } = req.params;

    // Find barber by userId
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barber profile topilmadi",
      });
    }

    const clientDetail = await clientManagementService.getClientDetail(
      barber.id,
      clientId
    );

    res.status(200).json({
      success: true,
      data: clientDetail,
    });
  }),

  upsertClientNote: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { clientId } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Eslatma bo'sh bo'lishi mumkin emas",
      });
    }

    // Find barber by userId
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barber profile topilmadi",
      });
    }

    const clientNote = await clientManagementService.upsertClientNote(
      barber.id,
      clientId,
      note.trim()
    );

    res.status(200).json({
      success: true,
      data: clientNote,
    });
  }),

  deleteClientNote: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { clientId } = req.params;

    // Find barber by userId
    const barber = await prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: "Barber profile topilmadi",
      });
    }

    await clientManagementService.deleteClientNote(barber.id, clientId);

    res.status(200).json({
      success: true,
      message: "Eslatma o'chirildi",
    });
  }),
};

