import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const createServiceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Xizmat nomi majburiy")
      .max(100, "Xizmat nomi juda uzun (maksimum 100 belgi)"),
    description: z
      .string()
      .max(500, "Tavsif juda uzun (maksimum 500 belgi)")
      .optional(),
    duration: z
      .number()
      .int("Davomiylik butun son bo'lishi kerak")
      .min(15, "Davomiylik kamida 15 daqiqa bo'lishi kerak")
      .max(300, "Davomiylik ko'pi bilan 300 daqiqa bo'lishi kerak"),
    price: z
      .number()
      .positive("Narx musbat son bo'lishi kerak")
      .min(1000, "Narx kamida 1000 so'm bo'lishi kerak")
      .max(10000000, "Narx ko'pi bilan 10,000,000 so'm bo'lishi kerak"),
  }),
});

const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid service ID format"),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, "Xizmat nomi majburiy")
      .max(100, "Xizmat nomi juda uzun (maksimum 100 belgi)")
      .optional(),
    description: z
      .string()
      .max(500, "Tavsif juda uzun (maksimum 500 belgi)")
      .optional(),
    duration: z
      .number()
      .int("Davomiylik butun son bo'lishi kerak")
      .min(15, "Davomiylik kamida 15 daqiqa bo'lishi kerak")
      .max(300, "Davomiylik ko'pi bilan 300 daqiqa bo'lishi kerak")
      .optional(),
    price: z
      .number()
      .positive("Narx musbat son bo'lishi kerak")
      .min(1000, "Narx kamida 1000 so'm bo'lishi kerak")
      .max(10000000, "Narx ko'pi bilan 10,000,000 so'm bo'lishi kerak")
      .optional(),
  }),
});

const getBarberServicesSchema = z.object({
  params: z.object({
    barberId: z.string().uuid("Invalid barber ID format"),
  }),
});

export const validateCreateService = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    createServiceSchema.parse({ body: req.body });
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

export const validateUpdateService = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    updateServiceSchema.parse({ params: req.params, body: req.body });
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

export const validateGetBarberServices = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    getBarberServicesSchema.parse({ params: req.params });
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
