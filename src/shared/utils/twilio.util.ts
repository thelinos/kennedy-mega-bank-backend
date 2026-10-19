import twilio from 'twilio';

/**
 * Twilio Utility for SMS verification
 *
 * This utility handles sending SMS messages via Twilio for phone verification.
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  console.warn('Twilio credentials not configured. SMS verification will not work.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via SMS
 *
 * @param to - Phone number to send OTP to (E.164 format, e.g., +1234567890)
 * @param otp - OTP code to send
 * @returns Promise that resolves when SMS is sent
 */
export async function sendOTP(to: string, otp: string): Promise<boolean> {
  if (!client) {
    console.error('Twilio client not initialized');
    return false;
  }

  try {
    await client.messages.create({
      body: `Your Kennedy Mega Bank verification code is: ${otp}. This code expires in 5 minutes.`,
      from: fromNumber,
      to,
    });

    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

/**
 * Validate phone number format (E.164)
 *
 * @param phoneNumber - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}
