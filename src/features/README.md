# Features

This directory contains feature-specific code organized by domain.

## Directory Structure

```
features/
└── user/
    └── authentication/
        ├── create_user/      # User registration
        ├── login/            # User login
        ├── logout/           # User logout
        ├── refresh/          # Token refresh
        ├── forgot-password/  # Password reset initiation
        ├── reset-password/   # Password reset completion
        ├── verify_user/      # Email verification
        ├── me/               # Get current user
        └── README.md         # Authentication documentation
```

## Purpose

The `features` directory organizes code by business domain or feature. Each feature contains:
- Route handlers (in `route/` subdirectories)
- Feature-specific logic
- Feature-specific services
- Feature-specific utilities

## Feature Organization

### Authentication Feature
Located in `features/user/authentication/`, this feature contains all authentication-related routes:
- User registration
- User login/logout
- Token management
- Email verification
- Password reset

### Future Features
As the application grows, new features will be added:
- `features/account/` - Account management
- `features/transaction/` - Transaction management
- `features/transfer/` - Money transfers
- `features/user/avatar/` - User avatar management
- `features/user/profile/` - User profile management

## Feature Structure Pattern

Each feature follows this structure:

```
feature-name/
├── route/                    # Route handlers
│   └── feature-name.route.ts
├── service/                  # Feature-specific services (optional)
│   └── feature-name.service.ts
├── util/                     # Feature-specific utilities (optional)
│   └── feature-name.util.ts
├── index.ts                  # Feature entry point
└── README.md                 # Feature documentation
```

## How to Create a New Feature

1. **Create feature directory:**
```bash
mkdir -p src/features/your-feature/route
```

2. **Create route handler:**
```typescript
// src/features/your-feature/route/your-feature.route.ts
import express, { Router, Request, Response } from "express";

export default class YourFeature {
  constructor() { }

  private get router() {
    return express.Router();
  }

  private _yourFeatureRoute(): Router {
    return this.router.METHOD("/path", async (req: Request, res: Response): Promise<void> => {
      // Your logic here
      res.status(200).json({ message: "Success" });
    });
  }

  public get yourFeatureRoute(): Router {
    return this._yourFeatureRoute();
  }
}
```

3. **Create index.ts:**
```typescript
// src/features/your-feature/index.ts
import YourFeature from "./route/your-feature.route.js";

export default YourFeature;
```

4. **Create README.md:**
Document the feature's purpose, routes, and usage.

5. **Register in app.ts:**
```typescript
import YourFeature from "../../features/your-feature/index.js";

// In the app() method:
registry.registerRoute("/your-feature", new YourFeature().yourFeatureRoute);
```

## Feature Guidelines

### 1. Single Responsibility
Each feature should handle one business domain:
- Authentication: User auth only
- Accounts: Account management only
- Transactions: Transaction management only

### 2. Consistent Patterns
Follow the established patterns:
- Class-based route handlers
- Private methods for internal logic
- Public getters for routes
- Shared utilities from `shared/`

### 3. Documentation
Each feature should have:
- README.md explaining purpose and usage
- JSDoc comments on classes and methods
- Example usage in README

### 4. Testing
Each feature should have:
- Unit tests for utilities
- Integration tests for routes
- E2E tests for complete flows

## Importing from Features

From shared code:
```typescript
import YourFeature from "../../features/your-feature/index.js";
```

From other features:
```typescript
import YourFeature from "../../../features/your-feature/index.js";
```

## Feature Dependencies

Features can depend on:
- Shared utilities (from `shared/utils/`)
- Shared services (from `shared/services/`)
- Shared middleware (from `shared/middleware/`)
- Database clients (from `shared/database/`)

Features should NOT depend on:
- Other features (circular dependencies)
- Environment-specific code
- Feature-specific code from other features

## Feature Communication

Features communicate through:
- Database (shared data storage)
- API (HTTP requests between services)
- Events (future - event bus pattern)
- Shared utilities (common operations)

## Feature Examples

### Account Feature (Future)
```
features/account/
├── create-account/
├── get-accounts/
├── get-account/
├── update-account/
└── delete-account/
```

### Transaction Feature (Future)
```
features/transaction/
├── create-transaction/
├── get-transactions/
├── get-transaction/
└── transfer/
```

### User Profile Feature (Future)
```
features/user/
├── profile/
│   ├── update-profile/
│   └── get-profile/
└── avatar/
    ├── upload-avatar/
    ├── get-avatar/
    └── delete-avatar/
```
