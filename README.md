# Kennedy Mega Bank Backend

A TypeScript Express backend using PostgreSQL for staging/production and SQLite for local development and tests.

## Features

- TypeScript with Express
- Prisma ORM with environment-specific SQLite and PostgreSQL schemas
- Feature-first architecture
- Multi-environment support (development, staging, production)
- Environment-specific configurations
- Comprehensive testing infrastructure (unit, integration, e2e)
- Code coverage reporting

## API documentation

When the server is running, Swagger UI is available at `/api-docs` and the OpenAPI 3.0 specification is available at `/api-docs.json`. The documentation is served in development, staging, and production.

Most protected endpoints use the HTTP-only `accessToken` cookie set by registration, login, phone verification, or token refresh. The token refresh endpoint uses the `refreshToken` cookie. In a browser, requests that send authentication cookies must use an allowed origin.

## Architecture Overview

This project follows a **layered architecture** with clear separation of concerns and comprehensive testing infrastructure:

```
┌─────────────────────────────────────────────────────────────┐
│                    Environment Entry Points                 │
│  (development/index.ts, staging/index.ts, production)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Application Layer                  │
│                     (src/shared/app.ts)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Configuration & Database           │
│  (config/, database/, middleware/)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma Schema & Environment Files         │
│         (prisma/schema.prisma, .env.*)                      │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── environments/
│   ├── development/
│   ├── staging/
│   └── production/
├── features/
│   ├── user/
│   ├── account/
│   └── transaction/
└── shared/
    ├── app.ts
    ├── config/
    ├── database/
    ├── middleware/
    ├── types/
    └── utils/
tests/
├── unit/              # Unit tests for individual functions
├── integration/       # Integration tests for database operations
├── e2e/              # End-to-end tests for API endpoints
├── fixtures/         # Test data helpers
└── setup.ts          # Global test setup
```

## File Interconnection Guide

### Root Configuration Files

#### `vitest.config.ts`
**Purpose**: Vitest test runner configuration.

**Interconnections**:
- **`tests/setup.ts`**: Global setup file executed before all tests
- **`src/`**: Aliased as `@` for cleaner imports in tests
- **`tests/`**: Aliased as `@tests` for fixture imports
- **`package.json`**: Test scripts reference this config

**Impact**:
- Determines how all tests are executed
- Controls coverage reporting settings
- Affects test file discovery patterns

#### `tests/setup.ts`
**Purpose**: Global test setup and teardown.

**Interconnections**:
- **`src/shared/database/prisma.ts`**: Connects Prisma before all tests
- **All test files**: Executed after setup, before teardown
- **`vitest.config.ts`**: Registered as setup file

**Impact**:
- Ensures database connections are available for all tests
- Provides clean database state for test isolation
- Changes affect all test files equally

**Flow**:
```
Before all tests:
  → Connect to Prisma (SQLite)
  → Ready for database operations

After all tests:
  → Disconnect from Prisma
```

#### `package.json`
**Purpose**: Defines project metadata, dependencies, and npm scripts.

**Interconnections**:
- **Dependencies**: `@prisma/client` and `prisma` enable Prisma ORM functionality
- **Dependencies**: `express` provides the web framework
- **Dependencies**: `dotenv` loads environment variables
- **DevDependencies**: `vitest` provides test runner
- **DevDependencies**: `supertest` provides HTTP testing
- **Scripts**: `npm run dev` → calls `tsx watch src/environments/development/index.ts`
- **Scripts**: `npm run build` → calls `tsc` (TypeScript compiler)
- **Scripts**: `npm run test` → calls `vitest` to run all tests
- **Scripts**: `npm run test:unit` → runs unit tests only
- **Scripts**: `npm run test:integration` → runs integration tests only
- **Scripts**: `npm run test:e2e` → runs e2e tests only
- **Scripts**: `npm run test:watch` → runs tests in watch mode
- **Scripts**: `npm run test:coverage` → generates coverage report
- **Scripts**: `npm run prisma:generate` → generates Prisma client from schema

**Impact on other files**:
- Changes to dependencies affect what can be imported in `.ts` files
- Script changes affect how the application is started and built

#### `tsconfig.json`
**Purpose**: TypeScript compiler configuration.

