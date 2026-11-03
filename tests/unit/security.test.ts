import { afterEach, describe, expect, it } from 'vitest';
import { getAllowedOrigins } from '../../src/shared/config/security.config.ts';
import { JWTUtil } from '../../src/shared/utils/jwt.util.ts';

const secretKeys = ['JWT_SECRET', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;
const configKeys = ['CORS_ORIGINS', 'CORS_ORIGIN', 'NODE_ENV'] as const;

const originalEnv = new Map<string, string | undefined>();
for (const key of [...secretKeys, ...configKeys]) {
  originalEnv.set(key, process.env[key]);
}

afterEach(() => {
  for (const [key, value] of originalEnv) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe('JWT configuration and token use', () => {
  it('signs and verifies access and refresh tokens only for their intended use', () => {
    process.env.JWT_SECRET = 'unit-test-secret-that-is-at-least-32-bytes';
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    const tokens = JWTUtil.generateTokenPair({ userId: 'user-1', email: 'user@example.com' });

    expect(JWTUtil.verifyAccessToken(tokens.accessToken)).toMatchObject({
      userId: 'user-1',
      tokenUse: 'access',
    });
    expect(JWTUtil.verifyRefreshToken(tokens.refreshToken)).toMatchObject({
      userId: 'user-1',
      tokenUse: 'refresh',
    });
    expect(() => JWTUtil.verifyAccessToken(tokens.refreshToken)).toThrow('Invalid or expired token');
    expect(() => JWTUtil.verifyRefreshToken(tokens.accessToken)).toThrow('Invalid or expired token');
  });

  it('rejects missing and weak signing secrets', () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => JWTUtil.validateConfiguration()).toThrow('must be configured');

    process.env.JWT_SECRET = 'too-short';
    expect(() => JWTUtil.validateConfiguration()).toThrow('at least 32 bytes');
  });
});

describe('CORS origin configuration', () => {
  it('accepts a comma-separated list of exact origins', () => {
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGINS = 'https://app.example.com,https://admin.example.com';

    expect(getAllowedOrigins()).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('rejects wildcard origins and missing production configuration', () => {
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGINS = '*';
    expect(() => getAllowedOrigins()).toThrow('Wildcard CORS origins are not allowed');

    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ORIGINS;
    delete process.env.CORS_ORIGIN;
    expect(() => getAllowedOrigins()).toThrow('CORS_ORIGINS must be configured in production');
  });
});
