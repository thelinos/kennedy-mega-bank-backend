# Middleware

This directory contains Express middleware for the application.

## Files

### auth.middleware.ts
JWT authentication middleware for protecting routes.

**Purpose:**
- Validate JWT tokens from HTTP-only cookies
- Inject user data into request object
- Protect routes that require authentication

**Middleware Functions:**
- `authenticate(req, res, next)` - Requires valid JWT token
- `optionalAuth(req, res, next)` - Optional JWT token (proceeds regardless)

**Usage:**
```typescript
import { authenticate } from './auth.middleware.js';

router.get('/protected', authenticate, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

**How it Works:**
1. Extracts accessToken from HTTP-only cookie
2. Verifies token signature and expiration
3. If valid, injects user data into req.user
4. If invalid, returns 401 Unauthorized

### errorHandler.ts
Global error handling middleware.

**Purpose:**
- Catch all unhandled errors in the application
- Return consistent error responses
- Log errors for debugging

**Usage:**
Registered as the last middleware in app.ts:
```typescript
registry.registerErrorHandler(errorHandler);
```

**How it Works:**
1. Catches any error thrown in the application
2. Logs error to console
3. Returns 500 status with error message

**Production Considerations:**
- Use proper logging service (Winston, Pino)
- Sanitize error messages (don't expose stack traces)
- Send error reports to monitoring service (Sentry, Datadog)

### requestLogger.ts
HTTP request logging middleware.

**Purpose:**
- Log all HTTP requests with details
- Monitor application performance
- Debug request/response cycles

**Usage:**
Registered as the first middleware after Express built-ins:
```typescript
registry.registerMiddleware(requestLogger);
```

**Output Format:**
```
POST /authentication/login - 200 - 45ms
GET /authentication/me - 401 - 12ms
```

**How it Works:**
1. Records start time before request processing
2. Listens for 'finish' event on response
3. Calculates duration (current time - start time)
4. Logs method, path, status code, and duration

## Middleware Order

Middleware is registered in this order (critical!):

1. **Express built-in middleware** (json, urlencoded)
2. **cookie-parser** - Parse cookies
3. **cors** - Handle CORS
4. **requestLogger** - Log requests
5. **Routes** - Handle requests
6. **errorHandler** - Handle errors (must be last)

## How to Create New Middleware

Follow this pattern:

```typescript
import { Request, Response, NextFunction } from 'express';

/**
 * yourMiddleware - Description of what it does
 *
 * Detailed documentation.
 */
export const yourMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Your logic here
    next();
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

## Common Middleware Patterns

### Authentication Middleware
```typescript
export const authenticate = (req, res, next) => {
  // Validate token
  // Inject user data
  next();
};
```

### Authorization Middleware
```typescript
export const authorize = (roles: string[]) => {
  return (req, res, next) => {
    // Check if user has required roles
    next();
  };
};
```

### Rate Limiting Middleware
```typescript
export const rateLimit = (maxRequests: number) => {
  const requests = new Map();
  return (req, res, next) => {
    // Track requests per IP
    // Block if limit exceeded
    next();
  };
};
```

## Security Considerations

- Authentication middleware should be before route handlers
- Error handler must be last (catches all errors)
- Request logger should be early (logs all requests)
- CORS should be early (handles preflight requests)
