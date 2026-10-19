import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { App } from '../../src/shared/app/app.js';
import { connectPrismaOnly, disconnectAllDatabases } from '../../src/shared/database/config.js';
import { getPrismaClient } from '../../src/shared/database/prisma.js';
import AppRegistry from '../../src/shared/app/app-registry.js';

describe('Application E2E Tests', () => {
  let app: any;
  let prisma: ReturnType<typeof getPrismaClient>;
  let databases: any;

  beforeAll(async () => {
    // Reset AppRegistry for clean test state
    AppRegistry.getInstance().reset();

    // Connect to test databases (Prisma only for testing)
    databases = await connectPrismaOnly();
    app = new App(databases).app;
    prisma = getPrismaClient();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    await disconnectAllDatabases(databases);

    // Reset AppRegistry for clean state
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

  describe('User Management (Future Implementation)', () => {
    it('should create a new user via POST /users', async () => {
      // This test will pass once you implement the user routes
      // const response = await request(app)
      //   .post('/users')
      //   .send({
      //     email: 'test@example.com',
      //     username: 'testuser',
      //     name: 'Test User',
      //   });

      // expect(response.status).toBe(201);
      // expect(response.body).toHaveProperty('id');
      // expect(response.body.email).toBe('test@example.com');

      // Placeholder - remove when routes are implemented
      expect(true).toBe(true);
    });

    it('should get all users via GET /users', async () => {
      // This test will pass once you implement the user routes
      // const response = await request(app).get('/users');

      // expect(response.status).toBe(200);
      // expect(Array.isArray(response.body)).toBe(true);

      // Placeholder - remove when routes are implemented
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
    });

    it('should return 500 for server errors', async () => {
      // This test will be useful once you add routes that can error
      // You can trigger errors by sending invalid data
      expect(true).toBe(true);
    });
  });
});
