import { NextFunction, Request, Response } from "express";
import { z } from "zod";

const isImageLike = (value: string) =>
  typeof value === "string" &&
  (value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image"));

const createBarberSchema = z.object({
  bio: z.string().max(500).optional(),
  specialty: z.string().max(100).optional(),
  experience: z.number().int().min(0).max(80).optional(),
  location: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  image: z
    .string()
    .refine(isImageLike, "Invalid image format")
    .optional(),
  portfolio: z
    .array(z.string().refine(isImageLike, "Invalid portfolio image format"))
    .optional(),
  workingDays: z.array(z.string()).optional(),
});

const updateBarberSchema = createBarberSchema.partial();

export const validateCreateBarber = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  createBarberSchema.parse(req.body);
  next();
};

export const validateUpdateBarber = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  updateBarberSchema.parse(req.body);
  next();
};

export const validateAddPortfolio = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const schema = z.object({ images: z.array(z.string().refine(isImageLike)).min(1) });
  schema.parse(req.body);
  next();
};

export const validateRemovePortfolio = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const schema = z.object({ index: z.number().int().nonnegative().optional(), url: z.string().optional() })
    .refine((data) => typeof data.index === "number" || !!data.url, {
      message: "index yoki url dan biri kerak",
    });
  schema.parse(req.body);
  next();
};
