# Kennedy Mega Bank API Review & Implementation Plan

## Current API Inventory

### Existing Endpoints

1. **POST** `/authentication/create-user`
   - Status: ⚠️ Incomplete
   - Purpose: User registration
   - Issues: Missing password hashing, JWT, input validation, security concerns

2. **POST** `/authentication/send-verification-email`
   - Status: ✅ Complete
   - Purpose: Resend verification email to user
   - Implementation: Good error handling, token generation

3. **GET** `/authentication/verify-email`
   - Status: ✅ Complete
   - Purpose: Verify email via token
   - Implementation: Transaction-based update, proper validation

4. **GET** `/health`
   - Status: ✅ Complete
   - Purpose: Health check endpoint
   - Implementation: Basic status check

---

## Sign-Up Route Cross-Check Results

### File: `src/features/user/authentication/create_user/route/create_user.route.ts`

#### ✅ What's Working Well:
- Email verification token generation using `TokenUtil`
- Transaction-like approach for user + email token creation
- Optional verification email sending (can be disabled)
- SendGrid integration for email delivery
- Proper error logging for email failures

#### ⚠️ Critical Issues to Fix:

1. **Security Issue - Password Exposure (Line 61)**
   ```typescript
   ...newUser  // Spreads entire user object including password
   ```
   - **Problem**: Returns password in response
   - **Fix**: Return only safe fields (id, email, name, emailVerified, createdAt)

2. **Missing Password Hashing (Line 23)**
   - **Problem**: Password stored in plain text
   - **Fix**: Use bcrypt (already installed) to hash before storage
   - **Implementation**:
     ```typescript
     const hashedPassword = await bcrypt.hash(password, 10);
     ```

3. **Missing JWT Token Generation (Line 24)**
   - **Problem**: No authentication token returned
   - **Fix**: Generate JWT and set as HTTP-only cookie
   - **Implementation**: Use jsonwebtoken (already installed)

4. **No Input Validation**
   - **Problem**: No validation for email format, password strength, required fields
   - **Fix**: Add validation middleware or manual checks
   - **Requirements**:
     - Email: Valid format
     - Password: Min 8 chars, uppercase, lowercase, number, special char
     - Name: Optional but if provided, min 2 chars

5. **Poor Error Handling (Line 65)**
   - **Problem**: Using 501 (Not Implemented) for all errors
   - **Fix**: Use appropriate status codes:
     - 400: Bad request (validation errors)
     - 409: Conflict (duplicate email)
     - 500: Internal server error

6. **No Duplicate Email Handling**
   - **Problem**: Prisma unique constraint will throw unhandled error
   - **Fix**: Catch Prisma P2002 error and return 409 with user-friendly message

7. **Generic Error Message (Line 65)**
   - **Problem**: Exposes error details to client
   - **Fix**: Return generic message in production, log details server-side

---

## Implementation Plan

### Phase 1: Complete Sign-Up Route

#### Task 1.1: Add Input Validation
- Create validation utility or middleware
- Validate email format (regex or library)
- Validate password strength (min 8 chars, complexity requirements)
- Validate name if provided
- Return 400 with specific error messages

#### Task 1.2: Implement Password Hashing
- Use bcrypt (already in package.json)
- Hash password with salt rounds of 10-12
- Store hashed password in database
- Never return password in any response

#### Task 1.3: Implement JWT Token Generation
- Use jsonwebtoken (already in package.json)
- Generate JWT with user payload (id, email)
- Set JWT as HTTP-only cookie for security
- Configure cookie options (secure, httpOnly, sameSite, maxAge)
- Return user data without password

#### Task 1.4: Improve Error Handling
- Catch Prisma unique constraint error (P2002)
- Return 409 for duplicate email
- Return 400 for validation errors
- Return 500 for unexpected errors
- Log full error details server-side
- Return generic error messages to client

#### Task 1.5: Security Hardening
- Remove password from response
- Add rate limiting middleware (prevent abuse)
- Add request body size limit
- Add CORS configuration
- Add helmet middleware for security headers

---

### Phase 2: Missing Authentication APIs

