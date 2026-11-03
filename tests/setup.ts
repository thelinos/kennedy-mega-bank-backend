import { beforeAll, afterAll } from 'vitest';
import { resolve } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = `file:${resolve(process.cwd(), 'tests/test.db')}`;
process.env.JWT_SECRET = 'vitest-only-secret-do-not-use-outside-tests-2026';
process.env.CORS_ORIGINS = 'http://localhost:3000';

import { getPrismaClient, disconnectPrisma } from '../src/shared/database/prisma.js';

// Setup: Initialize Prisma client before all tests
beforeAll(async () => {
  const prisma = getPrismaClient();
  await prisma.$connect();
});

// Cleanup: Disconnect from databases after all tests
afterAll(async () => {
  await disconnectPrisma();
});
