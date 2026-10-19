# Create User Route

## Purpose
Handles user registration with email verification, password hashing, and JWT token generation.

## Thought Process

### 1. **Identify Requirements**
From the API implementation plan, the create-user route needed:
- User registration (email, password, name)
- Password hashing (security)
- JWT token generation (authentication)
- Email verification (optional)
- Input validation
- Proper error handling

### 2. **Structure the Class**
Following the established pattern:
- Use a class-based approach for consistency
- Private methods for internal logic
- Public getter for the route
- Private getters for router and prismaClient (reusability)

### 3. **Input Validation Layer**
**Why first?** Validate before any processing to fail fast.
- Email format validation (regex)
- Password strength validation (8+ chars, uppercase, lowercase, number, special)
- Name validation (min 2 chars if provided)
- Returns 400 with specific error messages

### 4. **Password Hashing**
**Security requirement**: Never store plain text passwords.
- Use bcrypt with 10 salt rounds
- Hash before database insertion
- Password never returned in response

### 5. **User Creation**
- Use Prisma to create user with hashed password
- Handle P2002 error (unique constraint violation) for duplicate emails
- Return 409 status for duplicates (not 500)

### 6. **JWT Token Generation**
**Why generate on signup?** To authenticate immediately without requiring login.
- Generate access token (1 hour) and refresh token (7 days)
- Set as HTTP-only cookies (secure, httpOnly, sameSite=strict)
- Use environment variable to determine secure flag (production only)

### 7. **Email Verification (Optional)**
**Why optional?** Allows testing without email service.
- Check `sendVerification` flag in request body (defaults to true)
- Generate verification token (64-char hex string)
- Set 24-hour expiration
- Store in EmailToken table
- Send via SendGrid
- Catch email errors but don't fail registration (graceful degradation)

### 8. **Response Construction**
- Remove password from response using destructuring
- Return 201 status (created)
- Include user data and success message

### 9. **Error Handling**
- Catch-all try-catch block
- Log errors server-side
- Return generic error message to client (security)
- Handle specific Prisma errors (P2002)

## Key Decisions

1. **Password in response?** No - security risk
2. **Email verification required?** No - optional for flexibility
3. **Token generation on signup?** Yes - better UX
4. **Cookie vs header?** Cookie - more secure (httpOnly)
5. **Graceful email failure?** Yes - don't block registration

## Security Considerations

- Passwords hashed with bcrypt (salt rounds: 10)
- Cookies are httpOnly (prevents XSS)
- Cookies are secure in production (HTTPS only)
- Cookies have sameSite=strict (prevents CSRF)
- Password complexity enforced
- Email validation prevents injection
- Generic error messages prevent information leakage

## How to Extend

To add features to this route:

1. **Add more validation**: Add validation fields to ValidationUtil
2. **Add more user fields**: Update Prisma schema and route
3. **Custom email template**: Modify SendGridService
4. **Rate limiting**: Add rate limiting middleware in app.ts
5. **Account type selection**: Add accountType field and create account after user creation

## Example Usage

```bash
curl -X POST http://localhost:3000/authentication/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

Response:
```json
{
  "message": "Account created successfully",
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