#### Task 2.1: Login Route
- **POST** `/authentication/login`
- Validate credentials (email + password)
- Compare password with bcrypt.compare
- Generate JWT token
- Set HTTP-only cookie
- Return user data

#### Task 2.2: Logout Route
- **POST** `/authentication/logout`
- Clear JWT cookie
- Return success message

#### Task 2.3: Refresh Token Route
- **POST** `/authentication/refresh`
- Validate existing token
- Generate new token
- Update cookie
- Return new user data

#### Task 2.4: Forgot Password Route
- **POST** `/authentication/forgot-password`
- Validate email exists
- Generate password reset token
- Store in database
- Send reset email via SendGrid

#### Task 2.5: Reset Password Route
- **POST** `/authentication/reset-password`
- Validate reset token
- Hash new password
- Update user password
- Invalidate reset token
- Require re-login

#### Task 2.6: Get Current User Route
- **GET** `/authentication/me`
- Validate JWT from cookie
- Return current user data
- Exclude password

---

### Phase 3: Account Management APIs

#### Task 3.1: Create Account
- **POST** `/accounts`
- Validate JWT authentication
- Create account for user
- Initialize with balance (optional)
- Return account details

#### Task 3.2: Get User Accounts
- **GET** `/accounts`
- Validate JWT authentication
- Return all accounts for current user
- Include balance info

#### Task 3.3: Get Account Details
- **GET** `/accounts/:id`
- Validate JWT authentication
- Verify account belongs to user
- Return account details with transactions

#### Task 3.4: Update Account
- **PUT** `/accounts/:id`
- Validate JWT authentication
- Verify account ownership
- Update account type or metadata
- Return updated account

#### Task 3.5: Delete Account
- **DELETE** `/accounts/:id`
- Validate JWT authentication
- Verify account ownership
- Check balance is zero
- Soft delete account
- Return success message

---

### Phase 4: Transaction APIs

#### Task 4.1: Create Transaction
- **POST** `/transactions`
- Validate JWT authentication
- Validate account ownership
- Check sufficient balance (for debits)
- Create transaction record
- Update account balance
- Return transaction details

#### Task 4.2: Get Account Transactions
- **GET** `/accounts/:id/transactions`
- Validate JWT authentication
- Verify account ownership
- Return paginated transactions
- Support filtering (date range, type, amount)

#### Task 4.3: Get Transaction Details
- **GET** `/transactions/:id`
- Validate JWT authentication
- Verify transaction belongs to user's account
- Return transaction details

#### Task 4.4: Transfer Between Accounts
- **POST** `/transfers`
- Validate JWT authentication
- Verify both accounts belong to user
- Check sufficient balance
- Create debit transaction
- Create credit transaction
- Update both account balances
- Use database transaction for atomicity

---

### Phase 5: Avatar/Profile APIs (MongoDB)

#### Task 5.1: Upload Avatar
- **POST** `/users/avatar`
- Validate JWT authentication
- Validate file size (<2MB)
- Validate file type (JPEG/PNG/WebP)
- Compress image using sharp
- Store in MongoDB as Binary
- Update user avatar reference
- Return avatar URL/metadata

#### Task 5.2: Get Avatar
- **GET** `/users/avatar/:userId`
- Optional authentication (public avatars?)
- Retrieve from MongoDB
- Return image with proper Content-Type
- Implement caching

#### Task 5.3: Delete Avatar
- **DELETE** `/users/avatar`
- Validate JWT authentication
- Remove from MongoDB
- Clear user avatar reference
- Return success message

#### Task 5.4: Update Profile
- **PUT** `/users/profile`
- Validate JWT authentication
- Update name, email (with verification)
- Return updated user data

---

### Phase 6: Infrastructure & Testing

#### Task 6.1: Add Authentication Middleware
- Create JWT validation middleware
- Protect routes that require authentication
- Add user context to request object

#### Task 6.2: Add Rate Limiting
- Implement rate limiting middleware
- Protect authentication endpoints
- Configure limits per endpoint

#### Task 6.3: Add Request Validation Middleware
- Create validation schemas
- Apply to all routes
- Return consistent error responses

#### Task 6.4: Write Unit Tests
- Test token utilities
- Test password hashing
- Test validation logic
- Test service layer

