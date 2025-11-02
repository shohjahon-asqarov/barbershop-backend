import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/constants";
import { prisma } from "../config/database";
import {
  AuthenticationError,
  ValidationError,
} from "../errors/AppError";
import { UserRole } from "@prisma/client";
import { BarberService } from "./barberService";
import logger from "../utils/logger";

interface RegisterData {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface LoginData {
  email?: string;
  phone?: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData) {
    // Validate input
    if (!data.email || !data.phone || !data.password) {
      throw new ValidationError("Email, phone, and password are required");
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existingUser) {
      throw new ValidationError("User with this email or phone already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Validate role
    if (!data.role || !["USER", "BARBER", "ADMIN"].includes(data.role)) {
      throw new ValidationError(
        "Valid role (USER, BARBER, or ADMIN) is required"
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    // If user is BARBER, create barber profile automatically
    if (data.role === "BARBER") {
      try {
        const barberService = new BarberService();
        await barberService.createBarber(user.id, {
          bio: "",
          specialty: "",
          experience: 0,
          location: "",
        });
      } catch (error) {
        // If barber already exists or creation fails, log but don't fail registration
        logger.warn("Barber profile creation skipped", {
          userId: user.id,
          error,
        });
      }
    }

    // Generate token
    const token = this.generateToken(user.id, user.role);

    return {
      user,
      token,
    };
  }

  async updateUser(
    userId: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      avatar: string;
    }>
  ) {
    // Check if email or phone is being updated and already exists
    if (data.email || data.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                data.email ? { email: data.email } : {},
                data.phone ? { phone: data.phone } : {},
              ],
            },
          ],
        },
      });

      if (existingUser) {
        throw new ValidationError(
          "User with this email or phone already exists"
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(data: LoginData) {
    const { email, phone, password } = data;

    if (!password || (!email && !phone)) {
      throw new ValidationError("Email/phone and password are required");
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: email ? { email } : { phone },
    });

    if (!user) {
      throw new AuthenticationError("Invalid credentials - user not found");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid credentials - wrong password");
    }

    // Generate token
    const token = this.generateToken(user.id, user.role);

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    };

    return {
      user: userData,
      token,
    };
  }

  private generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }
}
