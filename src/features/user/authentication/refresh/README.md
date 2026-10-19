# Refresh Token Route

## Purpose
Refreshes JWT tokens using a refresh token to extend user sessions without requiring re-login.

## Thought Process

### 1. **Identify Requirements**
From the API implementation plan, the refresh route needed:
- Extract refresh token from cookie
- Validate refresh token
- Verify user still exists
- Generate new token pair
- Set new cookies
- Return user data

### 2. **Structure the Class**
Following the established pattern:
- Class-based approach for consistency
- Private method for route logic
- Public getter for the route
- Private getters for router and prismaClient

### 3. **Token Extraction**
- Extract refreshToken from HTTP-only cookie
- If missing, return 401 (unauthorized)

### 4. **Token Validation**
- Use JWTUtil.verifyToken to validate and decode
- If invalid/expired, catch error and return 401

### 5. **User Verification**
- Look up user by ID from token payload
- If user not found (deleted account), return 401
- **Why check user exists?** Token might be valid but user deleted

### 6. **New Token Generation**
- Generate new access token (1 hour)
- Generate new refresh token (7 days)
- **Why new refresh token?** Token rotation - old token becomes invalid

### 7. **Cookie Setting**
- Set new accessToken cookie
- Set new refreshToken cookie
- Same security options as login

### 8. **Response**
- Return 200 status (success)
- Include user data (without password)
- Useful for frontend to update user state

### 9. **Error Handling**
- Catch-all try-catch block
- Return 401 for invalid tokens
- Log errors server-side

## Key Decisions

1. **Token rotation?** Yes - new refresh token issued on each refresh
2. **Check user exists?** Yes - prevents token reuse after account deletion
3. **Return user data?** Yes - allows frontend to refresh user state
4. **Old refresh token invalid?** Yes - not stored, but new one issued

## Security Considerations

- Token rotation prevents replay attacks
- Refresh tokens are longer-lived (7 days) but still secure
- User verification prevents token reuse after account deletion
- Cookies are httpOnly (prevents XSS)
- Access token expires in 1 hour (limits exposure)
- Refresh token extends session without password re-entry

## How to Extend

To add features to this route:

1. **Token blacklist**: Check if refresh token is blacklisted
2. **Session management**: Track active sessions and limit concurrent sessions
3. **Device fingerprinting**: Verify refresh token matches device
4. **Suspicious activity detection**: Log refresh patterns and detect anomalies

## Example Usage

```bash
curl -X POST http://localhost:3000/authentication/refresh \
  -H "Content-Type: application/json" \
  --cookie "refreshToken=your-refresh-token"
```

Response:
```json
{
  "message": "Token refreshed successfully",
  "status": "successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "createdAt": "2026-10-06T..."
  }
}
```

New cookies set:
- `accessToken` (new, httpOnly, secure, 1 hour)
- `refreshToken` (new, httpOnly, secure, 7 days)
