# Reset Password Route

## Purpose
Completes the password reset flow by validating the token and updating the user's password.

## Thought Process

### 1. **Identify Requirements**
From the API implementation plan, the reset-password route needed:
- Token validation
- Password strength validation
- Token existence check
- Token usage check
- Token expiration check
- Password hashing
- Database transaction (atomicity)
- Clear authentication cookies

### 2. **Structure the Class**
Following the established pattern:
- Class-based approach for consistency
- Private method for route logic
- Public getter for the route
- Private getters for router and prismaClient

### 3. **Input Validation**
- Check token exists in request body
- Validate new password meets strength requirements
- Return 400 if validation fails

### 4. **Token Lookup**
- Look up token in PasswordResetToken table
- Include user relation
- If not found, return 400 with generic message

### 5. **Token Validation**
- Check if token already used (prevents replay attacks)
- Check if token expired (1-hour limit)
- Return 400 if validation fails

### 6. **Password Hashing**
- Hash new password with bcrypt
- Same salt rounds as registration (10)

### 7. **Database Transaction**
- Use Prisma $transaction for atomicity
- Update user password
- Mark token as used
- **Why transaction?** Ensure both updates succeed or fail together
- Prevents partial updates (password changed but token not marked)

### 8. **Cookie Clearing**
- Clear accessToken cookie
- Clear refreshToken cookie
- **Why clear?** Forces user to re-login with new password
- Invalidates old sessions (security)

### 9. **Response**
- Return 200 with success message
- Instruct user to login with new password

### 10. **Error Handling**
- Catch-all try-catch block
- Log errors server-side
- Return 500 on unexpected errors

## Key Decisions

1. **Database transaction?** Yes - ensures atomicity
2. **Mark token as used?** Yes - prevents replay attacks
3. **Clear cookies?** Yes - forces re-login
4. **Re-login required?** Yes - security best practice

## Security Considerations

- Database transaction ensures atomicity (all-or-nothing)
- Token marked as used immediately (prevents replay attacks)
- Cookies cleared to force re-login (invalidates old sessions)
- Password strength validation applies to reset as well
- Token expiration limits exposure (1 hour)
- All operations in single transaction (prevents partial updates)

## How to Extend

To add features to this route:

1. **Password history**: Check new password against last N passwords
2. **Session invalidation**: Invalidate all user sessions on password change
3. **Email notification**: Send email confirming password change
4. **Audit logging**: Log password reset events for security monitoring
5. **IP verification**: Verify request IP matches forgot-password request IP

## Example Usage

```bash
curl -X POST http://localhost:3000/authentication/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-reset-token",
    "newPassword": "NewSecurePass123!"
  }'
```

Response:
```json
{
  "message": "Password reset successfully. Please login with your new password.",
  "status": "successful"
}
```

What happens:
1. Token validated (exists, not used, not expired)
2. Password hashed with bcrypt
3. User password updated in database
4. Token marked as used (prevents reuse)
5. Authentication cookies cleared
6. User must login again with new password
