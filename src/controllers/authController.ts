import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";

const authService = new AuthService();

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email, phone, password, firstName, lastName, role } = req.body;

    const result = await authService.register({
      email,
      phone,
      password,
      firstName,
      lastName,
      role,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, phone, password } = req.body;

    const result = await authService.login({
      email,
      phone,
      password,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { firstName, lastName, email, phone, avatar } = req.body;

    const user = await authService.updateUser(userId, {
      firstName,
      lastName,
      email,
      phone,
      avatar,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  }),
};
