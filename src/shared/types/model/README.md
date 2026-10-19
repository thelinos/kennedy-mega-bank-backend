# Models

This directory contains model classes for structured data.

## Files

### json.model.ts
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
import JsonModel from './json.model.js';
import Status from '../enums/status.enum.ts';

const response = new JsonModel(
  "Success",
  Status.successful,
  { data: { id: 1, name: "Test" } }
);
```

**Current State:**
This is currently a placeholder. The application uses inline JSON responses
in route handlers instead of this model class. It can be enhanced in the future
to provide:
- Response validation
- Response serialization
- Consistent response formatting
- Type-safe response creation

## How to Use This Model

If you want to use this model for consistent responses:

1. Enhance the class with methods:
```typescript
export class JsonModel {
  constructor(private message: String, private status: Status, private body: any) { }

  toJSON(): object {
    return {
      message: this.message,
      status: this.status,
      ...this.body
    };
  }

  static success(message: string, body?: any): JsonModel {
    return new JsonModel(message, Status.successful, body);
  }

  static failed(message: string, body?: any): JsonModel {
    return new JsonModel(message, Status.failed, body);
  }
}
```

2. Use in routes:
```typescript
const response = JsonModel.success("User created", { user: newUser });
res.status(201).json(response.toJSON());
```

## Alternative Approaches

Currently, the application uses inline JSON responses:
```typescript
res.status(200).json({
  message: "Success",
  status: Status.successful,
  user: userData
});
```

This is simpler and more flexible. Use the JsonModel class if you need:
- Response validation
- Consistent formatting
- Type-safe response creation
- Response transformation

## Future Enhancements

Potential improvements to JsonModel:
- Add validation methods
- Add serialization methods
- Add transformation methods
- Add error handling
- Add logging hooks
