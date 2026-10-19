# Enums

This directory contains TypeScript enumerations for type-safe constants.

## Files

### env.enum.ts
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
import Env from './env.enum.js';

const currentEnv: Env = Env.development;
```

### status.enum.ts
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
import Status from './status.enum.js';

res.json({
  message: "Success",
  status: Status.successful
});
```

## Const Enum vs Regular Enum

Both enums use `const enum` for better performance:
- Inlined at compile time (no runtime overhead)
- Better tree-shaking
- Smaller bundle size
- Faster execution

## How to Add New Enums

Follow this pattern:

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

## When to Use Enums

Use enums when:
- You have a fixed set of related values
- You want type safety
- You want to prevent typos
- You want to document allowed values

## When NOT to Use Enums

Don't use enums when:
- Values are dynamic or user-provided
- You need to iterate over values
- You need to add values at runtime
- You need to map values to different representations

## Common Enum Patterns

### String Enums
```typescript
const enum UserStatus {
  active = "active",
  inactive = "inactive",
  suspended = "suspended"
}
```

### Numeric Enums
```typescript
const enum HttpStatusCode {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401
}
```

### Mixed Enums
```typescript
const enum AccountType {
  checking = "checking",
  savings = "savings",
  investment = "investment"
}
```
