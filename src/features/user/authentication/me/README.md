# Me Route (Get Current User)

## Purpose
Retrieves the currently authenticated user's profile data including their accounts.

## Thought Process

### 1. **Identify Requirements**
From the API implementation plan, the me route needed:
- JWT authentication required
- Extract user from JWT token
- Fetch user from database
- Include related accounts
- Return user data without password

### 2. **Structure the Class**
Following the established pattern:
- Class-based approach for consistency
- Private method for route logic
- Public getter for the route
- Private getters for router and prismaClient

### 3. **Authentication Middleware**
- Use authenticate middleware
- Middleware validates JWT token from cookie
- Injects user data into req.user
- If token invalid, middleware returns 401

### 4. **User Check**
- Check if req.user exists (should always exist if middleware passed)
- Return 401 if missing (defensive programming)

### 5. **User Lookup**
- Fetch user by ID from req.user.userId
- Include accounts relation (user's bank accounts)
- Return 404 if user not found (shouldn't happen with valid token)

### 6. **Response Construction**
- Remove password from response using destructuring
- Return 200 status (success)
- Include user data with accounts

### 7. **Error Handling**
- Try-catch block for consistency
- Log errors server-side
- Return 500 on unexpected errors

## Key Decisions

1. **Authentication middleware?** Yes - protects route
2. **Include accounts?** Yes - useful for frontend
3. **Return password?** No - security risk
4. **Defensive user check?** Yes - ensures req.user exists

## Security Considerations

- Protected by authenticate middleware
- Password excluded from response
- User context injected by middleware
- JWT token validated before route execution
- Only returns data for authenticated user

## How to Extend

To add features to this route:

1. **Include more relations**: Add transactions, recent activity
2. **User preferences**: Add user settings/preferences
3. **Profile completeness**: Add field indicating profile completion percentage
4. **Last login tracking**: Update last login timestamp on each request
5. **Session info**: Include current session information

## Example Usage

```bash
curl -X GET http://localhost:3000/authentication/me \
  -H "Content-Type: application/json" \
  --cookie "accessToken=your-access-token"
```

Response:
```json
{
  "message": "User retrieved successfully",
  "status": "successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "createdAt": "2026-10-06T...",
    "updatedAt": "2026-10-06T...",
    "accounts": [
      {
        "id": "account-uuid",
        "accountType": "checking",
        "balance": 1000.00,
        "createdAt": "2026-10-06T...",
        "updatedAt": "2026-10-06T..."
      }
    ]
  }
}
```

Authentication flow:
1. Middleware extracts JWT from cookie
2. Middleware validates JWT signature and expiration
3. Middleware decodes user ID and email from JWT
4. Middleware injects req.user = { userId, email }
5. Route uses req.user.userId to fetch user
6. Route returns user data with accounts