**Interconnections**:
- **`rootDir: "./src"`**: All TypeScript source files must be in `src/`
- **`outDir: "./dist"`**: Compiled JavaScript output goes to `dist/`
- **`moduleResolution: "node"`**: Enables ES module imports with `.js` extensions
- **`include: ["src/**/*", "tests/**/*"]`**: Compiles files in `src/` and `tests/` directories

**Impact on other files**:
- Determines how imports work across all `.ts` files
- Controls strict type checking which affects all TypeScript code
- Output location affects where built files are deployed

### Environment Configuration Files

#### `.env.example`
**Purpose**: Template for environment variables.

**Interconnections**:
- Serves as documentation for required environment variables
- Copied to create `.env.development`, `.env.staging`, `.env.production`

#### `.env.development`
**Purpose**: Development environment variables.

**Interconnections**:
- **`DATABASE_URL`**: Read by `prisma/schema.prisma` via `env("DATABASE_URL")`
- **`DATABASE_URL`**: Loaded by `src/shared/config/index.ts` via `dotenv`
- **`PORT`**: Loaded by `src/shared/config/index.ts` for server port
- **`NODE_ENV`**: Loaded by `src/shared/config/index.ts` for environment identification

**Impact**: Changing these values immediately affects how the development server connects to databases and which port it listens on.

#### `.env.staging`
**Purpose**: Staging environment variables.

**Interconnections**: Same as `.env.development` but for staging environment.
- Used when running `npm run staging`
- Uses PostgreSQL via `prisma/postgresql/schema.prisma`
- Uses port 3001

#### `.env.production`
**Purpose**: Production environment variables.

**Interconnections**: Same as `.env.development` but for production environment.
- Used when running `npm run prod`
- Uses PostgreSQL via `prisma/postgresql/schema.prisma`
- Uses port 3002

#### `.env`
**Purpose**: Fallback environment file (currently development copy).

**Interconnections**:
- Used by Prisma CLI for migrations (`prisma migrate dev`)
- Fallback when environment-specific files don't exist

### Prisma Configuration

#### `prisma/schema.prisma`
**Purpose**: Database schema definition for SQLite via Prisma ORM.

**Interconnections**:
- **`env("DATABASE_URL")`**: Reads `DATABASE_URL` from environment variables
- **Models (User, Account, Transaction)**: Define database structure
- **Generated Prisma Client**: After running `prisma generate`, creates `@prisma/client` with typed query methods
- **`src/shared/database/prisma.ts`**: Imports generated Prisma Client to interact with database

**Impact**:
- Schema changes require running `prisma migrate dev` to update SQLite database
- Schema changes require running `prisma generate` to update TypeScript types
- Model definitions directly affect available query methods in `@prisma/client`

**Database Models**:
- **User**: Stores user information (id, email, username, name)
- **Account**: Stores account information linked to users
- **Transaction**: Stores transaction records linked to accounts

### Shared Configuration Layer

#### `src/shared/config/index.ts`
**Purpose**: Centralized environment configuration loading.

**Interconnections**:
- **`dotenv`**: Loads environment variables from `.env.*` files
- **`loadEnv(env)`**: Called by environment entry points to load specific environment config
- **`getEnvConfig()`**: Returns typed configuration object used by entry points
- **→ Environment entry points**: Import and call `loadEnv()` and `getEnvConfig()`

**Impact**:
- Changes to environment loading logic affect all environments equally
- Adding new environment variables requires updating this file and all `.env.*` files

**Flow**:
```
Entry point calls loadEnv('development')
  → Loads .env.development
  → Fallback to .env if needed
Entry point calls getEnvConfig()
  → Reads process.env variables
  → Returns typed config object
```

### Shared Database Layer

#### `src/shared/database/prisma.ts`
**Purpose**: Prisma client singleton and connection management.

**Interconnections**:
- **`@prisma/client`**: Generated from `prisma/schema.prisma`
- **`getPrismaClient()`**: Creates singleton PrismaClient instance
- **`disconnectPrisma()`**: Closes Prisma connection gracefully
- **`src/shared/database/config.ts`**: Imports `getPrismaClient()` and `disconnectPrisma()`

**Impact**:
- Singleton pattern ensures single database connection per application
- Changes affect all code using Prisma queries

**Flow**:
```
First call to getPrismaClient()
  → Creates new PrismaClient instance
  → Stores in module-level variable
Subsequent calls
  → Returns existing instance
disconnectPrisma()
  → Closes connection
  → Resets singleton for reconnection
```

