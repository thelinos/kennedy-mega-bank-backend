# Configuration

This directory contains environment configuration and loading logic.

## Files

### index.ts
Environment variable loading and configuration extraction.

**Purpose:**
- Load environment variables from .env files
- Provide typed configuration object
- Handle environment-specific configuration

**Key Functions:**
- `loadEnv(env)` - Load environment variables for specific environment
- `getEnvConfig()` - Get typed configuration object

**Environment Files:**
- `.env.development` - Development environment variables
- `.env.staging` - Staging environment variables
- `.env.production` - Production environment variables
- `.env` - Fallback configuration

**Loading Strategy:**
1. Try to load from environment-specific file (.env.development, etc.)
2. If DATABASE_URL not found, fall back to .env
3. This allows per-environment overrides while providing defaults

**Configuration Object:**
```typescript
{
  nodeEnv: string;
  port: number;
  databaseUrl: string;
}
```

**Usage:**
```typescript
import { loadEnv, getEnvConfig } from './index.js';

loadEnv('development');
const config = getEnvConfig();
console.log(config.port); // 3000
```

## Environment Variables

### Required Variables
```bash
NODE_ENV="development" | "staging" | "production"
PORT=3000
DATABASE_URL="file:./dev.db" | "postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
```

### SendGrid Variables
```bash
SENDGRID_API_KEY="your-api-key"
SENDGRID_FROM_EMAIL="noreply@kennedy-mega-bank.com"
SENDGRID_FROM_NAME="Kennedy Mega Bank"
```

### JWT Variables
```bash
# Generate a random secret with: openssl rand -base64 48
JWT_SECRET=""
# Optional separate keys; each must be at least 32 bytes.
JWT_ACCESS_SECRET=""
JWT_REFRESH_SECRET=""
```

### CORS Variables
```bash
CORS_ORIGINS="https://app.example.com,https://admin.example.com"
```

### Base URL
```bash
BASE_URL="http://localhost:3000" | "https://api.yourdomain.com"
```

## How to Add New Configuration Variables

1. Add to .env.example file
2. Add to getEnvConfig() return object
3. Use in code via process.env or config object

## Security Best Practices

1. **Never commit .env files** - Add to .gitignore
2. **Use strong secrets** - configure a cryptographically random JWT secret of at least 32 bytes
3. **Environment-specific configs** - Different keys for each environment
4. **Use environment variables** - Don't hardcode sensitive data
5. **Document required variables** - Update .env.example

Cookie-authenticated state-changing requests must include an `Origin` matching
one of the configured CORS origins. Wildcard origins are rejected when cookies
and credentials are enabled.

The test suite always uses the ignored `tests/test.db` SQLite database and
applies migrations before test workers start. It never uses `prisma/dev.db`.
