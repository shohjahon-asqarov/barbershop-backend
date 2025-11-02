import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const createReviewSchema = z.object({
  body: z.object({
    barberId: z.string().uuid("Invalid barber ID format"),
    bookingId: z.string().uuid("Invalid booking ID format").optional(),
    rating: z
      .number()
      .int()
      .min(1, "Rating must be at least 1")
      .max(5, "Rating must be at most 5"),
    comment: z.string().max(1000, "Comment too long").optional(),
  }),
});

const getReviewsQuerySchema = z.object({
  params: z.object({
    barberId: z.string().uuid("Invalid barber ID format"),
  }),
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().positive())
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().positive().max(100))
      .optional(),
  }),
});

export const validateCreateReview = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    createReviewSchema.parse({ body: req.body });
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

export const validateGetReviewsQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    getReviewsQuerySchema.parse({
      params: req.params,
      query: req.query,
    });
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
