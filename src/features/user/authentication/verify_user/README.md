# Verify User Route

## Purpose
Handles email verification with two endpoints: sending verification emails and verifying email tokens.

## Thought Process

### 1. **Identify Requirements**
From the API implementation plan, the verify-user route needed:
- Send verification email endpoint (resend)
- Verify email endpoint (token validation)
- Token generation and storage
- Email sending via SendGrid
- Token validation (existence, usage, expiration)
- Database transaction for atomicity

### 2. **Structure the Class**
Following the established pattern:
- Class-based approach for consistency
- Two private methods (one for each endpoint)
- Public getter returning combined router
- Private getters for router and prismaClient

### 3. **Send Verification Email Endpoint**

#### Input Validation
- Check email is provided
- Return 400 if missing

#### User Lookup
- Find user by email
- Return 404 if not found
- Return 400 if already verified

#### Token Generation
- Generate 64-character hex token
- Set 24-hour expiration
- Longer than password reset (less sensitive)

#### Token Storage
- Store in EmailToken table
- Link to user via userId
- Set used flag to false

#### Email Sending
- Construct verification URL with token
- Send via SendGridService
- No error catching (fail fast for this endpoint)

#### Response
- Return 200 with success message

### 4. **Verify Email Endpoint**

#### Token Extraction
- Extract token from query params
- Check it exists and is a string
- Return 400 if invalid

#### Token Lookup
- Find token in EmailToken table
- Include user relation
- Return 400 if not found

#### Token Validation
- Check if token already used (prevents replay)
- Check if token expired (24-hour limit)
- Return 400 if validation fails

#### Database Transaction
- Use Prisma $transaction for atomicity
- Update user.emailVerified to true
- Mark token as used
- **Why transaction?** Ensure both updates succeed or fail together

#### Response
- Return 200 with success message

### 5. **Combined Router**
- Create express Router
- Register both endpoints
- Return combined router

### 6. **Error Handling**
- Try-catch blocks for both endpoints
- Log errors server-side
- Return appropriate status codes

## Key Decisions

1. **Two endpoints?** Yes - separate send and verify concerns
2. **Database transaction?** Yes - ensures atomicity
3. **Mark token as used?** Yes - prevents replay attacks
4. **24-hour expiration?** Yes - longer than password reset (less sensitive)
5. **Fail on email error?** Yes - this is critical for user onboarding

## Security Considerations

- Tokens expire in 24 hours (limits exposure)
- Tokens marked as used after verification (prevents replay)
- Database transaction ensures atomicity (all-or-nothing)
- Generic error messages prevent information leakage
- Email verification prevents spam accounts
- Token stored in database (revocable)

## How to Extend

To add features to this route:

1. **Rate limiting**: Limit verification email sends per user
2. **Multiple verification emails**: Allow multiple concurrent tokens
3. **Email change verification**: When user changes email, require verification
4. **Verification reminder**: Send reminder emails if not verified within X days
5. **Email template personalization**: Customize email based on user data

## Example Usage

### Send Verification Email
```bash
curl -X POST http://localhost:3000/authentication/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

Response:
```json
{
  "message": "Verification email sent successfully",
  "status": "successful"
}
```

### Verify Email
```bash
curl -X GET "http://localhost:3000/authentication/verify-email?token=your-token"
```

Response:
```json
{
  "message": "Email verified successfully",
  "status": "successful"
}
```

What happens:
1. Token validated (exists, not used, not expired)
2. User emailVerified set to true
3. Token marked as used (prevents reuse)
4. Both updates in single transaction
