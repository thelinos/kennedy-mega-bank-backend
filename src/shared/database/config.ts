import { getPrismaClient, disconnectPrisma } from './prisma.ts';

/**
 * DatabaseConfig - Interface for database connection configuration
 *
 * This interface holds the active Prisma connection.
 */
export interface DatabaseConfig {
  prisma?: ReturnType<typeof getPrismaClient>;
}

/**
 * connectPrismaOnly - Connects to the configured Prisma database
 *
 * The schema and DATABASE_URL are selected by the environment entrypoint.
 *
 * @returns Promise<DatabaseConfig> - Configuration with Prisma client
 */
export const connectPrismaOnly = async (): Promise<DatabaseConfig> => {
  const prisma = getPrismaClient();
  await prisma.$connect();
  console.log('✅ Prisma database connected successfully');
  return { prisma };
};

/**
 * disconnectAllDatabases - Disconnects the active Prisma database.
 *
 * @param config - Database configuration with active connections
 * @returns Promise<void>
 */
export const disconnectAllDatabases = async (config: DatabaseConfig): Promise<void> => {
  if (config.prisma) {
    await disconnectPrisma();
  }
};
