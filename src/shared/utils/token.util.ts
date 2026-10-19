import { randomBytes } from 'crypto';

/**
 * TokenUtil - Utility class for token generation and expiration
 *
 * This class provides methods for generating secure random tokens
 * and calculating expiration dates. Tokens are used for email verification
 * and password reset flows.
 *
 * Security Notes:
 * - Uses Node.js crypto.randomBytes for cryptographically secure random values
 * - Tokens are 64-character hex strings (32 bytes = 64 hex chars)
 * - Tokens are unique and unpredictable
 */
export class TokenUtil {
  /**
   * generateVerificationToken - Generates a secure random verification token
   *
   * Creates a 64-character hexadecimal string using cryptographically secure
   * random bytes. This token is used for email verification and password reset.
   *
   * @returns string - 64-character hex token
   */
  static generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * getExpirationDate - Calculates expiration date from current time
   *
   * Adds the specified number of hours to the current date to create
   * an expiration timestamp. Used for setting token expiration times.
   *
   * @param hours - Number of hours from now for expiration (default: 24)
   * @returns Date - Expiration date/time
   */
  static getExpirationDate(hours: number = 24): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + hours);
    return expiration;
  }
}
