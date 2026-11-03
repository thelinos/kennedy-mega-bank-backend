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
          balanceMinorUnits: 100000n,
        },
      });

      expect(account).toHaveProperty('id');
      expect(account.userId).toBe(user.id);
      expect(account.balanceMinorUnits).toBe(100000n);
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
          balanceMinorUnits: 100000n,
        },
      });

      const transaction = await prisma.transaction.create({
        data: {
          accountId: account.id,
          amountMinorUnits: 10000n,
          type: 'deposit',
          description: 'Test deposit',
        },
      });

      expect(transaction).toHaveProperty('id');
      expect(transaction.accountId).toBe(account.id);
      expect(transaction.amountMinorUnits).toBe(10000n);
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
                balanceMinorUnits: 100000n,
              },
              {
                accountType: 'savings',
                balanceMinorUnits: 500000n,
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
