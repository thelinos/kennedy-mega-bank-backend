# Source Code

This directory contains all application source code.

## Directory Structure

```
src/
├── environments/       # Environment-specific entry points
│   ├── development/    # Development server
│   ├── staging/         # Staging server
│   ├── production/      # Production server
│   └── README.md
├── features/            # Feature-specific code
│   └── user/
│       └── authentication/  # Authentication feature
│           ├── create_user/
│           ├── login/
│           ├── logout/
│           ├── refresh/
│           ├── forgot-password/
│           ├── reset-password/
│           ├── verify_user/
│           ├── me/
│           └── README.md
└── shared/              # Shared code across features
    ├── app/             # Application configuration
    ├── config/          # Environment configuration
    ├── database/        # Database connections
    ├── middleware/      # Express middleware
    ├── services/        # External service integrations
    ├── types/           # Type definitions
    │   ├── enums/        # Enumerations
    │   └── model/        # Data models
    └── utils/           # Utility classes
```

## Directory Responsibilities

### environments/
Entry points for different environments (development, staging, production).
Each environment loads its own .env file and connects to appropriate databases.

### features/
Business-domain specific code organized by feature. Each feature contains
route handlers, services, and utilities specific to that domain.

### shared/
Code shared across multiple features and environments. This includes:
- Application setup (Express configuration)
- Database connections (Prisma, MongoDB)
- Middleware (authentication, logging, error handling)
- Services (SendGrid email)
- Types (enums, models)
- Utilities (JWT, password, validation, tokens)

## How the Application Starts

1. **Environment Entry Point** (`environments/development/index.ts`)
   - Loads environment variables
   - Connects to databases
   - Initializes Express app
   - Starts server

2. **App Initialization** (`shared/app/app.ts`)
   - Creates AppRegistry singleton
   - Initializes Express with middleware
   - Registers all routes
   - Returns configured Express app

3. **Route Registration** (from features/)
   - Each feature registers its routes
   - Routes are mounted at specific paths
   - Middleware is applied as needed

4. **Request Processing**
   - Request reaches Express
   - Middleware processes request (logging, auth)
   - Route handler processes request
   - Response sent to client

## Code Organization Principles

### 1. Separation of Concerns
- **environments/**: Entry points and environment-specific code
- **features/**: Business logic and routes
- **shared/**: Reusable utilities and configuration

### 2. Feature-Based Organization
- Each business domain is a feature
- Features are self-contained
- Features depend on shared code, not other features

### 3. Shared Code
- Common utilities in `shared/utils/`
- Common middleware in `shared/middleware/`
- Common services in `shared/services/`
- Type definitions in `shared/types/`
- Database code in `shared/database/`

### 4. Consistent Patterns
- Class-based route handlers
- Singleton database clients
- Static utility methods
- TypeScript for type safety

## Import Patterns

### From features to shared:
```typescript
import { getPrismaClient } from '../../../shared/database/prisma.js';
import { JWTUtil } from '../../../shared/utils/jwt.util.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import Status from '../../../shared/types/enums/status.enum.js';
```

### From environments to shared:
```typescript
import { App } from '../../shared/app/app.js';
import { loadEnv, getEnvConfig } from '../../shared/config/index.js';
import { connectPrismaOnly } from '../../shared/database/config.js';
```

## Adding New Code

### Adding a New Feature
1. Create feature directory in `features/`
2. Create route handler following pattern
3. Create index.ts
4. Create README.md
5. Register in `shared/app/app.ts`

### Adding Shared Utility
1. Create utility file in `shared/utils/`
2. Add JSDoc comments
3. Export as class or function
4. Update `shared/utils/README.md`

### Adding Shared Type
1. Create type file in `shared/types/`
2. Add JSDoc comments
3. Export as interface, enum, or class
4. Update `shared/types/README.md`

### Adding Shared Middleware
1. Create middleware file in `shared/middleware/`
2. Add JSDoc comments
3. Export as function
4. Update `shared/middleware/README.md`
5. Register in `shared/app/app.ts`

### Adding Environment
1. Create environment directory in `environments/`
2. Create index.ts following pattern
3. Create .env file
4. Add npm script in package.json
5. Update `environments/README.md`

## TypeScript Configuration

All TypeScript files use ES modules (`.js` extension in imports):
```typescript
import { Express } from "express";
import { getPrismaClient } from "./database/prisma.js";
```

This is configured in `tsconfig.json` with `"module": "ESNext"`.

## Build Process

The build process:
1. Compiles TypeScript to JavaScript
2. Outputs to `dist/` directory
3. Maintains ES module structure
4. Type-checks all code

Run with:
```bash
npm run build
```

## Development Workflow

1. Make changes to TypeScript files
2. Run `npm run build` to compile
3. Run `npm run dev` to start development server
4. Test changes
5. Commit TypeScript files (not compiled JavaScript)

## Database Schema

Database schema is defined in `prisma/schema.prisma` (at project root, not in src/).
- User model
- Account model
- Transaction model
- EmailToken model
- PasswordResetToken model

Run migrations with:
```bash
npm run prisma:migrate:dev
```

## Testing

Test files should be placed in `tests/` directory (at project root):
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests

Run tests with:
```bash
npm test
```

## Documentation

Every directory and important file should have:
- README.md for directories
- JSDoc comments for classes and methods
- Examples in READMEs showing usage
