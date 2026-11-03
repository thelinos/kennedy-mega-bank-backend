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
- Generate new access token (15 minutes)
- Generate new refresh token (7 days)
- Persist the new token ID in the existing refresh-session family
- Revoke the old token atomically before issuing the replacement

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
2. **Check user exists?** Yes - prevents token use after account deletion
3. **Return user data?** Yes - allows frontend to refresh user state
4. **Old refresh token invalid?** Yes - persisted as revoked; replay revokes the family

## Security Considerations

- Token rotation prevents replay attacks
- Refresh sessions are persisted and family-scoped
- Reuse of a revoked token revokes all active tokens in that family
- Refresh tokens are longer-lived (7 days) but still secure
- User verification prevents token reuse after account deletion
- Cookies are httpOnly (prevents XSS)
- Access token expires in 15 minutes (limits exposure)
- Refresh token extends session without password re-entry

## How to Extend

To add features to this route:

1. **Session management**: Limit concurrent sessions and add device-level session controls
2. **Token cleanup**: Expired sessions are cleaned during rate-limit maintenance; use a dedicated job for high-volume deployments
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
- `accessToken` (new, httpOnly, secure, 15 minutes)
- `refreshToken` (new, httpOnly, secure, 7 days)
