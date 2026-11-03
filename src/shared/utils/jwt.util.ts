import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const JWT_ISSUER = 'kennedy-mega-bank-backend';
const JWT_AUDIENCE = 'kennedy-mega-bank-api';
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const getSigningSecret = (specificKey: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string => {
  const secret = process.env[specificKey] || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(`${specificKey} or JWT_SECRET must be configured`);
  }
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error(`${specificKey} or JWT_SECRET must be at least 32 bytes`);
  }
  return secret;
};

/**
 * JWTPayload - Interface for JWT token payload
 *
 * This interface defines the structure of the data stored in JWT tokens.
 * Only essential user information is included to keep tokens small.
 */
export interface JWTPayload {
  userId: string;
  email: string;
  tokenUse: 'access' | 'refresh';
  tokenId?: string;
}

type JWTIdentity = Pick<JWTPayload, 'userId' | 'email'>;

/**
 * TokenPair - Interface for access and refresh token pair
 *
 * This interface represents both tokens returned during authentication.
 * Access tokens are short-lived (15 minutes), refresh tokens are long-lived (7 days).
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * JWTUtil - Utility class for JWT token operations
 *
 * This class provides methods for generating, verifying, and decoding JWT tokens.
 * JWT tokens are used for stateless authentication in the application.
 *
 * Security Note:
 * - Signing secrets must be configured and at least 32 bytes long
 * - Access tokens expire quickly (15 minutes) to limit exposure
 * - Refresh tokens allow session extension without re-authentication
 */
export class JWTUtil {
  static validateConfiguration(): void {
    getSigningSecret('JWT_ACCESS_SECRET');
    getSigningSecret('JWT_REFRESH_SECRET');
  }

  /**
   * generateToken - Generates a short-lived access token
   *
   * Creates a short-lived access token for API authentication.
   */
  static generateToken(payload: JWTIdentity): string {
    return jwt.sign(
      { ...payload, tokenUse: 'access' },
      getSigningSecret('JWT_ACCESS_SECRET'),
      {
        algorithm: 'HS256',
        audience: JWT_AUDIENCE,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        issuer: JWT_ISSUER,
      }
    );
  }

  /**
   * generateRefreshToken - Generates a long-lived refresh token
   *
   * Creates a refresh token that can be exchanged for a new token pair.
   */
  static generateRefreshToken(payload: JWTIdentity): string {
    return jwt.sign(
      { ...payload, tokenUse: 'refresh', tokenId: randomUUID() },
      getSigningSecret('JWT_REFRESH_SECRET'),
      {
        algorithm: 'HS256',
        audience: JWT_AUDIENCE,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
        issuer: JWT_ISSUER,
      }
    );
  }

  /**
   * generateTokenPair - Generates both access and refresh tokens
   *
   * Convenience method that generates both tokens at once.
   * Used during login and signup to provide complete authentication tokens.
   *
   * @param payload - User data to include in tokens (userId, email)
   * @returns TokenPair - Object containing both access and refresh tokens
   */
  static generateTokenPair(payload: JWTIdentity): TokenPair {
    return {
      accessToken: this.generateToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verifies the token signature, expiry, issuer, audience, and intended use.
   */
  static verifyAccessToken(token: string): JWTPayload {
    return this.verifyToken(token, 'access');
  }

  static verifyRefreshToken(token: string): JWTPayload {
    return this.verifyToken(token, 'refresh');
  }

  private static verifyToken(token: string, tokenUse: JWTPayload['tokenUse']): JWTPayload {
    const secret = getSigningSecret(tokenUse === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET');

    try {
      const claims = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        audience: JWT_AUDIENCE,
        issuer: JWT_ISSUER,
      });

      if (
        typeof claims === 'string' ||
        typeof claims.userId !== 'string' ||
        typeof claims.email !== 'string' ||
        claims.tokenUse !== tokenUse ||
        (tokenUse === 'refresh' && typeof claims.tokenId !== 'string')
      ) {
        throw new Error('Invalid token claims');
      }

      return {
        userId: claims.userId,
        email: claims.email,
        tokenUse,
        ...(typeof claims.tokenId === 'string' ? { tokenId: claims.tokenId } : {}),
      };
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decodes token claims without verifying the signature; never use for authorization.
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const claims = jwt.decode(token);
      if (
        typeof claims === 'string' ||
        claims === null ||
        typeof claims.userId !== 'string' ||
        typeof claims.email !== 'string' ||
        (claims.tokenUse !== 'access' && claims.tokenUse !== 'refresh') ||
        (claims.tokenUse === 'refresh' && typeof claims.tokenId !== 'string')
      ) {
        return null;
      }
      return {
        userId: claims.userId,
        email: claims.email,
        tokenUse: claims.tokenUse,
        ...(typeof claims.tokenId === 'string' ? { tokenId: claims.tokenId } : {}),
      };
    } catch {
      return null;
    }
  }
}
