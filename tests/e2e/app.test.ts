import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { App } from '../../src/shared/app/app.ts';
import { connectPrismaOnly, disconnectAllDatabases, DatabaseConfig } from '../../src/shared/database/config.ts';
import { getPrismaClient } from '../../src/shared/database/prisma.ts';
import AppRegistry from '../../src/shared/app/app-registry.ts';
import { cleanupTestData } from '../fixtures/testData.ts';

const PASSWORD = 'Test1234!';
let originalCreditOperatorIds: string | undefined;

describe('Application E2E Tests', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaClient>;
  let databases: DatabaseConfig;

  beforeAll(async () => {
    AppRegistry.getInstance().reset();
    prisma = getPrismaClient();
    databases = await connectPrismaOnly();
    app = await new App(databases).app();
  });

  beforeEach(() => {
    originalCreditOperatorIds = process.env.LEDGER_CREDIT_USER_IDS;
  });

  afterEach(async () => {
    await cleanupTestData(prisma);
    if (originalCreditOperatorIds === undefined) {
      delete process.env.LEDGER_CREDIT_USER_IDS;
    } else {
      process.env.LEDGER_CREDIT_USER_IDS = originalCreditOperatorIds;
    }
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await disconnectAllDatabases(databases);
    AppRegistry.getInstance().reset();
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('API Documentation', () => {
    it('serves Swagger UI and the OpenAPI specification', async () => {
      const uiResponse = await request(app).get('/api-docs/');
      expect(uiResponse.status).toBe(200);
      expect(uiResponse.text).toContain('swagger-ui');

      const specResponse = await request(app).get('/api-docs.json');
      expect(specResponse.status).toBe(200);
      expect(specResponse.body.openapi).toBe('3.0.3');
      expect(specResponse.body.paths['/authentication/login'].post).toBeDefined();
      expect(specResponse.body.paths['/transactions'].post).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should create a user and set auth cookies', async () => {
      const response = await request(app)
        .post('/authentication/create-user')
        .send({
          email: 'signup@example.com',
          password: PASSWORD,
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe('signup@example.com');
      expect(response.body).toHaveProperty('id');
      expect(response.body).not.toHaveProperty('password');
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('accessToken='),
          expect.stringContaining('refreshToken='),
        ])
      );
    });

    it('should reject login with the wrong password', async () => {
      await request(app)
        .post('/authentication/create-user')
        .send({
          email: 'login-fail@example.com',
          password: PASSWORD,
        });

      const response = await request(app)
        .post('/authentication/login')
        .send({
          email: 'login-fail@example.com',
          password: 'WrongPass1!',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('rate limits repeated login attempts', async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const response = await request(app)
          .post('/authentication/login')
          .send({
            email: 'rate-limited@example.com',
            password: 'WrongPass1!',
          });
        expect(response.status).toBe(401);
      }

      const limited = await request(app)
        .post('/authentication/login')
        .send({
          email: 'rate-limited@example.com',
          password: 'WrongPass1!',
        });

      expect(limited.status).toBe(429);
      expect(limited.headers['retry-after']).toBeDefined();
    });

    it('should log in an existing user and set auth cookies', async () => {
      await request(app)
        .post('/authentication/create-user')
        .send({
          email: 'login@example.com',
          password: PASSWORD,
        });

      const response = await request(app)
        .post('/authentication/login')
        .send({
          email: 'login@example.com',
          password: PASSWORD,
        });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('login@example.com');
      expect(response.body).not.toHaveProperty('password');
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('accessToken='),
          expect.stringContaining('refreshToken='),
        ])
      );
    });

    it('rotates refresh tokens and revokes a token family after replay', async () => {
      const agent = request.agent(app);
      const signup = await agent
        .post('/authentication/create-user')
        .send({ email: 'refresh@example.com', password: PASSWORD });
      expect(signup.status).toBe(201);

      const cookies = signup.headers['set-cookie'];
      const originalCookie = (typeof cookies === 'string' ? [cookies] : cookies ?? [])
        .find((cookie) => cookie.startsWith('refreshToken='));
      expect(originalCookie).toBeDefined();
      const oldTokenCookie = originalCookie?.split(';')[0];

      const refresh = await agent
        .post('/authentication/refresh')
        .set('Origin', 'http://localhost:3000');

      expect(refresh.status).toBe(200);
      expect(await prisma.refreshSession.count({
        where: { user: { email: 'refresh@example.com' }, revokedAt: null },
      })).toBe(1);

      const replay = await request(app)
        .post('/authentication/refresh')
        .set('Cookie', oldTokenCookie as string)
        .set('Origin', 'http://localhost:3000');
      expect(replay.status).toBe(401);

      expect(await prisma.refreshSession.count({
        where: { user: { email: 'refresh@example.com' }, revokedAt: null },
      })).toBe(0);
    });

    it('revokes the refresh session family on logout', async () => {
      const agent = request.agent(app);
      const signup = await agent
        .post('/authentication/create-user')
        .send({ email: 'logout@example.com', password: PASSWORD });
      expect(signup.status).toBe(201);

      const logout = await agent
        .post('/authentication/logout')
        .set('Origin', 'http://localhost:3000');
      expect(logout.status).toBe(200);
      expect(await prisma.refreshSession.count({
        where: { user: { email: 'logout@example.com' }, revokedAt: null },
      })).toBe(0);
    });
  });

  describe('Accounts and transactions', () => {
    it('should reject unauthenticated account creation', async () => {
      const response = await request(app)
        .post('/accounts')
        .send({ accountType: 'checking' });

      expect(response.status).toBe(401);
    });

    it('should create an account, credit, debit, and reject overdraft', async () => {
      const agent = request.agent(app);
      originalCreditOperatorIds = process.env.LEDGER_CREDIT_USER_IDS;

      const signup = await agent
        .post('/authentication/create-user')
        .send({
          email: 'ledger@example.com',
          password: PASSWORD,
        });

      expect(signup.status).toBe(201);
      process.env.LEDGER_CREDIT_USER_IDS = signup.body.id;

      const created = await agent
        .post('/accounts')
        .set('Origin', 'http://localhost:3000')
        .send({ accountType: 'checking' });

      expect(created.status).toBe(201);
      expect(created.body.account.balance).toBe('0.00');
      expect(created.body.account.currency).toBe('USD');
      expect(created.body.account.accountType).toBe('checking');

      const accountId = created.body.account.id;

      const credit = await agent
        .post('/transactions')
        .set('Origin', 'http://localhost:3000')
        .set('Idempotency-Key', 'ledger-credit-opening-001')
        .send({
          accountId,
          amount: 100,
          type: 'credit',
          description: 'Opening deposit',
        });

      expect(credit.status).toBe(201);
      expect(credit.body.account.balance).toBe('100.00');
      expect(credit.body.transaction.amount).toBe('100.00');
      expect(credit.body.transaction.type).toBe('credit');

      const replayedCredit = await agent
        .post('/transactions')
        .set('Origin', 'http://localhost:3000')
        .set('Idempotency-Key', 'ledger-credit-opening-001')
        .send({
          accountId,
          amount: 100,
          type: 'credit',
          description: 'Opening deposit',
        });

      expect(replayedCredit.status).toBe(201);
      expect(replayedCredit.body.account.balance).toBe('100.00');
      expect(replayedCredit.body.transaction.id).toBe(credit.body.transaction.id);

      const reusedKey = await agent
        .post('/transactions')
        .set('Origin', 'http://localhost:3000')
        .set('Idempotency-Key', 'ledger-credit-opening-001')
        .send({
          accountId,
          amount: 101,
          type: 'credit',
          description: 'Changed request',
        });
      expect(reusedKey.status).toBe(409);

      const debit = await agent
        .post('/transactions')
        .set('Origin', 'http://localhost:3000')
        .set('Idempotency-Key', 'ledger-debit-withdrawal-001')
        .send({
          accountId,
          amount: 40,
          type: 'debit',
          description: 'Withdrawal',
        });

      expect(debit.status).toBe(201);
      expect(debit.body.account.balance).toBe('60.00');

      const overdraft = await agent
        .post('/transactions')
        .set('Origin', 'http://localhost:3000')
        .set('Idempotency-Key', 'ledger-debit-overdraft-001')
        .send({
          accountId,
          amount: 61,
          type: 'debit',
        });

      expect(overdraft.status).toBe(400);
      expect(overdraft.body.message).toBe('Insufficient funds');

      const persisted = await prisma.account.findUnique({ where: { id: accountId } });
      expect(persisted?.balanceMinorUnits).toBe(6000n);
    });

    it('uses the account currency minor-unit precision', async () => {
      const agent = request.agent(app);
      const signup = await agent
        .post('/authentication/create-user')
        .send({ email: 'currency@example.com', password: PASSWORD });
      expect(signup.status).toBe(201);
      process.env.LEDGER_CREDIT_USER_IDS = signup.body.id;

      const account = await agent
        .post('/accounts')
        .set('Origin', 'http://localhost:3000')
        .send({ accountType: 'checking', currency: 'JPY' });
      expect(account.status).toBe(201);
      expect(account.body.account.currency).toBe('JPY');

      const transaction = await agent
        .post('/transactions')
        .set('Origin', 'http://localhost:3000')
        .set('Idempotency-Key', 'ledger-credit-jpy-000001')
        .send({
          accountId: account.body.account.id,
          amount: '123',
          type: 'credit',
        });

      expect(transaction.status).toBe(201);
      expect(transaction.body.account.balance).toBe('123');
      expect(transaction.body.transaction.amount).toBe('123');
    });

    it('does not let ordinary users create credit transactions', async () => {
      process.env.LEDGER_CREDIT_USER_IDS = '';
      const agent = request.agent(app);
      const signup = await agent
        .post('/authentication/create-user')
        .send({ email: 'credit-denied@example.com', password: PASSWORD });
      expect(signup.status).toBe(201);

      const account = await agent
        .post('/accounts')
        .set('Origin', 'http://localhost:3000')
        .send({ accountType: 'checking' });
      expect(account.status).toBe(201);

      const credit = await agent
        .post('/transactions')
        .set('Origin', 'http://localhost:3000')
        .set('Idempotency-Key', 'ledger-credit-denied-0001')
        .send({
          accountId: account.body.account.id,
          amount: 10,
          type: 'credit',
        });

      expect(credit.status).toBe(403);
    });

    it('rejects cookie-authenticated mutations from missing or untrusted origins', async () => {
      const agent = request.agent(app);
      const signup = await agent
        .post('/authentication/create-user')
        .send({
          email: 'csrf@example.com',
          password: PASSWORD,
        });

      expect(signup.status).toBe(201);

      const missingOrigin = await agent
        .post('/accounts')
        .send({ accountType: 'checking' });
      expect(missingOrigin.status).toBe(403);

      const untrustedOrigin = await agent
        .post('/accounts')
        .set('Origin', 'https://attacker.example')
        .send({ accountType: 'checking' });
      expect(untrustedOrigin.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
    });
  });
});
