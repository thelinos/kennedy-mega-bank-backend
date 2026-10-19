import { beforeAll, afterAll } from 'vitest';
import { getPrismaClient, disconnectPrisma } from '../src/shared/database/prisma.js';
import { disconnectMongo } from '../src/shared/database/mongodb.js';

// Setup: Initialize Prisma client before all tests
beforeAll(async () => {
  const prisma = getPrismaClient();
  await prisma.$connect();
});

// Cleanup: Disconnect from databases after all tests
afterAll(async () => {
  await disconnectPrisma();
  try {
    await disconnectMongo();
  } catch (error) {
    // Ignore MongoDB disconnect errors if not connected
  }
});
