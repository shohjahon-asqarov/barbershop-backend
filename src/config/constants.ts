export const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-change-in-production";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Rate Limiting
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;

// File Upload
export const UPLOAD_MAX_SIZE = parseInt(
  process.env.UPLOAD_MAX_SIZE || "10485760"
); // 10MB
export const UPLOAD_PATH = process.env.UPLOAD_PATH || "./uploads";

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Service Types
export const SERVICE_TYPES = {
  HAIRCUT: "haircut",
  BEARD: "beard",
  HAIRCUT_BEARD: "haircut_beard",
  STYLING: "styling",
  COLORING: "coloring",
  TREATMENT: "treatment",
} as const;

// Booking Status
export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

// User Roles
export const USER_ROLES = {
  USER: "USER",
  BARBER: "BARBER",
  ADMIN: "ADMIN",
} as const;

// Days of Week
export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
