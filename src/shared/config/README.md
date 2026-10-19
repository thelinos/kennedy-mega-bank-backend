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
  mongoUri: string;
  mongoDbName: string;
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
DATABASE_URL="file:./dev.db" | "mongodb://..."
```

### Optional Variables
```bash
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB_NAME="kennedy-mega-bank"
```

### SendGrid Variables
```bash
SENDGRID_API_KEY="your-api-key"
SENDGRID_FROM_EMAIL="noreply@kennedy-mega-bank.com"
SENDGRID_FROM_NAME="Kennedy Mega Bank"
```

### JWT Variables
```bash
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

### CORS Variables
```bash
CORS_ORIGIN="*" | "https://yourdomain.com"
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
2. **Use strong secrets** - JWT_SECRET should be cryptographically random
3. **Environment-specific configs** - Different keys for each environment
4. **Use environment variables** - Don't hardcode sensitive data
5. **Document required variables** - Update .env.example
