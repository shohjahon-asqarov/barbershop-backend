import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import logger from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error for monitoring
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  // Log error using structured logger
  logger.error("Request error", err, errorDetails);

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    interface PrismaError {
      code?: string;
      meta?: { target?: string[] };
    }
    const prismaError = err as unknown as PrismaError;

    // Handle unique constraint violations
    if (prismaError.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "Resource already exists",
      });
    }

    // Handle record not found
    if (prismaError.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
      });
    }

    return res.status(400).json({
      success: false,
      error: "Database error occurred",
      ...(process.env.NODE_ENV === "development" && { code: prismaError.code }),
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }

  // Validation errors (Zod)
  if (err.name === "ZodError") {
    interface ZodError {
      errors?: unknown[];
    }
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: (err as unknown as ZodError).errors,
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};
