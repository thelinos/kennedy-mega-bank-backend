# Collect Name Route

This route handles collecting the user's name details during initial onboarding after account creation.

## Purpose

Allows newly registered users to provide their name information as part of the onboarding process:
- First name (required)
- Middle name (optional)
- Surname/Last name (required)

This is different from the "update name" route because:
- This is for **initial data collection** (one-time operation)
- This is part of the **onboarding flow** for new users
- Users should not be able to submit this if they've already provided their name
- This data was intentionally omitted during account creation (as per the create_user route design)

## Folder Structure

```
collect_name/
├── index.ts
└── route/
    └── collect_name.route.ts
```

## Implementation Considerations

### 1. **HTTP Method**
- Use `POST` (not PATCH)
- This is creating new data, not updating existing data
- POST semantically represents "creating" a resource (the user's name information)

### 2. **Request Type**
```typescript
interface CollectNameRequestBody {
    firstName: string;    // Required
    middleName?: string;  // Optional
    surname: string;      // Required
}
```
- First name and surname are required
- Middle name is optional
- Different from update_name where all fields are optional

### 3. **Pre-submission Validation**
Check if user has already provided their name:
```typescript
const user = await this.prismaClient.user.findUnique({
    where: { id: req.user.userId }
});

if (user.firstName && user.surname) {
    res.status(400).json({
        message: "Name has already been provided",
        status: Status.failed
    });
    return;
}
```

This prevents users from submitting their name multiple times.

### 4. **Field Validation**
```typescript
// Validate required fields
if (!firstName || !surname) {
    res.status(400).json({
        message: "First name and surname are required",
        status: Status.failed
    });
    return;
}

// Validate string lengths
if (firstName.length < 2 || surname.length < 2) {
    res.status(400).json({
        message: "First name and surname must be at least 2 characters",
        status: Status.failed
    });
    return;
}

// Validate middle name if provided
if (middleName && middleName.length < 2) {
    res.status(400).json({
        message: "Middle name must be at least 2 characters if provided",
        status: Status.failed
    });
    return;
}
```

### 5. **Database Schema**
Check your Prisma schema to ensure these fields exist and are nullable:
```prisma
model User {
    firstName    String?  // Nullable initially, set during onboarding
    middleName   String?  // Optional, nullable
    surname      String?  // Nullable initially, set during onboarding
    // ... other fields
}
```

Important: These fields should be nullable initially so they can be set during onboarding.

### 6. **Security**
- Must use `authenticate` middleware
- Only the authenticated user can provide their own name
- Use `req.user.userId` from the middleware
- Ensure users can't submit names for other users

### 7. **Error Handling**
- 401: If not authenticated
- 400: If name already provided, validation fails, or missing required fields
- 500: For database errors
- Use `unknown` type for error (not `any`)

### 8. **Response Structure**
```typescript
{
    message: string;
    status: Status.successful;
    user: {
        id: string;
        email: string;
        firstName: string;
        middleName?: string;
        surname: string;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }
}
```

### 9. **Example Implementation Pattern**
```typescript
import express, { Router, Request, Response } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { authenticate } from "../../../../../shared/middleware/auth.middleware.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";

interface CollectNameRequestBody {
    firstName: string;
    middleName?: string;
    surname: string;
}

export default class CollectName {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private _collectNameRoute(): Router {
        return this.router.post("/collect-name", authenticate, async (req: Request<never, never, CollectNameRequestBody>, res: Response): Promise<void> => {
            try {
                if (!req.user) {
                    res.status(401).json({
                        message: "Authentication required",
                        status: Status.failed
                    });
                    return;
                }

                const { firstName, middleName, surname } = req.body;

                // Validate required fields
                if (!firstName || !surname) {
                    res.status(400).json({
                        message: "First name and surname are required",
                        status: Status.failed
                    });
                    return;
                }

                // Check if user already provided name
                const existingUser = await this.prismaClient.user.findUnique({
                    where: { id: req.user.userId }
                });

                if (existingUser?.firstName && existingUser?.surname) {
                    res.status(400).json({
                        message: "Name has already been provided",
                        status: Status.failed
                    });
                    return;
                }

                // Update user with name
                const user = await this.prismaClient.user.update({
                    where: { id: req.user.userId },
                    data: {
                        firstName,
                        middleName,
                        surname
                    }
                });

                const { password: _, ...userWithoutPassword } = user;

                res.status(200).json({
                    message: "Name collected successfully",
                    status: Status.successful,
                    user: userWithoutPassword
                });
            } catch (error: unknown) {
                console.error("Error collecting name:", error);
                res.status(500).json({
                    message: "Failed to collect name",
                    status: Status.failed
                });
            }
        });
    }

    public get collectNameRoute(): Router {
        return this._collectNameRoute();
    }
}
```

### 10. **Onboarding Flow Integration**
This route is typically part of an onboarding sequence:

**Typical Flow:**
1. User creates account (POST /authentication/create-user)
2. User is logged in automatically (receives JWT tokens)
3. User is prompted to provide name (POST /account-details/collect-name)
4. User is prompted to upload profile picture (POST /account-details/collect-profile-picture)
5. User completes onboarding and can access full app features

**Frontend Considerations:**
- Check if user has provided name before showing the form
- Store onboarding state (e.g., `nameProvided: false` in local storage or user context)
- Redirect users to collect name if they haven't done so
- Show progress indicator for onboarding steps

### 11. **Route Registration**
After implementing, register in `src/shared/app/app.ts`:
```typescript
import CollectName from "../../features/user/account_details/collect_name/index.ts";

// In the app() method:
registry.registerRoute("/account-details", new CollectName().collectNameRoute);
```

### 12. **Testing Considerations**
- Test with authenticated user who hasn't provided name (should succeed)
- Test with authenticated user who has already provided name (should return 400)
- Test with unauthenticated user (should return 401)
- Test with missing first name (should return 400)
- Test with missing surname (should return 400)
- Test with only middle name (should return 400)
- Test with valid data (should succeed)
- Test with invalid string lengths (should return 400)
- Test database error scenarios

### 13. **Alternative: Use Update Name Instead?**
You might wonder if you should just use the `update_name` route instead of creating a separate `collect_name` route.

**Pros of separate route:**
- Clear separation of concerns (onboarding vs profile management)
- Can enforce one-time submission
- Different validation rules (required vs optional fields)
- Better for tracking onboarding completion
- Can add onboarding-specific logic (e.g., analytics, welcome emails)

**Pros of using update_name:**
- Less code to maintain
- Simpler architecture
- One route for all name operations

**Recommendation:**
Keep them separate because:
1. The semantics are different (collecting vs updating)
2. Validation rules differ (required vs optional)
3. You may want to track onboarding completion
4. It's easier to add onboarding-specific features later (e.g., welcome email after name collection)

---

## Implementation Checklist

- [ ] Create `collect_name.route.ts` with proper imports
- [ ] Define `CollectNameRequestBody` interface (firstName required, surname required, middleName optional)
- [ ] Implement route with POST method
- [ ] Add authentication middleware
- [ ] Add validation (required fields, string lengths)
- [ ] Add check if name already provided (prevent duplicate submission)
- [ ] Implement Prisma update
- [ ] Add error handling with proper types
- [ ] Create `index.ts` export file
- [ ] Register route in `app.ts`
- [ ] Test with TypeScript compiler
- [ ] Test all scenarios (authenticated, unauthenticated, already provided, validation)

---

## Example Route Path

Full route path after registration:
- `POST /account-details/collect-name`

---

## Related Routes

- `POST /account-details/collect-name` - Collect name during onboarding (this route)
- `PATCH /account-details/update-name` - Update name later (profile management)
- `POST /account-details/collect-profile-picture` - Collect profile picture during onboarding (if implemented)
- `PATCH /account-details/update-profile-picture` - Update profile picture later (profile management)