#### `src/shared/database/config.ts`
Connects and disconnects the active Prisma database. A separate
MongoDB integration is not included in the active application.

### Shared Middleware Layer

#### `src/shared/middleware/requestLogger.ts`
**Purpose**: HTTP request logging middleware.

**Interconnections**:
- **`express`**: Express Request, Response, NextFunction types
- **`src/shared/app.ts`**: Imported and registered as middleware
- **Applied to all routes**: Logs method, path, status code, and duration

**Impact**:
- Every HTTP request is logged with timing information
- Changes affect logging format for all requests

**Flow**:
```
Request arrives
  → requestLogger middleware
  → Records start time
  → Calls next()
  → Route handler executes
  → Response finishes
  → Logs: METHOD PATH - STATUS - DURATIONms
```

#### `src/shared/middleware/errorHandler.ts`
**Purpose**: Global error handling middleware.

**Interconnections**:
- **`express`**: Express Request, Response, NextFunction types
- **`src/shared/app.ts`**: Imported and registered as error handler
- **Catches all errors**: Must be registered after all routes

**Impact**:
- All unhandled errors are caught and formatted consistently
- Changes affect error response format for all routes

**Flow**:
```
Any route throws error
  → Error propagates through middleware chain
  → errorHandler catches it
  → Logs error
  → Returns 500 with error message
```

### Shared Application Layer

#### `src/shared/app.ts`
**Purpose**: Express application factory.

**Interconnections**:
- **`express`**: Creates Express application
- **`src/shared/database/config.ts`**: Imports `DatabaseConfig` interface
- **`src/shared/middleware/requestLogger.ts`**: Registers request logging
- **`src/shared/middleware/errorHandler.ts`**: Registers error handling
- **Environment entry points**: Instantiate `App` with the active Prisma database

**Impact**:
- Centralizes Express app configuration
- Changes affect all environments equally
- Adding middleware here applies to all routes

**Flow**:
```
Entry point calls new App(databases).app()
  → Creates Express app
  → Registers JSON body parser
  → Registers URL-encoded parser
  → Registers requestLogger middleware
  → Registers /health route
  → Registers errorHandler middleware
  → Returns configured app
Entry point calls app.listen(port)
  → Server starts listening
```

### Environment Entry Points

#### `src/environments/development/index.ts`
**Purpose**: Development environment server entry point.

**Interconnections**:
- **`src/shared/config/index.ts`**: Imports `loadEnv()` and `getEnvConfig()`
- **`src/shared/database/config.ts`**: Imports `connectPrismaOnly()` and `disconnectAllDatabases()`
- **`src/shared/app/app.ts`**: Creates the Express application
- **`.env.development`**: Loaded by `loadEnv('development')`
- **`package.json`**: Called by `npm run dev` script

**Impact**:
- Serves as the development server entry point
- Loads development-specific configuration
- Starts server on port 3000 (from `.env.development`)

**Flow**:
```
npm run dev executes tsx watch src/environments/development/index.ts
  → loadEnv('development')
    → Loads .env.development
  → getEnvConfig()
    → Returns { nodeEnv, port, databaseUrl }
  → Connects to Prisma using SQLite
  → Creates Express app with middleware
  → app.listen(port)
    → Server starts on port 3000
  → SIGINT handler
    → Calls disconnectAllDatabases()
    → Exits process
```

#### `src/environments/staging/index.ts`
**Purpose**: Staging environment server entry point.

**Interconnections**: Identical to development but:
- Calls `loadEnv('staging')` → loads `.env.staging`
- Uses port 3001 from `.env.staging`
- Uses PostgreSQL via `prisma/postgresql/schema.prisma`
- Called by `npm run staging`

**Impact**: Provides isolated staging environment for testing.

#### `src/environments/production/index.ts`
**Purpose**: Production environment server entry point.

**Interconnections**: Identical to development but:
- Calls `loadEnv('production')` → loads `.env.production`
- Uses port 3002 from `.env.production`
- Uses PostgreSQL via `prisma/postgresql/schema.prisma`
- Called by `npm run prod`

**Impact**: Provides isolated production environment.

## Complete Data Flow Example

### Starting the Development Server

