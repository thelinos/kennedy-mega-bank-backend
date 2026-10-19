import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * PasswordUtil - Utility class for password operations
 *
 * This class provides methods for hashing passwords, comparing passwords,
 * and validating password strength. All password operations use bcrypt,
 * which is designed for secure password hashing.
 *
 * Security Notes:
 * - Bcrypt automatically handles salting (no need to store salt separately)
 * - Salt rounds of 10 provide a good balance of security and performance
 * - Passwords should never be stored in plain text
 * - Passwords should never be returned in API responses
 */
export class PasswordUtil {
  /**
   * hash - Hashes a password using bcrypt
   *
   * Creates a secure hash of the password using bcrypt with 10 salt rounds.
   * The hash includes the salt, so it can be verified later without storing
   * the salt separately.
   *
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   */
  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * compare - Compares a plain text password with a hashed password
   *
   * Verifies if a plain text password matches a bcrypt hash.
   * Uses constant-time comparison to prevent timing attacks.
   *
   * @param password - Plain text password to compare
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise<boolean> - True if passwords match, false otherwise
   */
  static async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * validateStrength - Validates password strength requirements
   *
   * Checks if a password meets the application's security requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   *
   * @param password - Password to validate
   * @returns { valid: boolean, errors: string[] } - Validation result with errors
   */
  static validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
