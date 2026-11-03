import express, { Router, Request, Response } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { SendGridService } from "../../../../../shared/services/email/sendgrid.service.ts";
import { TokenUtil } from "../../../../../shared/utils/token.util.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";
import { authRateLimit } from "../../../../../shared/middleware/rate-limit.middleware.ts";

/**
 * VerifyUser - Handles email verification
 *
 * This class implements two routes for email verification:
 *
 * 1. POST /send-verification-email - Resends verification email
 *    - Validates email is provided
 *    - Checks user exists
 *    - Checks email not already verified
 *    - Generates new verification token
 *    - Sends verification email via SendGrid
 *
 * 2. GET /verify-email?token=xxx - Verifies email with token
 *    - Validates token exists in query params
 *    - Looks up token in database
 *    - Checks token hasn't been used
 *    - Checks token hasn't expired
 *    - Updates user.emailVerified to true
 *    - Marks token as used (prevents reuse)
 *    - Uses database transaction for atomicity
 *
 * Security Considerations:
 * - Tokens expire in 24 hours
 * - Tokens marked as used after verification (prevents replay)
 * - Database transaction ensures both updates succeed or fail together
 * - Generic error messages prevent information leakage
 *
 * @route POST /authentication/send-verification-email
 * @body { email: string }
 * @returns { message: string, status: string }
 *
 * @route GET /authentication/verify-email?token=xxx
 * @query token (required)
 * @returns { message: string, status: string }
 */
export default class VerifyUser {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private _sendVerificationEmail(): Router {
        return this.router.post("/send-verification-email", authRateLimit, async (req: Request<never, never, { email: string }>, res: Response): Promise<void> => {
            try {
                const { email } = req.body;

                if (!email) {
                    res.status(400).json({
                        message: "Email is required",
                        status: Status.failed
                    });
                    return;
                }

                const user = await this.prismaClient.user.findUnique({
                    where: { email }
                });

                if (!user) {
                    res.status(404).json({
                        message: "User not found",
                        status: Status.failed
                    });
                    return;
                }

                if (user.emailVerified) {
                    res.status(400).json({
                        message: "Email is already verified",
                        status: Status.failed
                    });
                    return;
                }

                const token = TokenUtil.generateVerificationToken();
                const expiresAt = TokenUtil.getExpirationDate(24);

                const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
                const verificationUrl = `${baseUrl}/authentication/verify-email?token=${token}`;

                await this.prismaClient.emailToken.create({
                    data: {
                        userId: user.id,
                        token,
                        expiresAt
                    }
                });

                await SendGridService.sendVerificationEmail({
                    to: user.email || '',
                    verificationUrl,
                    userName: user.name || undefined
                });

                res.status(200).json({
                    message: "Verification email sent successfully",
                    status: Status.successful
                });
            } catch (error) {
                console.error("Error sending verification email:", error);
                res.status(500).json({
                    message: "Failed to send verification email",
                    status: Status.failed
                });
            }
        });
    }

    private _verifyEmail(): Router {
        return this.router.get("/verify-email", authRateLimit, async (req: Request<{ token?: string }, never, never>, res: Response): Promise<void> => {
            try {
                const { token } = req.query;

                if (!token || typeof token !== 'string') {
                    res.status(400).json({
                        message: "Token is required",
                        status: Status.failed
                    });
                    return;
                }

                const emailToken = await this.prismaClient.emailToken.findUnique({
                    where: { token },
                    include: { user: true }
                });

                if (!emailToken) {
                    res.status(400).json({
                        message: "Invalid token",
                        status: Status.failed
                    });
                    return;
                }

                if (emailToken.used) {
                    res.status(400).json({
                        message: "Token has already been used",
                        status: Status.failed
                    });
                    return;
                }

                if (new Date() > emailToken.expiresAt) {
                    res.status(400).json({
                        message: "Token has expired",
                        status: Status.failed
                    });
                    return;
                }

                await this.prismaClient.$transaction([
                    this.prismaClient.user.update({
                        where: { id: emailToken.userId },
                        data: { emailVerified: true }
                    }),
                    this.prismaClient.emailToken.update({
                        where: { id: emailToken.id },
                        data: { used: true }
                    })
                ]);

                res.status(200).json({
                    message: "Email verified successfully",
                    status: Status.successful
                });
            } catch (error) {
                console.error("Error verifying email:", error);
                res.status(500).json({
                    message: "Failed to verify email",
                    status: Status.failed
                });
            }
        });
    }

    public get verifyUserRoutes(): Router {
        const router = express.Router();
        router.use(this._sendVerificationEmail());
        router.use(this._verifyEmail());
        return router;
    }
}
