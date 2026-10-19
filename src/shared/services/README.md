# Services

This directory contains service classes for external integrations.

## Files

### email/sendgrid.service.ts
SendGrid email service for sending transactional emails.

**Purpose:**
- Send verification emails
- Send password reset emails
- Handle email template rendering
- Manage SendGrid API configuration

**Methods:**
- `sendVerificationEmail(params)` - Send email verification link
- `sendPasswordResetEmail(params)` - Send password reset link

**Configuration:**
Environment variables:
```bash
SENDGRID_API_KEY="your-api-key"
SENDGRID_FROM_EMAIL="noreply@kennedy-mega-bank.com"
SENDGRID_FROM_NAME="Kennedy Mega Bank"
```

**Email Templates:**
Both methods use HTML templates with:
- Professional styling
- Call-to-action buttons
- Fallback links
- Expiration information

**Usage:**
```typescript
import { SendGridService } from './email/sendgrid.service.js';

await SendGridService.sendVerificationEmail({
  to: 'user@example.com',
  verificationUrl: 'http://localhost:3000/verify?token=xxx',
  userName: 'John Doe'
});
```

**Error Handling:**
- Throws error if sending fails
- Log errors server-side
- Route handlers should catch and handle gracefully

## How to Add New Services

Follow this pattern:

```typescript
import someService from 'some-service-library';

const API_KEY = process.env.SOME_SERVICE_API_KEY;

export class YourService {
  static async doSomething(params: YourParams): Promise<void> {
    // Your logic here
  }
}
```

## Service Guidelines

1. **Static Methods**: Use static methods for stateless services
2. **Environment Variables**: Load configuration from environment
3. **Error Handling**: Throw errors, let route handlers catch
4. **Type Safety**: Use TypeScript interfaces for parameters
5. **Documentation**: Add JSDoc comments for all methods

## Future Services

Potential services to add:
- SMS service (Twilio) for phone verification
- File storage service (AWS S3) for file uploads
- Payment gateway service (Stripe) for transactions
- Notification service (Push, Email, SMS)
- Analytics service (Google Analytics, Mixpanel)
