import { createHmac } from 'node:crypto';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { getPrismaClient } from '../database/prisma.ts';
import Status from '../types/enums/status.enum.ts';

interface RateLimitPolicy {
  limit: number;
  ipLimit: number;
  windowMs: number;
  identity: (req: Request) => string;
}

let lastCleanupAt = 0;

const hash = (value: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET or JWT_SECRET must be configured for rate-limit key hashing');
  }
  return createHmac('sha256', secret).update(value).digest('hex');
};

export const createRateLimitMiddleware = (policy: RateLimitPolicy): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const now = Date.now();
    const windowStart = Math.floor(now / policy.windowMs) * policy.windowMs;
    const expiresAt = new Date(windowStart + policy.windowMs * 2);
    const identity = policy.identity(req);
    const route = `${req.baseUrl}${req.path}`;
    const identityBucketKey = hash(`${route}:identity:${req.ip}:${identity}:${windowStart}`);
    const ipBucketKey = hash(`${route}:ip:${req.ip}:${windowStart}`);

    try {
      const prisma = getPrismaClient();
      const [identityBucket, ipBucket] = await Promise.all([
        prisma.rateLimitBucket.upsert({
          where: { bucketKey: identityBucketKey },
          create: { bucketKey: identityBucketKey, count: 1, expiresAt },
          update: { count: { increment: 1 } },
        }),
        prisma.rateLimitBucket.upsert({
          where: { bucketKey: ipBucketKey },
          create: { bucketKey: ipBucketKey, count: 1, expiresAt },
          update: { count: { increment: 1 } },
        }),
      ]);

      if (now - lastCleanupAt >= 5 * 60 * 1000) {
        lastCleanupAt = now;
        await prisma.rateLimitBucket.deleteMany({
          where: { expiresAt: { lt: new Date(now) } },
        });
        await prisma.refreshSession.deleteMany({
          where: { expiresAt: { lt: new Date(now) } },
        });
      }

      if (identityBucket.count > policy.limit || ipBucket.count > policy.ipLimit) {
        res.setHeader('Retry-After', Math.max(1, Math.ceil((windowStart + policy.windowMs - now) / 1000)));
        res.status(429).json({
          message: 'Too many requests. Please try again later.',
          status: Status.failed,
        });
        return;
      }

      next();
    } catch (error) {
      lastCleanupAt = 0;
      console.error('Rate limiting store unavailable:', error);
      res.status(503).json({
        message: 'Request protection is temporarily unavailable',
        status: Status.failed,
      });
    }
  };

const requestIdentity = (req: Request): string => {
  const body: unknown = req.body;
  if (typeof body === 'object' && body !== null) {
    const fields = body as Record<string, unknown>;
    if (typeof fields.email === 'string') {
      return fields.email.trim().toLowerCase();
    }
    if (typeof fields.phoneNumber === 'string') {
      return fields.phoneNumber.trim();
    }
  }
  return req.user?.userId ?? 'anonymous';
};

export const authRateLimit = createRateLimitMiddleware({
  limit: 5,
  ipLimit: 50,
  windowMs: 15 * 60 * 1000,
  identity: requestIdentity,
});

export const ledgerRateLimit = createRateLimitMiddleware({
  limit: 30,
  ipLimit: 120,
  windowMs: 60 * 1000,
  identity: requestIdentity,
});
