import { NextFunction, Request, Response } from "express";
import { z } from "zod";

const isImageLike = (value: string) =>
  typeof value === "string" &&
  (value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image"));

// Portfolio item schema
const portfolioItemSchema = z.object({
  image: z.string().refine(isImageLike, "Invalid image format"),
  title: z.string().min(1).max(100, "Title must be max 100 characters"),
  description: z.string().max(500, "Description must be max 500 characters").optional(),
  category: z.string().max(50, "Category must be max 50 characters").optional(),
});

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

// Validate add portfolio items
export const validateAddPortfolio = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const schema = z.object({ 
    items: z.array(portfolioItemSchema).min(1).max(20, "Maximum 20 portfolio items allowed")
  });
  schema.parse(req.body);
  next();
};

// Validate update portfolio item
export const validateUpdatePortfolio = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const schema = z.object({
    id: z.string().uuid("Invalid portfolio item ID"),
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    category: z.string().max(50).optional(),
    image: z.string().refine(isImageLike, "Invalid image format").optional(),
  });
  schema.parse(req.body);
  next();
};

// Validate remove portfolio item
export const validateRemovePortfolio = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const schema = z.object({ 
    id: z.string().uuid("Invalid portfolio item ID")
  });
  schema.parse(req.body);
  next();
};
