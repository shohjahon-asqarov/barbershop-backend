/**
 * Utility functions for barber-related operations
 * Reduces code duplication across services
 */

import { prisma } from "../config/database";
import { NotFoundError } from "../errors/AppError";

/**
 * Finds barber ID by user ID
 * Throws NotFoundError if barber profile doesn't exist
 *
 * @param userId - User ID to find barber for
 * @returns Barber ID
 * @throws {NotFoundError} If barber profile not found
 */
export async function findBarberIdByUserId(userId: string): Promise<string> {
  const barber = await prisma.barber.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!barber) {
    throw new NotFoundError("Barber profile topilmadi");
  }

  return barber.id;
}

/**
 * Validates that a barber profile exists for the given user ID
 * Returns the barber ID if found
 *
 * @param userId - User ID to validate
 * @returns Barber ID
 * @throws {NotFoundError} If barber profile not found
 */
export async function validateBarberExists(userId: string): Promise<string> {
  return findBarberIdByUserId(userId);
}
