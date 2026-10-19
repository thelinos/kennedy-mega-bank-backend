# Environments

This directory contains environment-specific entry points for the application.

## Files

### development/index.ts
Development environment entry point.

**Purpose:**
- Load development environment variables
- Connect to Prisma (SQLite) database
- Start development server
- Handle graceful shutdown

**Database:**
- Prisma only (SQLite)
- No MongoDB (not needed in development)
- File-based database for easy local development

**Features:**
- Hot reloading via tsx watch
- Console logging
- Graceful shutdown on SIGINT

**Usage:**
```bash
npm run dev
```

### staging/index.ts
Staging environment entry point.

**Purpose:**
- Load staging environment variables
- Connect to Prisma (MongoDB) and MongoDB
- Start staging server
- Handle graceful shutdown

**Database:**
- Prisma (MongoDB) for structured data
- MongoDB for avatars
- Full database setup like production

**Features:**
- Hot reloading via tsx watch
- Console logging
- Graceful shutdown on SIGINT

**Usage:**
```bash
npm run staging
```

### production/index.ts
Production environment entry point.

**Purpose:**
- Load production environment variables
- Connect to Prisma (MongoDB) and MongoDB
- Start production server
- Handle graceful shutdown

**Database:**
- Prisma (MongoDB) for structured data
- MongoDB for avatars
- Full database setup

**Features:**
- Hot reloading via tsx watch
- Console logging
- Graceful shutdown on SIGINT

**Usage:**
```bash
npm run prod
```

## Entry Point Pattern

All environment files follow the same pattern:

```typescript
import { App } from '../../shared/app/app.js';
import { loadEnv, getEnvConfig } from '../../shared/config/index.js';
import { connectPrismaOnly, disconnectAllDatabases } from '../../shared/database/config.js';

loadEnv('environment-name');

const config = getEnvConfig();

const startServer = async () => {
  try {
    const databases = await connectPrismaOnly(); // or connectPrismaWithMongo()
    const appInstance = new App(databases);
    const app = await appInstance.app();

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await disconnectAllDatabases(databases);
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

## Graceful Shutdown

All environments implement graceful shutdown:

1. Listen for SIGINT (Ctrl+C)
2. Disconnect from all databases
3. Exit with code 0 (success)

This ensures:
- No connection leaks
- Clean database disconnection
- Proper resource cleanup

## Database Connection Strategy

### Development
- **Function**: `connectPrismaOnly()`
- **Reason**: MongoDB not needed for development
- **Database**: SQLite (file-based, easy to reset)

### Staging
- **Function**: `connectPrismaWithMongo(mongoUri, mongoDbName)`
- **Reason**: Test full database setup
- **Database**: Prisma (MongoDB) + MongoDB

### Production
- **Function**: `connectPrismaWithMongo(mongoUri, mongoDbName)`
- **Reason**: Full database setup for production
- **Database**: Prisma (MongoDB) + MongoDB

## How to Add New Environments

1. Create new directory (e.g., `test/`)
2. Create `index.ts` following the pattern
3. Add npm script to package.json:
```json
{
  "scripts": {
    "test": "npx tsx watch src/environments/test/index.ts"
  }
}
```
4. Create `.env.test` file
5. Load environment with `loadEnv('test')`

## Environment-Specific Considerations

### Development
- Use SQLite for easy reset
- Enable debug logging
- Use loose CORS rules
- SendGrid sandbox mode

### Staging
- Use production-like databases
- Enable detailed logging
- Test SendGrid emails
- Validate environment variables

### Production
- Use production databases
- Minimize logging (use log service)
- Strict CORS rules
- Use real SendGrid API
- Optimize for performance
