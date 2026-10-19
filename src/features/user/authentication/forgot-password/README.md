# Forgot Password Route

## Purpose
Initiates the password reset flow by sending a reset link to the user's email.

## Thought Process

### 1. **Identify Requirements**
From the API implementation plan, the forgot-password route needed:
- Email validation
- Generate password reset token
- Store token in database
- Send reset email via SendGrid
- Generic response (security)

### 2. **Structure the Class**
Following the established pattern:
- Class-based approach for consistency
- Private method for route logic
- Public getter for the route
- Private getters for router and prismaClient

### 3. **Email Validation**
- Validate email format
- Return 400 if invalid

### 4. **User Lookup**
- Look up user by email
- **Critical**: If user not found, return 404 with generic success message
- **Why generic?** Prevents email enumeration attacks

### 5. **Token Generation**
- Generate 64-character hex token
- Set 1-hour expiration (shorter than email verification)
- Shorter because password reset is more sensitive

### 6. **Token Storage**
- Store in PasswordResetToken table
- Link to user via userId
- Set used flag to false (initial state)

### 7. **Email Sending**
- Construct reset URL with token
- Send via SendGridService.sendPasswordResetEmail
- Catch email errors but don't fail request
- **Why catch errors?** Prevents information leakage about email existence

### 8. **Response**
- Return 200 with generic success message
- Same message whether user exists or not
- **Security**: Attacker can't determine if email is registered

### 9. **Error Handling**
- Catch-all try-catch block
- Log errors server-side
- Return 500 on unexpected errors

## Key Decisions

1. **Generic response?** Yes - prevents email enumeration
2. **Token expiration?** 1 hour - shorter than email verification (more sensitive)
3. **Fail on email error?** No - prevents information leakage
4. **Reveal user existence?** No - security measure

## Security Considerations

- Generic response prevents email enumeration attacks
- Token expires in 1 hour (limits exposure)
- Email logged server-side but not exposed to client
- If email sending fails, request still succeeds (graceful degradation)
- Attacker can't determine if email is registered

## How to Extend

To add features to this route:

1. **Rate limiting**: Limit requests per email to prevent abuse
2. **Account lockout**: Lock account after N failed reset attempts
3. **Multiple reset tokens**: Allow multiple concurrent reset tokens
4. **Security questions**: Add additional verification step
5. **SMS verification**: Add SMS as alternative email verification

## Example Usage

```bash
curl -X POST http://localhost:3000/authentication/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

Response (whether email exists or not):
```json
{
  "message": "If an account exists with this email, a password reset link has been sent",
  "status": "successful"
}
```

Email sent (if user exists):
- Subject: "Reset your password"
- Contains reset link: `http://localhost:3000/authentication/reset-password?token=xxx`
- Link expires in 1 hour
