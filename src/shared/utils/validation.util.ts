/**
 * ValidationResult - Interface for validation results
 *
 * This interface defines the structure of validation results, including
 * whether the validation passed and any error messages.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * ValidationUtil - Utility class for input validation
 *
 * This class provides methods for validating various input types including
 * email, password, name, and required fields. All validators return a
 * consistent ValidationResult interface.
 *
 * Validation Rules:
 * - Email: Must match standard email format (user@domain.tld)
 * - Password: 8+ chars, uppercase, lowercase, number, special char
 * - Name: Optional, but if provided must be 2+ characters
 * - Required: Must not be undefined, null, or empty string
 */
export class ValidationUtil {
  /**
   * validateEmail - Validates email format
   *
   * Checks if the email matches the standard email format using regex.
   * Returns specific error messages for missing or invalid emails.
   *
   * @param email - Email address to validate
   * @returns ValidationResult - Validation result with errors if any
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * validatePassword - Validates password strength
   *
   * Checks if the password meets the application's security requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   *
   * @param password - Password to validate
   * @returns ValidationResult - Validation result with errors if any
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { valid: false, errors };
    }

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

    return { valid: errors.length === 0, errors };
  }

  /**
   * validateName - Validates name length
   *
   * Checks if the name (if provided) is at least 2 characters long.
   * Name is optional, so validation only applies if provided.
   *
   * @param name - Name to validate (optional)
   * @returns ValidationResult - Validation result with errors if any
   */
  static validateName(name: string | undefined): ValidationResult {
    const errors: string[] = [];

    if (name && name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * validateRequired - Validates that a field is provided
   *
   * Checks if a value is not undefined, null, or an empty string.
   * Generic validator for any required field.
   *
   * @param value - Value to validate
   * @param fieldName - Name of the field (for error message)
   * @returns ValidationResult - Validation result with errors if any
   */
  static validateRequired(value: unknown, fieldName: string): ValidationResult {
    const errors: string[] = [];

    if (value === undefined || value === null || value === '') {
      errors.push(`${fieldName} is required`);
    }

    return { valid: errors.length === 0, errors };
  }
}