```
1. User runs: npm run dev
   ↓
2. package.json executes: tsx watch src/environments/development/index.ts
   ↓
3. development/index.ts calls loadEnv('development')
   ↓
4. src/shared/config/index.ts loads .env.development
   ↓
5. development/index.ts calls getEnvConfig()
   ↓
6. Returns: { nodeEnv: 'development', port: 3000, databaseUrl: 'file:./dev.db', ... }
   ↓
7. development/index.ts connects Prisma using the SQLite schema
   ↓
8. src/shared/database/config.ts calls getPrismaClient()
   ↓
9. src/shared/database/prisma.ts creates PrismaClient (singleton)
   ↓
10. development/index.ts creates the Express app
    ↓
15. Registers middleware (requestLogger, errorHandler)
    ↓
16. Registers /health route
    ↓
17. Returns configured app
    ↓
18. development/index.ts calls app.listen(3000)
    ↓
19. Server starts listening on port 3000
    ↓
20. Logs: "🚀 Development server running on port 3000"
```

### Handling an HTTP Request

```
1. HTTP GET /health arrives
   ↓
2. requestLogger middleware (src/shared/middleware/requestLogger.ts)
   ↓
3. Records start time
   ↓
4. Calls next()
   ↓
5. /health route handler executes
   ↓
6. Returns { status: 'ok', environment: 'development' }
   ↓
7. Response finishes
   ↓
8. requestLogger logs: "GET /health - 200 - 5ms"
```

### Database Query Flow

```
1. Feature code calls database query
   ↓
2. Uses prisma from DatabaseConfig
   ↓
3. Prisma Client queries SQLite database
   ↓
4. Returns typed results
   ↓
5. Feature code processes results
   ↓
6. Returns HTTP response
```

## Installation

```bash
npm install
```

