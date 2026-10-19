import { getPrismaClient, disconnectPrisma } from './prisma.ts';
import { getMongoDb, disconnectMongo } from './mongodb.ts';
import { Db } from 'mongodb';

/**
 * DatabaseConfig - Interface for database connection configuration
 *
 * This interface defines the structure for holding database connections.
 * Both Prisma (for structured data) and MongoDB (for unstructured data like avatars)
 * can be optionally included.
 */
export interface DatabaseConfig {
  prisma?: ReturnType<typeof getPrismaClient>;
  mongo?: Db;
}

/**
 * connectPrismaOnly - Connects to Prisma database only (SQLite for development)
 *
 * This function is used in development mode where only the Prisma database
 * (SQLite) is needed. MongoDB is only used in staging and production for
 * storing unstructured data like user avatars.
 *
 * @returns Promise<DatabaseConfig> - Configuration with Prisma client
 */
export const connectPrismaOnly = async (): Promise<DatabaseConfig> => {
  const prisma = getPrismaClient();
  console.log('✅ Prisma (SQLite) connected successfully');
  return { prisma };
};

/**
 * connectPrismaWithMongo - Connects to both Prisma and MongoDB databases
 *
 * This function is used in staging and production environments where both
 * databases are needed:
 * - Prisma (MongoDB): Structured data (users, accounts, transactions)
 * - MongoDB: Unstructured data (user avatars, large binary files)
 *
 * @param mongoUri - MongoDB connection string
 * @param mongoDbName - Name of the MongoDB database
 * @returns Promise<DatabaseConfig> - Configuration with both databases
 */
export const connectPrismaWithMongo = async (mongoUri: string, mongoDbName: string): Promise<DatabaseConfig> => {
  const prisma = getPrismaClient();
  const mongo = await getMongoDb(mongoUri, mongoDbName);
  console.log('✅ Prisma (MongoDB) connected successfully');
  return { prisma, mongo };
};

/**
 * disconnectAllDatabases - Safely disconnects from all databases
 *
 * This function gracefully disconnects from all connected databases.
 * It handles errors gracefully to ensure the application can shut down
 * properly even if one database disconnect fails.
 *
 * @param config - Database configuration with active connections
 * @returns Promise<void>
 */
export const disconnectAllDatabases = async (config: DatabaseConfig): Promise<void> => {
  if (config.prisma) {
    await disconnectPrisma();
  }
  if (config.mongo) {
    try {
      await disconnectMongo();
    } catch (error) {
      console.warn('⚠️  MongoDB disconnect failed:', error);
    }
  }
};
