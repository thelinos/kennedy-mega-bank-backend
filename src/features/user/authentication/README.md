# Authentication Routes

This directory contains all authentication-related routes for the Kennedy Mega Bank backend.

## Overview

All authentication routes follow a consistent pattern for maintainability and security.

## General Pattern

### Class Structure
Each route is implemented as a class with:
- **Constructor**: Empty (no initialization needed)
- **Private router getter**: Returns an Express Router instance
- **Private prismaClient getter**: Returns Prisma client instance
- **Private route method**: Contains the actual route logic (e.g., `_loginRoute()`)
- **Public route getter**: Returns the router for registration in app.ts

### Naming Convention
- Class name: PascalCase (e.g., `Login`, `CreateUser`)
- Private method: underscore prefix (e.g., `_loginRoute()`)
- Public getter: camelCase (e.g., `loginRoute`)

### Route Implementation Pattern
1. **Import dependencies** (Express, utilities, services)
2. **Add class documentation** (purpose, features, security)
3. **Implement class structure** (getters for router and prismaClient)
4. **Implement route method**:
   - Extract request data
   - Validate inputs
   - Perform business logic
   - Interact with database
   - Set cookies (if needed)
   - Construct response
   - Handle errors
5. **Expose route via public getter**

### Error Handling Pattern
```typescript
try {
  // Route logic
  // Early returns for validation failures
  // Return appropriate status codes
} catch (error) {
  console.error("Error description:", error);
  res.status(500).json({
    message: "Generic error message",
    status: Status.failed
  });
}
```

### Response Pattern
All responses follow this structure:
```json
{
  "message": "Human-readable message",
  "status": "successful" | "failed",
  "user": { ... }  // Optional, for user-related routes
}
```

## Available Routes

### 1. Create User (`/authentication/create-user`)
- **Method**: POST
- **Purpose**: Register new user
- **Features**: Password hashing, JWT generation, email verification
- **Folder**: `create_user/`

### 2. Login (`/authentication/login`)
- **Method**: POST
- **Purpose**: Authenticate user
- **Features**: Password verification, JWT generation, cookie setting
- **Folder**: `login/`

### 3. Logout (`/authentication/logout`)
- **Method**: POST
- **Purpose**: End user session
- **Features**: Cookie clearing
- **Folder**: `logout/`

### 4. Refresh Token (`/authentication/refresh`)
- **Method**: POST
- **Purpose**: Refresh JWT tokens
- **Features**: Token rotation, session extension
- **Folder**: `refresh/`

### 5. Forgot Password (`/authentication/forgot-password`)
- **Method**: POST
- **Purpose**: Initiate password reset
- **Features**: Token generation, email sending
- **Folder**: `forgot-password/`

### 6. Reset Password (`/authentication/reset-password`)
- **Method**: POST
- **Purpose**: Complete password reset
- **Features**: Token validation, password update, cookie clearing
- **Folder**: `reset-password/`

### 7. Send Verification Email (`/authentication/send-verification-email`)
- **Method**: POST
- **Purpose**: Resend verification email
- **Features**: Token generation, email sending
- **Folder**: `verify_user/`

### 8. Verify Email (`/authentication/verify-email`)
- **Method**: GET
- **Purpose**: Verify email with token
- **Features**: Token validation, email verification
- **Folder**: `verify_user/`

### 9. Get Current User (`/authentication/me`)
- **Method**: GET
- **Purpose**: Get authenticated user profile
- **Features**: JWT authentication, user data with accounts
- **Folder**: `me/`

## Security Best Practices

### Password Security
- Never store plain text passwords
- Use bcrypt with 10 salt rounds
- Validate password strength (8+ chars, uppercase, lowercase, number, special)
- Never return password in responses

### JWT Security
- Use httpOnly cookies (prevents XSS)
- Use secure flag in production (HTTPS only)
- Use sameSite=strict (prevents CSRF)
- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Implement token rotation (new refresh token on each refresh)

### Input Validation
- Validate all inputs before processing
- Return specific error messages for validation failures
- Use validation utilities for consistency

### Error Handling
- Log errors server-side
- Return generic error messages to clients
- Use appropriate HTTP status codes
- Handle specific errors (e.g., Prisma P2002 for duplicates)

### Generic Responses
- Use generic error messages for sensitive operations
- Prevents email enumeration attacks
- Prevents information leakage

## Common Utilities Used

### ValidationUtil
- `validateEmail(email)` - Email format validation
- `validatePassword(password)` - Password strength validation
- `validateName(name)` - Name length validation
- `validateRequired(value, fieldName)` - Required field validation

### PasswordUtil
- `hash(password)` - Hash password with bcrypt
- `compare(password, hashedPassword)` - Compare password with hash
- `validateStrength(password)` - Validate password complexity

### JWTUtil
- `generateToken(payload)` - Generate access token
- `generateRefreshToken(payload)` - Generate refresh token
- `generateTokenPair(payload)` - Generate both tokens
- `verifyToken(token)` - Verify and decode token

### TokenUtil
- `generateVerificationToken()` - Generate 64-char hex token
- `getExpirationDate(hours)` - Calculate expiration date

### SendGridService
- `sendVerificationEmail(params)` - Send verification email
- `sendPasswordResetEmail(params)` - Send password reset email

## Database Transactions

When to use Prisma `$transaction`:
- Multiple database updates that must succeed together
- Prevents partial updates
- Examples:
  - Reset password: update user password + mark token as used
  - Verify email: mark email verified + mark token as used

## How to Create a New Route

Follow this pattern:

1. **Create folder structure**:
```
src/features/user/authentication/your-route/
├── route/
│   └── your-route.route.ts
├── index.ts
└── README.md
```

2. **Implement the route class** (see individual route READMEs for examples):
```typescript
import express, { Router, Request, Response } from "express";
import Status from "../../../../../shared/types/enums/status.enum.ts";

/**
 * YourRoute - Brief description
 *
 * Detailed documentation of the route's purpose,
 * features, and security considerations.
 */
export default class YourRoute {
  constructor() { }

  private get router() {
    return express.Router();
  }

  private _yourRouteMethod(): Router {
    return this.router.METHOD("/path", async (req: Request, res: Response): Promise<void> => {
      try {
        // Your logic here
        res.status(200).json({
          message: "Success message",
          status: Status.successful
        });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
          message: "Error message",
          status: Status.failed
        });
      }
    });
  }

  public get yourRoute(): Router {
    return this._yourRouteMethod();
  }
}
```

3. **Create index.ts**:
```typescript
import YourRoute from "./route/your-route.route.js";

export default YourRoute;
```

4. **Register in app.ts**:
```typescript
import YourRoute from "../../features/user/authentication/your-route/index.js";

// In the app method:
registry.registerRoute("/authentication", new YourRoute().yourRoute);
```

5. **Create README.md** documenting the thought process (see individual route READMEs for examples)

## Testing Routes

Each route should be tested with:
- Valid inputs
- Invalid inputs (validation)
- Edge cases (missing data, expired tokens, etc.)
- Error scenarios (database errors, email failures, etc.)

Use the example curl commands in each route's README for manual testing.

## Next Steps

Based on the API implementation plan, the next phases are:
- **Phase 3**: Account Management APIs
- **Phase 4**: Transaction APIs
- **Phase 5**: Avatar/Profile APIs (MongoDB)
- **Phase 6**: Infrastructure & Testing

Follow the same patterns established here when implementing these routes.