This installs all dependencies including:
- Runtime dependencies (express, prisma, mongodb, dotenv)
- Development dependencies (typescript, tsx, vitest, supertest)
- Type definitions (@types/*)

## Running Tests

### Run All Tests
```bash
npm test
```
Runs all tests in `tests/unit/`, `tests/integration/`, and `tests/e2e/`.

### Run Unit Tests Only
```bash
npm run test:unit
```
Runs only tests in `tests/unit/`. Fastest execution.

### Run Integration Tests Only
```bash
npm run test:integration
```
Runs only tests in `tests/integration/`. Requires database.

### Run E2E Tests Only
```bash
npm run test:e2e
```
Runs only tests in `tests/e2e/`. Slowest but most comprehensive.

### Watch Mode
```bash
npm run test:watch
```
Runs tests in watch mode. Automatically re-runs when files change.

### Coverage Report
```bash
npm run test:coverage
```
Generates code coverage report in:
- Terminal output (text format)
- `coverage/` directory (HTML format)

## Environment Setup

### Local development

`.env.development` is ignored by Git and may already contain local credentials.
Do not overwrite it by copying `.env.example` over an existing file. For a new
checkout, create it only if it does not exist:

```bash
test -f .env.development || cp .env.example .env.development
```

Set the following in `.env.development`:

- `DATABASE_URL="file:./dev-local.db"` so development does not use or alter
  the existing `prisma/dev.db`.
- `JWT_SECRET` to a random secret of at least 32 bytes. Generate one with
  `openssl rand -base64 48` and store it only in the ignored env file.
- `CORS_ORIGINS` to the exact frontend origin(s), e.g.
  `http://localhost:5173`. Do not use `*`.
- Keep `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, and
  `FRONTEND_URL` empty unless configuring Google OAuth end-to-end.
- Configure SendGrid with `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, and
  `SENDGRID_FROM_NAME` if you want to test email verification or password
  reset locally. In this checkout, those same three SendGrid settings are
  also present in the ignored `.env.staging` and `.env.production` files at
  your direction. For actual deployments, inject them through the platform's
  secret manager rather than copying local env files.

Initialize only the separate development database:

```bash
npm run prisma:generate
DATABASE_URL="file:./dev-local.db" npx prisma migrate deploy --schema prisma/schema.prisma
```

Prisma resolves this SQLite URL relative to the schema file, so this creates
`prisma/dev-local.db`. Tests use the separate ignored `tests/test.db`.

### Connect a frontend

1. Start the API with `npm run dev`.
2. Set the frontend API base URL to `http://localhost:3000`.
3. Configure browser requests to include cookies (for `fetch`, use
   `credentials: "include"`; for Axios, use `withCredentials: true`).
4. Ensure the frontend's exact origin is listed in `CORS_ORIGINS`.
5. Check `GET http://localhost:3000/health`; it should return `status: "ok"`
   and `database: "SQLite"`.
6. Sign up or log in through `/authentication/create-user` or
   `/authentication/login`, then create an account with `/accounts`.

Transaction writes require an `Idempotency-Key` header. Ordinary users may
debit their own account but cannot create credits. To test credit behavior,
put the test user's ID in `LEDGER_CREDIT_USER_IDS` and restart the API. Do not
use real financial funds.

### Staging and production

These environments use PostgreSQL. Set `DATABASE_URL` to the correct
environment-specific PostgreSQL connection string, and supply strong,
environment-specific JWT secrets, `CORS_ORIGINS`, and SendGrid variables via
the deployment platform's secret manager. Do not copy production secrets into
development or commit any `.env` file.

## Running the Application

### Development
```bash
npm run dev
```
This first generates the SQLite Prisma client, then executes
`tsx watch src/environments/development/index.ts`, which:
- Loads `.env.development`
- Connects to SQLite using `prisma/schema.prisma`
- Starts server on port 3000

### Staging
```bash
npm run staging
```
This executes `tsx watch src/environments/staging/index.ts`, which:
- Loads `.env.staging`
- Generates the PostgreSQL Prisma client and connects to PostgreSQL
- Starts server on port 3001

### Production
```bash
npm run prod
```
This executes `tsx src/environments/production/index.ts`, which:
- Loads `.env.production`
- Generates the PostgreSQL Prisma client and connects to PostgreSQL
- Starts server on port 3002

## Building

```bash
npm run build
npm run build:production
```
`build` compiles the currently generated Prisma client. `build:production` first
generates the PostgreSQL client, then compiles TypeScript to `dist/`.

## Running Built Application

```bash
npm run start:dev    # For development
npm run start:staging # For staging
npm run start:prod   # For production
```

These run the compiled JavaScript from `dist/` using Node.js.
`start:dev` regenerates the SQLite Prisma client first; use
`build:production`/`start:prod` for the PostgreSQL client. The generated Prisma
client is shared, so always use the matching environment script after switching
between database providers.

## Prisma Commands

```bash
npm run prisma:generate    # Generate Prisma client from schema
npm run prisma:generate:postgres # Generate PostgreSQL Prisma client
                           # Updates @prisma/client with new types
                           # Required after schema changes

npm run prisma:migrate:dev # Run migrations in development
                           # Reads .env for DATABASE_URL
                           # Creates/updates SQLite database
                           # Generates Prisma client automatically

npm run prisma:migrate:deploy # Deploy migrations (production)
                               # Applies pending migrations without prompts
npm run prisma:migrate:deploy:postgres # Deploy PostgreSQL migrations

npm run prisma:studio      # Open Prisma Studio GUI
                           # Visual database browser
                           # Reads DATABASE_URL from .env
```

## Database

Development and tests use SQLite (`prisma/schema.prisma`). Staging and
production use PostgreSQL (`prisma/postgresql/schema.prisma`) with an
independent migration history under `prisma/postgresql/migrations`.
Profile picture storage is not implemented; add a cloud object-storage
integration before enabling uploads.

Accounts store an ISO 4217 currency code (USD by default) and balances and
transactions store integer minor units using that currency's precision. No
currency conversion or cross-currency transfer is performed. Transaction
creation requires a client-supplied `Idempotency-Key`; retries with the same
key and payload return the original result, while reusing a key with a
different payload is rejected. Public users cannot post credits; only user IDs
configured in `LEDGER_CREDIT_USER_IDS` may perform controlled credit operations.

Refresh tokens are persisted, rotated, and revoked on logout or password reset.
OAuth callback state is bound to an HTTP-only cookie, and authentication and
ledger routes use shared database-backed rate limits. When deployed behind a
reverse proxy, configure `TRUST_PROXY_HOPS` to the exact trusted hop count so
per-IP limits use the client address; do not enable unrestricted proxy trust.

This repository still does not provide payment-rail connectivity, settlement,
reconciliation, regulatory controls, or independent financial-system
certification. Do not use it to hold or move real funds without a dedicated
security, compliance, and financial-domain review.

## Health Check

The application includes a health check endpoint:
```
GET /health
```

Returns:
```json
{
  "status": "ok",
  "environment": "development",
  "database": "SQLite"
}
```

This endpoint is registered in `src/shared/app.ts` and uses the `NODE_ENV` from the loaded environment.

### Test Files

#### `tests/fixtures/testData.ts`
**Purpose**: Reusable test data helpers and utilities.

**Interconnections**:
- **`@prisma/client`**: Uses Prisma client for database operations
- **Integration tests**: Import helpers for creating test data
- **E2E tests**: Import helpers for setting up test scenarios

**Impact**:
- Provides consistent test data across all tests
- Reduces code duplication in test files
- Changes affect all tests using fixtures

**Available Helpers**:
- `createTestUser()`: Creates a test user in database
- `createTestAccount()`: Creates a test account linked to a user
- `createTestTransaction()`: Creates a test transaction linked to an account
- `createFullTestDataset()`: Creates complete user-account-transaction dataset
- `cleanupTestData()`: Cleans up all test data from database

## Adding New Features

When adding new features (e.g., user routes, account management):

1. Create feature directory in `src/features/your-feature/`
2. Add TypeScript files for your feature logic
3. Import database clients from `src/shared/database/config.ts`
4. Register routes in `src/shared/app.ts`
5. Run `npm run build` to compile
6. Test with `npm run dev`

## Environment Isolation

Each environment is completely isolated:
- **Different ports**: 3000 (dev), 3001 (staging), 3002 (prod)
- **Different database providers**: SQLite for development; PostgreSQL for staging and production
- **Independent configurations**: Separate .env files

This ensures no cross-contamination between environments.

## Testing

The project uses **Vitest** as the test runner, which provides fast unit testing with native TypeScript support. The testing infrastructure is organized into three categories:

### Test Structure

```
tests/
├── unit/              # Unit tests for individual functions/modules
├── integration/       # Integration tests for database interactions
├── e2e/              # End-to-end tests for full application flow
├── fixtures/         # Test data helpers and utilities
└── setup.ts          # Global test setup and teardown
```

### Testing Dependencies

The following testing modules are installed:

- **vitest**: Fast unit test framework with native TypeScript support
- **supertest**: HTTP assertion library for testing Express applications
- **@types/supertest**: TypeScript type definitions for supertest

### Test Configuration

#### `vitest.config.ts`
**Purpose**: Vitest configuration file.

**Interconnections**:
- **`tests/setup.ts`**: Global setup file executed before all tests
- **`src/`**: Aliased as `@` for cleaner imports
- **`tests/`**: Aliased as `@tests` for fixture imports
- **Coverage**: Configured to exclude tests, node_modules, and dist

**Settings**:
- `globals: true`: Enables global test functions (describe, it, expect)
- `environment: 'node'`: Node.js environment for backend testing
- `include: ['tests/**/*.test.ts']`: Only runs files ending with `.test.ts`

#### `tests/setup.ts`
**Purpose**: Global test setup and teardown.

**Interconnections**:
- **`src/shared/database/prisma.ts`**: Connects Prisma before tests
- **All test files**: Executed after setup, before teardown

**Flow**:
```
Before all tests:
  → Connect to Prisma (SQLite)
  → Ready for database operations

After all tests:
  → Disconnect from Prisma
```

### Test Categories

#### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual functions and modules in isolation.

**When to use**:
- Testing pure functions (no side effects)
- Testing configuration loading
- Testing utility functions
- Testing business logic without external dependencies

**Example**: `tests/unit/config.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { loadEnv, getEnvConfig } from '../../src/shared/config/index.js';

describe('Shared Config - Unit Tests', () => {
  describe('loadEnv', () => {
    it('should load development environment variables', () => {
      loadEnv('development');
      expect(process.env.NODE_ENV).toBe('development');
    });
  });

  describe('getEnvConfig', () => {
    it('should return default values when env vars are not set', () => {
      const config = getEnvConfig();
      expect(config).toHaveProperty('nodeEnv');
      expect(config).toHaveProperty('port');
    });
  });
});
```

**Key points**:
- No database connections
- Fast execution
- Pure function testing
- Mock external dependencies if needed

#### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test interactions between modules and with databases.

**When to use**:
- Testing database operations
- Testing service layer with real database
- Testing database migrations
- Testing data validation

**Example**: `tests/integration/database.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPrismaClient } from '../../src/shared/database/prisma.js';

describe('Database Integration Tests', () => {
  let prisma: ReturnType<typeof getPrismaClient>;

  beforeEach(() => {
    prisma = getPrismaClient();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should create a user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      },
    });

    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
  });
});
```

**Key points**:
- Real database connections (SQLite)
- Data cleanup in `afterEach`
- Tests actual database operations
- Slower than unit tests but more realistic

#### 3. End-to-End Tests (`tests/e2e/`)

**Purpose**: Test the complete application flow through HTTP endpoints.

**When to use**:
- Testing API endpoints
- Testing request/response flow
- Testing middleware
- Testing complete user workflows

**Example**: `tests/e2e/app.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { App } from '../../src/shared/app/app.js';
import type { Express } from 'express';
import type { DatabaseConfig } from '../../src/shared/database/config.js';
import { connectPrismaOnly, disconnectAllDatabases } from '../../src/shared/database/config.js';

describe('Application E2E Tests', () => {
  let app: Express;
  let databases: DatabaseConfig;

  beforeAll(async () => {
    databases = await connectPrismaOnly();
    app = await new App(databases).app();
  });

  afterAll(async () => {
    await disconnectAllDatabases(databases);
  });

  it('should return 200 with status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
```

**Key points**:
- Full HTTP requests with supertest
- Real Express application
- Complete request/response cycle
- Slowest but most comprehensive

#### 4. Test Fixtures (`tests/fixtures/`)

**Purpose**: Reusable test data helpers.

**Example**: `tests/fixtures/testData.ts`

```typescript
import { PrismaClient } from '@prisma/client';

export const createTestUser = async (prisma: PrismaClient, overrides = {}) => {
  return prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      ...overrides,
    },
  });
};

export const createFullTestDataset = async (prisma: PrismaClient) => {
  const user = await createTestUser(prisma);
  const account = await createTestAccount(prisma, user.id);
  const transaction = await createTestTransaction(prisma, account.id);
  return { user, account, transaction };
};

export const cleanupTestData = async (prisma: PrismaClient) => {
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
};
```

**Key points**:
- DRY (Don't Repeat Yourself) for test data
- Consistent test data across tests
- Easy to override for specific test cases
- Includes cleanup utilities

### Running Tests

#### Run All Tests
```bash
npm test
```
Runs all tests in `tests/unit/`, `tests/integration/`, and `tests/e2e/`.

#### Run Unit Tests Only
```bash
npm run test:unit
```
Runs only tests in `tests/unit/`. Fastest execution.

#### Run Integration Tests Only
```bash
npm run test:integration
```
Runs only tests in `tests/integration/`. Requires database.

#### Run E2E Tests Only
```bash
npm run test:e2e
```
Runs only tests in `tests/e2e/`. Slowest but most comprehensive.

#### Watch Mode
```bash
npm run test:watch
```
Runs tests in watch mode. Automatically re-runs when files change.

#### Coverage Report
```bash
npm run test:coverage
```
Generates code coverage report in:
- Terminal output (text format)
- `coverage/` directory (HTML format)

Coverage report shows:
- Line coverage percentage
- Branch coverage percentage
- Function coverage percentage
- Statement coverage percentage

### Writing Tests: Step-by-Step Guide

#### Step 1: Create Test File
Create a new test file in the appropriate directory:
- Unit test: `tests/unit/your-feature.test.ts`
- Integration test: `tests/integration/your-feature.test.ts`
- E2E test: `tests/e2e/your-feature.test.ts`

#### Step 2: Import Dependencies
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// Import the module you're testing
import { yourFunction } from '../../src/shared/your-module.js';
```

#### Step 3: Write Test Suite
```typescript
describe('Your Feature', () => {
  describe('Your Function', () => {
    it('should do something', () => {
      const result = yourFunction(input);
      expect(result).toBe(expected);
    });
  });
});
```

#### Step 4: Add Setup/Teardown (if needed)
```typescript
let prisma: PrismaClient;

beforeEach(() => {
  prisma = getPrismaClient();
});

afterEach(async () => {
  await cleanupTestData(prisma);
});
```

#### Step 5: Run Tests
```bash
npm test
```

#### Step 6: Debug Failing Tests
If a test fails:
1. Read the error message
2. Check the line number
3. Add `console.log` statements for debugging
4. Re-run tests with `npm run test:watch`

### Testing Best Practices

#### 1. Test Naming
- Use descriptive test names
- Follow pattern: "should [do something] when [condition]"
- Example: "should create user when valid data provided"

#### 2. Arrange-Act-Assert Pattern
```typescript
it('should create user', async () => {
  // Arrange: Set up test data
  const userData = { email: 'test@example.com', username: 'testuser' };

  // Act: Execute the function
  const user = await prisma.user.create({ data: userData });

  // Assert: Verify the result
  expect(user.email).toBe('test@example.com');
});
```

#### 3. Isolation
- Each test should be independent
- Clean up data in `afterEach`
- Don't rely on test execution order

#### 4. Use Fixtures
- Reuse test data helpers from `tests/fixtures/`
- Avoid duplicating test data creation code
- Make tests more maintainable

#### 5. Test Edge Cases
- Test success scenarios
- Test error scenarios
- Test boundary conditions
- Test invalid inputs

#### 6. Keep Tests Fast
- Unit tests should be < 100ms
- Integration tests should be < 1s
- E2E tests should be < 5s
- Use mocks for slow external services

### Test Example: Adding a New Feature

Let's say you're adding a user creation route. Here's how to test it:

#### 1. Unit Test (tests/unit/user.test.ts)
```typescript
import { describe, it, expect } from 'vitest';
import { validateUserData } from '../../src/features/user/validation.js';

describe('User Validation', () => {
  it('should validate correct user data', () => {
    const result = validateUserData({
      email: 'test@example.com',
      username: 'testuser',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = validateUserData({
      email: 'invalid-email',
      username: 'testuser',
    });
    expect(result.valid).toBe(false);
  });
});
```

#### 2. Integration Test (tests/integration/user.test.ts)
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPrismaClient } from '../../src/shared/database/prisma.js';
import { createUser } from '../../src/features/user/service.js';

describe('User Service Integration', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = getPrismaClient();
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should create user in database', async () => {
    const user = await createUser({
      email: 'test@example.com',
      username: 'testuser',
    });

    expect(user).toHaveProperty('id');
    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found).toBeTruthy();
  });
});
```

#### 3. E2E Test (tests/e2e/user.test.ts)
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { App } from '../../src/shared/app/app.js';
import type { Express } from 'express';
import type { DatabaseConfig } from '../../src/shared/database/config.js';
import { connectPrismaOnly, disconnectAllDatabases } from '../../src/shared/database/config.js';

describe('User API E2E', () => {
  let app: Express;
  let databases: DatabaseConfig;

  beforeAll(async () => {
    databases = await connectPrismaOnly();
    app = await new App(databases).app();
  });

  afterAll(async () => {
    await disconnectAllDatabases(databases);
  });

  it('should create user via POST /authentication/create-user', async () => {
    const response = await request(app)
      .post('/authentication/create-user')
      .send({
        email: 'test@example.com',
        password: 'StrongPass123!',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('test@example.com');
  });
});
```

### Testing Interconnections

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Execution Flow                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    tests/setup.ts                            │
│              (Global Setup - connect databases)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Test Files Run                            │
│         (unit, integration, e2e tests execute)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    vitest.config.ts                          │
│              (Configures test behavior)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Test Results                              │
│           (Pass/Fail, Coverage, Timing)                      │
└─────────────────────────────────────────────────────────────┘
```

### Continuous Integration

When setting up CI/CD (e.g., GitHub Actions), add:

```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    directory: ./coverage
```

### Test Database

Tests use the same SQLite database as development (`dev.db`). To keep test data isolated:

1. Always clean up in `afterEach` hooks
2. Use transactions for atomic test operations
3. Consider using a separate test database for CI/CD

### Troubleshooting Tests

#### Test fails with "Cannot find module"
- Ensure imports use `.js` extensions
- Check tsconfig.json includes `tests/` directory
- Verify file paths are correct

#### Test fails with database connection error
- Ensure Prisma client is generated: `npm run prisma:generate`
- Check `.env` has correct `DATABASE_URL`
- Verify SQLite database file exists

#### Test times out
- Increase timeout in vitest.config.ts
- Check for infinite loops
- Verify database operations complete

#### Coverage is low
- Add more test cases for uncovered code
- Check if tests actually execute the code paths
- Review coverage report in `coverage/index.html`
