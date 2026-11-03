# Utilities

This directory contains utility classes for common operations.

## Files

### jwt.util.ts
JWT token generation and validation utility.

**Purpose:**
- Generate short-lived JWT access tokens
- Generate JWT refresh tokens with token identifiers
- Verify JWT tokens
- Decode JWT tokens

**Key Methods:**
- `generateToken(payload)` - Generate 15-minute access token
- `generateRefreshToken(payload)` - Generate 7-day refresh token
- `generateTokenPair(payload)` - Generate both tokens
- `verifyAccessToken(token)` - Verify an access token
- `verifyRefreshToken(token)` - Verify a refresh token
- `decodeToken(token)` - Decode without verification

**Configuration:**
Environment variables:
```bash
# Generate a random secret with: openssl rand -base64 48
JWT_SECRET=""
```

**Usage:**
```typescript
import { AuthSessionUtil } from './auth-session.util.js';

const { accessToken, refreshToken } = await AuthSessionUtil.issueTokenPair({
  userId: user.id,
  email: user.email
});
```
Use `JWTUtil.generateTokenPair()` only when a caller intentionally does not need
a persisted refresh session (for example, isolated signing tests).

### money.util.ts
Parses and formats integer minor units using each supported ISO 4217 currency's
precision. Account creation defaults to USD; transaction responses include the
currency code and do not perform currency conversion.

### password.util.ts
Password hashing and validation utility.

**Purpose:**
- Hash passwords using bcrypt
- Compare passwords with hashes
- Validate password strength

**Key Methods:**
- `hash(password)` - Hash password with bcrypt
- `compare(password, hash)` - Compare password with hash
- `validateStrength(password)` - Validate password requirements

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Usage:**
```typescript
import { PasswordUtil } from './password.util.js';

const hashedPassword = await PasswordUtil.hash('myPassword');
const isValid = await PasswordUtil.compare('myPassword', hashedPassword);
const validation = PasswordUtil.validateStrength('myPassword');
```

### token.util.ts
Token generation and expiration utility.

**Purpose:**
- Generate secure random tokens
- Calculate expiration dates

**Key Methods:**
- `generateVerificationToken()` - Generate 64-char hex token
- `getExpirationDate(hours)` - Calculate expiration date

**Usage:**
```typescript
import { TokenUtil } from './token.util.js';

const token = TokenUtil.generateVerificationToken();
const expiresAt = TokenUtil.getExpirationDate(24); // 24 hours
```

### validation.util.ts
Input validation utility.

**Purpose:**
- Validate email format
- Validate password strength
- Validate name length
- Validate required fields

**Key Methods:**
- `validateEmail(email)` - Validate email format
- `validatePassword(password)` - Validate password strength
- `validateName(name)` - Validate name length
- `validateRequired(value, fieldName)` - Validate required field

**ValidationResult Interface:**
```typescript
{
  valid: boolean;
  errors: string[];
}
```

**Usage:**
```typescript
import { ValidationUtil } from './validation.util.js';

const emailValidation = ValidationUtil.validateEmail('user@example.com');
if (!emailValidation.valid) {
  console.log(emailValidation.errors);
}
```

## Types Directory

Type definitions have been moved to `../types/`:
- `types/enums/` - Enumerations (Env, Status)
- `types/model/` - Data models (JsonModel)

Import from types:
```typescript
import Status from '../types/enums/status.enum.ts';
import JsonModel from '../types/model/json.model.js';
```

## How to Add New Utilities

Follow this pattern:

```typescript
export class YourUtil {
  static yourMethod(params: YourParams): ReturnType {
    // Your logic here
    return result;
  }
}
```

## Utility Guidelines

1. **Static Methods**: Use static methods for stateless utilities
2. **Type Safety**: Use TypeScript interfaces for parameters and return types
3. **Error Handling**: Throw errors for invalid inputs
4. **Validation**: Return structured validation results (valid + errors)
5. **Documentation**: Add JSDoc comments for all methods
6. **Configuration**: Load configuration from environment variables

## Common Utility Patterns

### Hashing
```typescript
export class HashUtil {
  static hash(data: string): string {
    // Hash data
  }
}
```

### Formatting
```typescript
export class FormatUtil {
  static formatDate(date: Date): string {
    // Format date
  }
}
```

### Conversion
```typescript
export class ConvertUtil {
  static toCamelCase(str: string): string {
    // Convert string
  }
}
```

## Security Considerations

- Passwords: Always hash before storage, never store plain text
- Tokens: Use cryptographically secure random generation
- Validation: Validate all inputs before processing
- JWT: Use strong secret keys in production
