import swaggerJsdoc from "swagger-jsdoc";
import { PORT } from "./constants";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Barbershop Booking System API",
      version: "1.0.0",
      description:
        "Professional barbershop booking system API with authentication, barber management, and booking system.",
      contact: {
        name: "API Support",
        email: "support@barbershop.com",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: "Development server",
      },
      {
        url: "https://api.barbershop.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            avatar: { type: "string", nullable: true },
            role: { type: "string", enum: ["USER", "BARBER", "ADMIN"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Barber: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            bio: { type: "string", nullable: true },
            specialty: { type: "string", nullable: true },
            experience: { type: "number" },
            rating: { type: "number" },
            totalReviews: { type: "number" },
            location: { type: "string", nullable: true },
            latitude: { type: "number", nullable: true },
            longitude: { type: "number", nullable: true },
            image: { type: "string", nullable: true },
            portfolio: { type: "array", items: { type: "string" } },
            isAvailable: { type: "boolean" },
            workingDays: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Service: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            barberId: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            duration: { type: "number" },
            price: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            barberId: { type: "string", format: "uuid" },
            serviceId: { type: "string", format: "uuid" },
            date: { type: "string", format: "date" },
            startTime: { type: "string" },
            endTime: { type: "string" },
            status: {
              type: "string",
              enum: [
                "PENDING",
                "CONFIRMED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
              ],
            },
            notes: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
      },
    },
    tags: [
      { name: "Authentication", description: "User authentication endpoints" },
      { name: "Barbers", description: "Barber management endpoints" },
      { name: "Bookings", description: "Booking management endpoints" },
      { name: "Statistics", description: "Statistics and analytics" },
      { name: "Favorites", description: "Favorites management" },
      { name: "Reviews", description: "Reviews and ratings" },
      { name: "Services", description: "Services management" },
      { name: "Schedule", description: "Schedule management" },
      { name: "Health", description: "Health check endpoint" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/server.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
