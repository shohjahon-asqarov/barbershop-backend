import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password too long"),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    role: z.enum(["USER", "BARBER", "ADMIN"], {
      required_error: "Role is required",
      invalid_type_error: "Role must be USER, BARBER, or ADMIN",
    }),
  }),
});

const loginSchema = z.object({
  body: z
    .object({
      email: z.string().email().optional(),
      phone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/)
        .optional(),
      password: z.string().min(1, "Password is required"),
    })
    .refine((data) => data.email || data.phone, {
      message: "Either email or phone must be provided",
    }),
});

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    registerSchema.parse({ body: req.body });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    loginSchema.parse({ body: req.body });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
        details: error.errors,
      });
    }
    next(error);
  }
};
