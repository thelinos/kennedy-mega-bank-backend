# Database Configuration

This directory contains database connection and configuration logic.

## Files

### config.ts
Database connection configuration and management.

**Purpose:**
- Define database configuration interface
- Provide connection functions for different environments
- Handle graceful disconnection

**Key Functions:**
- `connectPrismaOnly()` - Connect to Prisma only (development)
- `connectPrismaWithMongo()` - Connect to both Prisma and MongoDB (staging/production)
- `disconnectAllDatabases()` - Gracefully disconnect from all databases

**Environment-Specific Connections:**
- **Development**: Only Prisma (SQLite) - MongoDB not needed
- **Staging/Production**: Both Prisma (MongoDB) and MongoDB for avatars

### prisma.ts
Prisma client singleton and connection management.

**Purpose:**
- Provide singleton Prisma client instance
- Handle Prisma connection lifecycle
- Prevent connection pool exhaustion

**Key Functions:**
- `getPrismaClient()` - Get singleton Prisma client
- `disconnectPrisma()` - Disconnect Prisma client

**Usage:**
```typescript
import { getPrismaClient } from './prisma.js';

const prisma = getPrismaClient();
const users = await prisma.user.findMany();
```

### mongodb.ts
MongoDB client and database connection management.

**Purpose:**
- Provide singleton MongoDB client instance
- Manage MongoDB database connections
- Handle graceful disconnection

**Key Functions:**
- `getMongoClient(uri)` - Get singleton MongoDB client
- `getMongoDb(uri, dbName)` - Get MongoDB database instance
- `disconnectMongo()` - Disconnect MongoDB client

**Usage:**
```typescript
import { getMongoDb } from './mongodb.js';

const db = await getMongoDb('mongodb://localhost:27017', 'kennedy-mega-bank');
const collection = db.collection('avatars');
```

## Database Architecture

### Prisma (Structured Data)
Used for:
- User management (authentication, profiles)
- Account management (bank accounts)
- Transaction records
- Email verification tokens
- Password reset tokens

**Schema:** Defined in `prisma/schema.prisma`

### MongoDB (Unstructured Data)
Used for:
- User avatars (binary image data)
- Large files
- Data that doesn't fit relational schema

**Collections:**
- `avatars` - User profile pictures

## Connection Strategy

### Singleton Pattern
Both Prisma and MongoDB use the singleton pattern to:
- Prevent connection pool exhaustion
- Improve performance (reuse connections)
- Simplify connection management
- Ensure consistent state across application

### Environment-Specific
- **Development**: Lightweight (SQLite only)
- **Staging/Production**: Full-featured (MongoDB + MongoDB for avatars)

## Graceful Shutdown

The `disconnectAllDatabases()` function ensures:
- All connections are closed before process exit
- Errors during disconnect are caught and logged
- Application can shut down cleanly
- No connection leaks

## How to Add Database Collections

### For Prisma:
1. Add model to `prisma/schema.prisma`
2. Run `npm run prisma:migrate:dev`
3. Use in code via `prisma.yourModel`

### For MongoDB:
1. Use `db.collection('yourCollection')` directly
2. No schema required (flexible schema)
3. Index as needed for performance

## Connection Strings

Environment variables (from `.env` files):
```bash
# Prisma
DATABASE_URL="file:./dev.db"  # Development (SQLite)
DATABASE_URL="mongodb://..."   # Staging/Production

# MongoDB
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB_NAME="kennedy-mega-bank"
```
