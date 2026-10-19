# Account Details Routes

This folder contains routes for managing user account details, including name information and profile pictures.

## Overview

There are two types of routes in this folder:

1. **Collect Routes** - For initial data collection during onboarding (one-time operation)
   - `collect_name` - Collect user's name after account creation
   - `collect_profile_picture` - Collect user's profile picture after account creation

2. **Update Routes** - For modifying existing data (profile management)
   - `update_name` - Update user's name details
   - `update_profile_picture` - Update user's profile picture

## Key Differences

| Aspect | Collect Routes | Update Routes |
|--------|---------------|---------------|
| Purpose | Initial onboarding | Profile management |
| HTTP Method | POST (create) | PATCH (partial update) |
| Required Fields | Some required | All optional |
| Frequency | One-time | Multiple times |
| Validation | Check if already provided | Allow updates anytime |
| Use Case | New user onboarding | User editing profile |

## Folder Structure

```
account_details/
├── collect_name/
│   ├── README.md
│   ├── index.ts
│   └── route/
│       └── collect_name.route.ts
├── collect_profile_picture/
│   ├── README.md
│   ├── index.ts
│   └── route/
│       └── collect_profile_picture.route.ts
├── update_name/
│   ├── README.md
│   ├── index.ts
│   └── route/
│       └── update_name.route.ts
└── update_profile_picture/
    ├── README.md
    ├── index.ts
    └── route/
        └── update_profile_picture.route.ts
```

## Route Paths

After registration in `app.ts`, the full route paths will be:

**Collect Routes (Onboarding):**
- `POST /account-details/collect-name`
- `POST /account-details/collect-profile-picture`

**Update Routes (Profile Management):**
- `PATCH /account-details/update-name`
- `PATCH /account-details/update-profile-picture`

## Individual Route Documentation

Each route has its own comprehensive README with detailed implementation guidance:

- **[collect_name/README.md](./collect_name/README.md)** - Guide for collecting user's name during onboarding
- **[collect_profile_picture/README.md](./collect_profile_picture/README.md)** - Guide for collecting user's profile picture during onboarding
- **[update_name/README.md](./update_name/README.md)** - Guide for updating user's name details
- **[update_profile_picture/README.md](./update_profile_picture/README.md)** - Guide for updating user's profile picture

## Common Implementation Guidelines

All routes in this folder should follow these patterns:

### 1. **Type Safety**
- Use `.ts` imports (not `.js`)
- Define proper interfaces for request bodies
- Use `Request<never, never, YourInterface>` type
- Use `unknown` for error types (not `any`)
- Run `npx tsc --noEmit` to verify

### 2. **Index File Pattern**
Each route folder should have an `index.ts`:
```typescript
import YourRoute from "./route/your_route.route.ts";

export default YourRoute;
```

### 3. **Route Registration**
After implementing, register in `src/shared/app/app.ts`:
```typescript
import CollectName from "../../features/user/account_details/collect_name/index.ts";
import CollectProfilePicture from "../../features/user/account_details/collect_profile_picture/index.ts";
import UpdateName from "../../features/user/account_details/update_name/index.ts";
import UpdateProfilePicture from "../../features/user/account_details/update_profile_picture/index.ts";

// In the app() method:
registry.registerRoute("/account-details", new CollectName().collectNameRoute);
registry.registerRoute("/account-details", new CollectProfilePicture().collectProfilePictureRoute);
registry.registerRoute("/account-details", new UpdateName().updateNameRoute);
registry.registerRoute("/account-details", new UpdateProfilePicture().updateProfilePictureRoute);
```

### 4. **Database Consistency**
- Always exclude password from responses
- Return updated user data after successful operation
- Use transactions if updating multiple related entities

### 5. **Authentication**
- All routes must use `authenticate` middleware
- Use `req.user.userId` to identify the authenticated user
- Users can only modify their own data

### 6. **Error Handling**
- 401: If not authenticated
- 400: For validation errors or invalid requests
- 500: For database or storage errors
- Use `unknown` type for errors

### 7. **Documentation**
- Add JSDoc comments to each route class
- Document the route, method, body, and response
- Include security considerations in comments

## Onboarding Flow

The typical onboarding flow for a new user:

1. **Account Creation** (POST /authentication/create-user)
   - User provides email and password
   - User is automatically logged in
   - Name and profile picture are NOT collected yet

2. **Collect Name** (POST /account-details/collect-name)
   - User provides first name, middle name (optional), and surname
   - Check if name already provided (prevent duplicate submission)
   - Update user record with name information

3. **Collect Profile Picture** (POST /account-details/collect-profile-picture)
   - User uploads or provides profile picture
   - Check if profile picture already provided (prevent duplicate submission)
   - Store in MongoDB GridFS or cloud storage
   - Update user record with file reference

4. **Onboarding Complete**
   - User can now access full app features
   - Name and profile picture are displayed in UI

## Profile Management Flow

After onboarding, users can update their information:

1. **Update Name** (PATCH /account-details/update-name)
   - User can update any combination of name fields
   - All fields are optional
   - Can be called multiple times

2. **Update Profile Picture** (PATCH /account-details/update-profile-picture)
   - User can replace their profile picture
   - Old picture should be cleaned up (if stored in MongoDB/cloud storage)
   - Can be called multiple times

## Implementation Order

Recommended implementation order:

1. **Phase 1: Collect Routes (Onboarding)**
   - Implement `collect_name` (simpler, no file handling)
   - Implement `collect_profile_picture` (start with string/URL approach, add file upload later)

2. **Phase 2: Update Routes (Profile Management)**
   - Implement `update_name` (similar to collect_name but with PATCH and optional fields)
   - Implement `update_profile_picture` (similar to collect_profile_picture but with PATCH)

## Testing Checklist

For each route, test:
- [ ] Authenticated user (should succeed)
- [ ] Unauthenticated user (should return 401)
- [ ] Invalid data (should return 400)
- [ ] Missing required fields (should return 400)
- [ ] Database errors (should return 500)
- [ ] Duplicate submission (for collect routes, should return 400)
- [ ] TypeScript compilation (`npx tsc --noEmit`)
