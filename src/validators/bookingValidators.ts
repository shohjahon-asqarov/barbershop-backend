import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const createBookingSchema = z.object({
  body: z.object({
    barberId: z.string().uuid("Invalid barber ID format"),
    serviceId: z.string().uuid("Invalid service ID format"),
    date: z.string().refine(
      (val) => {
        const selectedDate = new Date(val);
        const now = new Date();
        
        // Check if date is valid
        if (isNaN(selectedDate.getTime())) {
          return false;
        }
        
        // Reset time to compare only dates (not datetime)
        const selectedDateOnly = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        const todayOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        
        // Allow today or future dates (date comparison, not datetime)
        return selectedDateOnly >= todayOnly;
      },
      {
        message: "Date must be today or a future date",
      }
    ),
    startTime: z
      .string()
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    paymentType: z.enum(["CASH", "CARD"]).optional(),
    notes: z.string().optional(),
  }),
});

const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid booking ID format"),
  }),
  body: z.object({
    status: z.enum([
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ]),
  }),
});

const getBookingsQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
      .optional(),
    date: z.string().optional(),
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

export const validateCreateBooking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    createBookingSchema.parse({ body: req.body });
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

export const validateUpdateBookingStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    updateBookingStatusSchema.parse({
      params: req.params,
      body: req.body,
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

const rescheduleBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid booking ID format"),
  }),
  body: z.object({
    date: z.string().refine(
      (val) => {
        const selectedDate = new Date(val);
        const now = new Date();
        
        // Check if date is valid
        if (isNaN(selectedDate.getTime())) {
          return false;
        }
        
        // Reset time to compare only dates (not datetime)
        const selectedDateOnly = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        const todayOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        
        // Allow today or future dates (date comparison, not datetime)
        return selectedDateOnly >= todayOnly;
      },
      {
        message: "Date must be today or a future date",
      }
    ),
    startTime: z
      .string()
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    reason: z.string().optional(),
  }),
});

const bulkUpdateStatusSchema = z.object({
  body: z.object({
    bookingIds: z
      .array(z.string().uuid("Invalid booking ID format"))
      .min(1, "At least one booking ID required"),
    status: z.enum([
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ]),
    reason: z.string().optional(),
  }),
});

export const validateGetBookingsQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    getBookingsQuerySchema.parse({ query: req.query });
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

export const validateRescheduleBooking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    rescheduleBookingSchema.parse({
      params: req.params,
      body: req.body,
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

export const validateBulkUpdateStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    bulkUpdateStatusSchema.parse({ body: req.body });
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
