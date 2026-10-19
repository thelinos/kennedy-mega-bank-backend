# App Configuration

This directory contains the main application configuration classes.

## Files

### app.ts
Main application class that configures and initializes the Express server.

**Purpose:**
- Initializes Express app with database connections
- Registers all middleware (logging, error handling, CORS, cookie-parser)
- Registers all authentication routes
- Configures health check endpoint
- Manages application lifecycle through AppRegistry

**Key Features:**
- Uses AppRegistry singleton pattern
- Async initialization for dynamic imports (cookie-parser, cors)
- Centralized route registration
- Health check endpoint for monitoring

**How it Works:**
1. Gets AppRegistry singleton instance
2. Initializes app with database connections (if not already initialized)
3. Registers middleware in order (request logger, routes, error handler)
4. Registers all authentication routes under `/authentication`
5. Adds health check endpoint at `/health`
6. Returns configured Express app

### app-registry.ts
Singleton service for managing the Express application instance.

**Purpose:**
- Ensures only one Express instance exists
- Provides centralized route and middleware registration
- Manages application initialization state
- Allows route classes to register themselves without direct App instantiation

**Key Features:**
- Singleton pattern (single instance across application)
- Thread-safe initialization
- Dynamic middleware registration
- Database configuration storage
- Reset method for testing

**Methods:**
- `getInstance()` - Get the singleton instance
- `initialize(databases)` - Initialize Express app with databases
- `registerRoute(path, route)` - Register a route at a path
- `registerMiddleware(middleware)` - Register global middleware
- `registerErrorHandler(middleware)` - Register error handler (must be last)
- `getApp()` - Get the Express app instance
- `isInitialized()` - Check if app is initialized
- `getDatabases()` - Get database configuration
- `reset()` - Reset the registry (for testing)

## How to Add New Routes

1. Create your route class following the pattern in authentication routes
2. Import the route class in `app.ts`
3. Register the route in the `app()` method:
```typescript
import YourRoute from "../../features/your-feature/your-route/index.js";

// In the app() method:
registry.registerRoute("/your-path", new YourRoute().yourRoute);
```

## Middleware Order

Middleware is registered in this order (important!):
1. Express built-in middleware (json, urlencoded)
2. cookie-parser
3. cors
4. Custom middleware (requestLogger)
5. Routes
6. Error handler (must be last)

## Health Check Endpoint

The health check endpoint at `/health` returns:
```json
{
  "status": "ok",
  "environment": "development",
  "database": "SQLite (Prisma)"
}
```

This is useful for:
- Load balancer health checks
- Monitoring system status
- Debugging database connections
