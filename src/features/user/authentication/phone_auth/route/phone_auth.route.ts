import express, { Request, Response, Router } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { generateOTP, sendOTP, validatePhoneNumber } from "../../../../../shared/utils/twilio.util.ts";
import { AuthCookieUtil } from "../../../../../shared/utils/cookie.util.ts";
import { AuthSessionUtil } from "../../../../../shared/utils/auth-session.util.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";
import { authRateLimit } from "../../../../../shared/middleware/rate-limit.middleware.ts";

interface SendOTPRequestBody {
  phoneNumber: string;
}

interface VerifyOTPRequestBody {
  phoneNumber: string;
  otp: string;
}

export class PhoneAuth {
  constructor() { }

  private get router() {
    return express.Router();
  }

  private get prismaClient() {
    return getPrismaClient();
  }

  /**
   * POST /authentication/phone/send-otp
   * Send OTP to phone number for verification
   */
  private async _sendOTPController(req: Request<never, never, SendOTPRequestBody>, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body;

      // Validate phone number format
      if (!validatePhoneNumber(phoneNumber)) {
        res.status(400).json({
          message: "Invalid phone number format. Use E.164 format (e.g., +1234567890)",
          status: Status.failed
        });
        return;
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Check if user exists with this phone number
      const existingUser = await this.prismaClient.user.findUnique({
        where: { phoneNumber }
      });

      const userId = existingUser?.id;

      // Create phone verification record
      await this.prismaClient.phoneVerification.create({
        data: {
          userId,
          phoneNumber,
          otp,
          expiresAt,
          verified: false
        }
      });

      // Send OTP via SMS
      const sent = await sendOTP(phoneNumber, otp);

      if (!sent) {
        res.status(500).json({
          message: "Failed to send OTP. Please try again.",
          status: Status.failed
        });
        return;
      }

      res.status(200).json({
        message: "OTP sent successfully",
        status: Status.successful,
        expiresIn: 300 // 5 minutes in seconds
      });
    } catch (error: unknown) {
      console.error("Error sending OTP:", error);
      res.status(500).json({
        message: "Failed to send OTP",
        status: Status.failed
      });
    }
  }

  /**
   * POST /authentication/phone/verify-otp
   * Verify OTP and authenticate user
   */
  private async _verifyOTPController(req: Request<never, never, VerifyOTPRequestBody>, res: Response): Promise<void> {
    try {
      const { phoneNumber, otp } = req.body;

      // Validate phone number format
      if (!validatePhoneNumber(phoneNumber)) {
        res.status(400).json({
          message: "Invalid phone number format",
          status: Status.failed
        });
        return;
      }

      // Find valid OTP record
      const verification = await this.prismaClient.phoneVerification.findFirst({
        where: {
          phoneNumber,
          otp,
          verified: false,
          expiresAt: {
            gte: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!verification) {
        res.status(400).json({
          message: "Invalid or expired OTP",
          status: Status.failed
        });
        return;
      }

      // Mark OTP as verified
      await this.prismaClient.phoneVerification.update({
        where: { id: verification.id },
        data: { verified: true }
      });

      // Check if user exists
      let user = await this.prismaClient.user.findUnique({
        where: { phoneNumber }
      });

      if (!user) {
        // Create new user with phone number
        user = await this.prismaClient.user.create({
          data: {
            phoneNumber,
            phoneVerified: true,
            password: null, // Phone auth users don't need password
            emailVerified: false
          }
        });
      } else {
        // Update existing user's phone verification status
        user = await this.prismaClient.user.update({
          where: { id: user.id },
          data: { phoneVerified: true }
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      const tokens = await AuthSessionUtil.issueTokenPair({
        userId: user.id,
        email: user.email || ''
      });
      AuthCookieUtil.setAuthCookies(res, tokens);

      res.status(200).json({
        message: "Phone verified successfully",
        status: Status.successful,
        user: userWithoutPassword
      });
    } catch (error: unknown) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({
        message: "Failed to verify OTP",
        status: Status.failed
      });
    }
  }

  private get _sendOTPRoute(): Router {
    return this.router.post("/phone/send-otp", authRateLimit, this._sendOTPController.bind(this));
  }

  private get _verifyOTPRoute(): Router {
    return this.router.post("/phone/verify-otp", authRateLimit, this._verifyOTPController.bind(this));
  }

  public get sendOTPRoute(): Router {
    return this._sendOTPRoute;
  }

  public get verifyOTPRoute(): Router {
    return this._verifyOTPRoute;
  }
}
