import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

/**
 * getPrismaClient - Returns a singleton Prisma client instance
 *
 * This function implements the singleton pattern to ensure only one
 * Prisma client instance exists throughout the application lifecycle.
 * This prevents connection pool exhaustion and improves performance.
 *
 * The Prisma client is used for:
 * - User management (authentication, profiles)
 * - Account management (bank accounts)
 * - Transaction records
 * - Email and password reset tokens
 *
 * @returns PrismaClient - The singleton Prisma client instance
 */
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

/**
 * disconnectPrisma - Disconnects the Prisma client from the database
 *
 * This function gracefully disconnects the Prisma client, closing all
 * database connections. It should be called during application shutdown
 * to ensure clean disconnection.
 *
 * @returns Promise<void>
 */
export const disconnectPrisma = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
  }
};
