# Login Route

## Purpose
Authenticates users with email and password, returning JWT tokens for session management.

## Thought Process

### 1. **Identify Requirements**
From the API implementation plan, the login route needed:
- Email and password validation
- User lookup by email
- Password verification
- JWT token generation
- Cookie setting
- Generic error messages (security)

### 2. **Structure the Class**
Following the established pattern:
- Class-based approach for consistency
- Private method for route logic
- Public getter for the route
- Private getters for router and prismaClient

### 3. **Input Validation**
**Why validate?** Fail fast and provide clear error messages.
- Email format validation
- Password presence check (no strength check on login - user already has account)
- Returns 400 with specific errors

### 4. **User Lookup**
- Use Prisma to find user by email
- If not found, return 401 with generic message
- **Important**: Same error message as wrong password (prevents email enumeration)

### 5. **Password Verification**
- Use bcrypt.compare to verify password
- If mismatch, return 401 with generic message
- **Security**: Don't reveal whether email exists or password is wrong

### 6. **JWT Token Generation**
- Generate access token (15 minutes) and refresh token (7 days)
- Use user ID and email as payload
- Tokens are cryptographically signed with JWT_SECRET

### 7. **Cookie Setting**
- Set accessToken cookie (15 minute expiration)
- Set refreshToken cookie (7 days expiration)
- Options: httpOnly, secure (production), sameSite=strict
- **Why cookies?** More secure than localStorage (httpOnly prevents XSS)

### 8. **Response Construction**
- Remove password from response using destructuring
- Return 200 status (success)
- Include user data (without password)

### 9. **Error Handling**
- Catch-all try-catch block
- Log errors server-side
- Return generic error message to client

## Key Decisions

1. **Generic error messages?** Yes - prevents email enumeration attacks
2. **Password strength check?** No - not needed on login (user already registered)
3. **Cookie vs header?** Cookie - more secure (httpOnly)
4. **Return user data?** Yes - helpful for frontend state management
5. **Separate tokens?** Yes - access (short-lived) + refresh (long-lived)

## Security Considerations

- Generic error messages prevent email enumeration
- Password comparison uses bcrypt (constant-time comparison)
- Cookies are httpOnly (prevents XSS)
- Cookies are secure in production (HTTPS only)
- Cookies have sameSite=strict (prevents CSRF)
- Access token expires in 15 minutes (limits exposure)
- Refresh token allows session extension without re-login
- Password never returned in response

## How to Extend

To add features to this route:

1. **Two-factor authentication**: Add TOTP verification step after password check
2. **Account lockout**: Track failed attempts and lock after N tries
3. **IP-based rate limiting**: Shared database-backed limits are enabled
4. **Device fingerprinting**: Store device info and warn on new device
5. **Remember me**: Extend refresh token expiration based on user preference

## Example Usage

```bash
curl -X POST http://localhost:3000/authentication/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "message": "Login successful",
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

Cookies set:
- `accessToken` (httpOnly, secure, 15 minutes)
- `refreshToken` (httpOnly, secure, 7 days)
