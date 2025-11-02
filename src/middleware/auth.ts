import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/constants";
import { AuthenticationError, AuthorizationError } from "../errors/AppError";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AuthenticationError("Token not provided");
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    throw new AuthenticationError("Invalid or expired token");
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      throw new AuthorizationError("User role not found");
    }

    if (!roles.includes(req.userRole)) {
      throw new AuthorizationError("Insufficient permissions");
    }

    next();
  };
};
