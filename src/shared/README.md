# Shared Code

This directory contains shared code used across the application.

## Directory Structure

```
shared/
├── app/              # Application configuration
│   ├── app.ts        # Main app class
│   ├── app-registry.ts # Singleton registry
│   └── README.md
├── config/           # Environment configuration
│   ├── index.ts      # Environment loading and config
│   └── README.md
├── database/         # Database connections
│   ├── config.ts     # Database configuration
│   ├── prisma.ts     # Prisma client
│   ├── mongodb.ts    # MongoDB client
│   └── README.md
├── middleware/      # Express middleware
│   ├── auth.middleware.ts    # JWT authentication
│   ├── errorHandler.ts       # Error handling
│   ├── requestLogger.ts      # Request logging
│   └── README.md
├── services/         # External service integrations
│   └── email/
│       ├── sendgrid.service.ts # SendGrid email service
│       └── README.md
├── types/            # Type definitions
│   ├── enums/        # Enumerations
│   │   ├── env.enum.ts         # Environment enum
│   │   ├── status.enum.ts      # Status enum
│   │   └── README.md
│   └── model/        # Data models
│       ├── json.model.ts   # JSON model
│       └── README.md
└── utils/            # Utility classes
    ├── jwt.util.ts    # JWT token operations
    ├── password.util.ts # Password operations
    ├── token.util.ts   # Token generation
    ├── validation.util.ts # Input validation
    └── README.md
```

## Purpose

The `shared` directory contains code that is used across multiple parts of the application. This includes:

- **Application configuration**: Express app setup, middleware registration
- **Database management**: Connection handling, singleton patterns
- **Middleware**: Authentication, logging, error handling
- **Services**: External integrations (SendGrid)
- **Utilities**: Common operations (JWT, password, validation)
- **Types**: Type definitions (enums, models)
- **Configuration**: Environment variable loading

## Design Principles

### 1. Reusability
Code in `shared` is designed to be reused across:
- Different features (authentication, accounts, transactions)
- Different environments (development, staging, production)
- Different parts of the application (routes, services, utilities)

### 2. Singleton Pattern
Database clients use the singleton pattern to:
- Prevent connection pool exhaustion
- Improve performance (reuse connections)
- Simplify connection management
- Ensure consistent state

### 3. Type Safety
All code uses TypeScript for:
- Compile-time error checking
- Better IDE support
- Self-documenting code
- Easier refactoring

### 4. Separation of Concerns
Each directory has a specific responsibility:
- `app/` - Application setup
- `config/` - Configuration management
- `database/` - Database connections
- `middleware/` - Request/response processing
- `services/` - External integrations
- `utils/` - Common operations

## Import Patterns

### From shared code
```typescript
import { getPrismaClient } from '../shared/database/prisma.js';
import { JWTUtil } from '../shared/utils/jwt.util.js';
import { authenticate } from '../shared/middleware/auth.middleware.js';
```

### Using shared utilities in routes
```typescript
import { ValidationUtil } from '../../../../../shared/utils/validation.util.js';
import { PasswordUtil } from '../../../../../shared/utils/password.util.js';
import { JWTUtil } from '../../../../../shared/utils/jwt.util.js';
```

## Adding New Shared Code

### When to add to shared:
- Code used by multiple features
- Code used by multiple environments
- Generic utility functions
- External service integrations

### When NOT to add to shared:
- Feature-specific code (put in features/)
- Environment-specific code (put in environments/)
- One-off functions (keep in route)

### How to add:
1. Create appropriate file in correct directory
2. Follow existing patterns (static methods, types, documentation)
3. Add JSDoc comments
4. Create/update README
5. Import and use in features

## Common Patterns

### Utility Classes
```typescript
export class YourUtil {
  static yourMethod(params: YourParams): ReturnType {
    // Logic here
    return result;
  }
}
```

### Middleware
```typescript
export const yourMiddleware = (req, res, next) => {
  try {
    // Logic here
    next();
  } catch (error) {
    next(error);
  }
};
```

### Services
```typescript
export class YourService {
  static async doSomething(params: YourParams): Promise<void> {
    // Logic here
  }
}
```

## Dependencies

Shared code depends on:
- **Express**: Web framework
- **Prisma**: ORM for structured data
- **MongoDB**: Document database for unstructured data
- **jsonwebtoken**: JWT token handling
- **bcrypt**: Password hashing
- **@sendgrid/mail**: Email service
- **dotenv**: Environment variable loading

## Testing

Shared code should be tested with:
- Unit tests for utilities
- Integration tests for services
- Mock database connections for database code
- Mock external services for service code

## Documentation

Every directory and important file should have:
- JSDoc comments for classes and methods
- README.md for directories explaining purpose and usage
- Examples in READMEs showing how to use the code
