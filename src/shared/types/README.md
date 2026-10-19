# Types

This directory contains TypeScript type definitions and enumerations.

## Directory Structure

```
types/
├── enums/        # Enumerations
│   ├── env.enum.ts         # Environment enum
│   ├── status.enum.ts      # Status enum
│   └── README.md
└── model/        # Data models
    ├── json.model.ts   # JSON model
    └── README.md
```

## Purpose

The `types` directory contains:
- **Enumerations**: Type-safe constant values (environments, status codes)
- **Models**: Data model classes and interfaces

These are separated from utilities because they are type definitions rather than functional code.

## Files

### enums/env.enum.ts
Environment enumeration.

**Purpose:**
- Define available environments (development, staging, production)
- Provide type-safe environment references
- Enable compile-time checking of environment values

**Values:**
- `development` - Local development environment
- `staging` - Staging/testing environment
- `production` - Production environment

**Usage:**
```typescript
import Env from './enums/env.enum.js';

const currentEnv: Env = Env.development;
```

### enums/status.enum.ts
Operation status enumeration.

**Purpose:**
- Define operation status values
- Provide consistent status values across API responses
- Enable type-safe status checking

**Values:**
- `started` - Operation has started
- `progressing` - Operation is in progress
- `successful` - Operation completed successfully
- `failed` - Operation failed

**Usage:**
```typescript
import Status from './enums/status.enum.js';

res.json({
  message: "Success",
  status: Status.successful
});
```

### model/json.model.ts
Base model for JSON API responses.

**Purpose:**
- Provide a structured way to create consistent JSON responses
- Standardize API response format across the application
- Currently a placeholder for future use

**Structure:**
```typescript
class JsonModel {
  message: String;  // Human-readable message
  status: Status;   // Operation status (from status.enum.ts)
  body: any;        // Response data
}
```

**Usage:**
```typescript
import JsonModel from './model/json.model.js';
import Status from '../enums/status.enum.js';

const response = new JsonModel(
  "Success",
  Status.successful,
  { data: { id: 1, name: "Test" } }
);
```

## How to Import Types

### From shared code:
```typescript
import Status from '../types/enums/status.enum.js';
import JsonModel from '../types/model/json.model.js';
```

### From features:
```typescript
import Status from '../../../shared/types/enums/status.enum.js';
import JsonModel from '../../../shared/types/model/json.model.js';
```

## When to Use Types

### Enums
Use enums when:
- You have a fixed set of related values
- You want type safety
- You want to prevent typos
- You want to document allowed values

### Models
Use models when:
- You need structured data types
- You want consistent response formats
- You need type-safe data transfer
- You want to validate data shapes

## How to Add New Types

### Adding a New Enum
1. Create enum file in `types/enums/`
2. Follow the pattern:
```typescript
/**
 * YourEnum - Description
 *
 * Detailed documentation.
 */
const enum YourEnum {
  value1,
  value2,
  value3
}

export default YourEnum;
```
3. Add documentation to `types/enums/README.md`

### Adding a New Model
1. Create model file in `types/model/`
2. Follow the pattern:
```typescript
/**
 * YourModel - Description
 *
 * Detailed documentation.
 */
export class YourModel {
  constructor(public field1: Type1, public field2: Type2) {
    // Constructor logic
  }
}
```
3. Add documentation to `types/model/README.md`

## Type Guidelines

1. **Const Enum**: Use const enum for better performance
2. **Type Safety**: Use TypeScript interfaces for type definitions
3. **Documentation**: Add JSDoc comments for all types
4. **Consistency**: Follow existing naming conventions
5. **Reusability**: Make types reusable across the application

## Common Type Patterns

### String Enums
```typescript
const enum UserStatus {
  active = "active",
  inactive = "inactive",
  suspended = "suspended"
}
```

### Interfaces
```typescript
export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
}
```

### Type Aliases
```typescript
export type UserId = string;
export type Email = string;
```

## Import Helper

You can create an index.ts in the types folder to simplify imports:

```typescript
// src/shared/types/index.ts
export { default as Env } from './enums/env.enum.js';
export { default as Status } from './enums/status.enum.js';
export { JsonModel } from './model/json.model.js';
```

Then import from:
```typescript
import { Env, Status, JsonModel } from '../shared/types/index.js';
```
