import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import {
  PORT,
  CORS_ORIGIN,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
} from "./config/constants";
import { errorHandler } from "./middleware/errorHandler";
import { swaggerSpec } from "./config/swagger";

// Import routes
import authRoutes from "./routes/authRoutes";
import barberRoutes from "./routes/barberRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import statisticsRoutes from "./routes/statisticsRoutes";
import favoritesRoutes from "./routes/favoritesRoutes";
import reviewsRoutes from "./routes/reviewsRoutes";
import servicesRoutes from "./routes/servicesRoutes";
import scheduleRoutes from "./routes/scheduleRoutes";
import offersRoutes from "./routes/offersRoutes";

// Load environment variables
dotenv.config();

// Validate environment variables
import { validateEnv } from "./config/env";
validateEnv();

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(morgan("dev"));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/barbers", barberRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/offers", offersRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
});

export default app;
