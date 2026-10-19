import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * JWTPayload - Interface for JWT token payload
 *
 * This interface defines the structure of the data stored in JWT tokens.
 * Only essential user information is included to keep tokens small.
 */
export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * TokenPair - Interface for access and refresh token pair
 *
 * This interface represents both tokens returned during authentication.
 * Access tokens are short-lived (1 hour), refresh tokens are long-lived (7 days).
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
 * - JWT_SECRET should be a strong, random string in production
 * - Access tokens expire quickly (1 hour) to limit exposure
 * - Refresh tokens allow session extension without re-authentication
 */
export class JWTUtil {
  /**
   * generateToken - Generates a short-lived access token
   *
   * Creates a JWT token that expires in 1 hour (configurable via JWT_EXPIRES_IN).
   * Access tokens are used for API authentication and should be refreshed periodically.
   *
   * @param payload - User data to include in token (userId, email)
   * @returns string - Signed JWT access token
   */
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  /**
   * generateRefreshToken - Generates a long-lived refresh token
   *
   * Creates a JWT token that expires in 7 days (configurable via REFRESH_TOKEN_EXPIRES_IN).
   * Refresh tokens are used to obtain new access tokens without re-authentication.
   *
   * @param payload - User data to include in token (userId, email)
   * @returns string - Signed JWT refresh token
   */
  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions);
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
  static generateTokenPair(payload: JWTPayload): TokenPair {
    return {
      accessToken: this.generateToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * verifyToken - Verifies and decodes a JWT token
   *
   * Validates the token signature and expiration, then returns the decoded payload.
   * Throws an error if the token is invalid or expired.
   *
   * @param token - JWT token to verify
   * @returns JWTPayload - Decoded token payload
   * @throws Error - If token is invalid or expired
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * decodeToken - Decodes a JWT token without verification
   *
   * Decodes the token payload without verifying the signature or expiration.
   * Useful for debugging or extracting data when verification isn't needed.
   *
   * @param token - JWT token to decode
   * @returns JWTPayload | null - Decoded token payload or null if decoding fails
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}
