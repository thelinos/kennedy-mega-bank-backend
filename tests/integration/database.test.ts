import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPrismaClient } from '../../src/shared/database/prisma.js';
import { connectPrismaOnly, disconnectAllDatabases } from '../../src/shared/database/config.js';

describe('Database Integration Tests', () => {
  let prisma: ReturnType<typeof getPrismaClient>;
  let databases: any;

  beforeEach(async () => {
    databases = await connectPrismaOnly();
    prisma = getPrismaClient();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await disconnectAllDatabases(databases);
  });

  describe('Prisma/SQLite', () => {
    it('should create a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'testuser',
          name: 'Test User',
        },
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe('testuser');
    });

    it('should create an account for a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'testuser',
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          accountType: 'checking',
          balance: 1000.0,
        },
      });

      expect(account).toHaveProperty('id');
      expect(account.userId).toBe(user.id);
      expect(account.balance).toBe(1000.0);
    });

    it('should create a transaction for an account', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'testuser',
        },
      });

      const account = await prisma.account.create({
        data: {
          userId: user.id,
          accountType: 'checking',
          balance: 1000.0,
        },
      });

      const transaction = await prisma.transaction.create({
        data: {
          accountId: account.id,
          amount: 100.0,
          type: 'deposit',
          description: 'Test deposit',
        },
      });

      expect(transaction).toHaveProperty('id');
      expect(transaction.accountId).toBe(account.id);
      expect(transaction.amount).toBe(100.0);
    });

    it('should query user with accounts', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'testuser',
          accounts: {
            create: [
              {
                accountType: 'checking',
                balance: 1000.0,
              },
              {
                accountType: 'savings',
                balance: 5000.0,
              },
            ],
          },
        },
      });

      const userWithAccounts = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { accounts: true },
      });

      expect(userWithAccounts?.accounts).toHaveLength(2);
    });
  });

  describe('Database Connection', () => {
    it('should connect to Prisma successfully', async () => {
      const databases = await connectPrismaOnly();

      expect(databases).toHaveProperty('prisma');

      await disconnectAllDatabases(databases);
    });
  });
});