#### Task 6.5: Write Integration Tests
- Test authentication flow
- Test account creation
- Test transactions
- Test error scenarios

#### Task 6.6: Write E2E Tests
- Test complete user journey
- Test authentication flows
- Test banking operations

---

## File Structure Updates Needed

### New Files to Create:
```
src/
├── shared/
│   ├── middleware/
│   │   ├── auth.middleware.ts (JWT validation)
│   │   ├── validation.middleware.ts (request validation)
│   │   └── rateLimit.middleware.ts (rate limiting)
│   ├── utils/
│   │   ├── password.util.ts (password hashing/comparison)
│   │   └── jwt.util.ts (JWT generation/validation)
│   └── validators/
│       └── auth.validator.ts (input validation schemas)
├── features/
│   ├── user/
│   │   └── authentication/
│   │       ├── login/
│   │       │   ├── index.ts
│   │       │   └── route/login.route.ts
│   │       ├── logout/
│   │       │   ├── index.ts
│   │       │   └── route/logout.route.ts
│   │       ├── refresh/
│   │       │   ├── index.ts
│   │       │   └── route/refresh.route.ts
│   │       ├── forgot-password/
│   │       │   ├── index.ts
│   │       │   └── route/forgot-password.route.ts
│   │       ├── reset-password/
│   │       │   ├── index.ts
│   │       │   └── route/reset-password.route.ts
│   │       └── me/
│   │           ├── index.ts
│   │           └── route/me.route.ts
│   ├── account/
│   │   ├── create-account/
│   │   ├── get-accounts/
│   │   ├── get-account/
│   │   ├── update-account/
│   │   └── delete-account/
│   ├── transaction/
│   │   ├── create-transaction/
│   │   ├── get-transactions/
│   │   ├── get-transaction/
│   │   └── transfer/
│   └── user/
│       ├── upload-avatar/
│       ├── get-avatar/
│       ├── delete-avatar/
│       └── update-profile/
```

---

## Dependencies Already Installed (Good News!)
- ✅ `bcrypt` - Password hashing
- ✅ `jsonwebtoken` - JWT tokens
- ✅ `@sendgrid/mail` - Email service
- ✅ `mongodb` - For avatar storage

## Dependencies to Consider Adding:
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `joi` or `zod` - Input validation
- `sharp` - Image compression (for avatars)
- `multer` - File upload handling (for avatars)
- `cookie-parser` - Cookie parsing (if not already)
- `cors` - CORS configuration

---

## Priority Order

1. **High Priority** (Core Authentication):
   - Fix sign-up route issues
   - Add password hashing
   - Add JWT generation
   - Add input validation
   - Implement login route
   - Implement logout route

2. **Medium Priority** (Banking Features):
   - Account management APIs
   - Transaction APIs
   - Transfer functionality

3. **Low Priority** (Enhancements):
   - Avatar upload (MongoDB)
   - Profile management
   - Advanced features (refresh tokens, forgot password)

---

## Notes for Home Implementation

1. **Start with Phase 1** - Complete the sign-up route first
2. **Test thoroughly** - Each API should have tests
3. **Security first** - Never skip password hashing or JWT validation
4. **Consistent responses** - Use the Status enum for all responses
5. **Error handling** - Catch and handle all error scenarios
6. **Database transactions** - Use Prisma transactions for multi-step operations
7. **MongoDB for avatars** - As discussed, perfect for this use case

---

## Questions to Consider Before Implementation

1. **Password Requirements**: What should the minimum password complexity be?
2. **JWT Expiration**: How long should JWT tokens last? (Recommended: 15-60 minutes)
3. **Refresh Tokens**: Should we implement refresh tokens for better UX?
4. **Account Types**: What types of accounts will users have? (Savings, Checking, etc.)
5. **Transaction Limits**: Should there be daily/monthly transaction limits?
6. **Avatar Storage**: Should avatars be public or private?
7. **Rate Limiting**: What rate limits should we apply to auth endpoints?

---

## Next Steps

1. Review this plan
2. Decide which APIs to build next
3. Approve the plan to start implementation
4. Begin with Phase 1 (Sign-up route fixes)
