import express, { Router, Request, Response } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { SendGridService } from "../../../../../shared/services/email/sendgrid.service.ts";
import { TokenUtil } from "../../../../../shared/utils/token.util.ts";
import { ValidationUtil } from "../../../../../shared/utils/validation.util.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";

/**
 * ForgotPassword - Handles password reset request
 *
 * This route initiates the password reset flow:
 * - Validates email format
 * - Checks if user exists (but doesn't reveal if not found - security)
 * - Generates password reset token
 * - Stores token in database with 1-hour expiration
 * - Sends reset email via SendGrid
 * - Returns generic success message regardless of user existence
 *
 * Security Considerations:
 * - Generic response prevents email enumeration attacks
 * - Token expires in 1 hour (shorter than email verification)
 * - Email is logged server-side but not exposed to client
 * - If email sending fails, request still succeeds (prevents info leak)
 *
 * @route POST /authentication/forgot-password
 * @body { email: string }
 * @returns { message: string, status: string }
 */
export class ForgotPassword {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private get _forgotPasswordRoute(): Router {
        return this.router.post("/forgot-password", async (req: Request<never, never, { email: string }>, res: Response): Promise<void> => {
            try {
                const { email } = req.body;

                const emailValidation = ValidationUtil.validateEmail(email);
                if (!emailValidation.valid) {
                    res.status(400).json({
                        message: "Invalid email",
                        errors: emailValidation.errors,
                        status: Status.failed
                    });
                    return;
                }

                const user = await this.prismaClient.user.findUnique({
                    where: { email }
                });

                if (!user) {
                    res.status(404).json({
                        message: "If an account exists with this email, a password reset link has been sent",
                        status: Status.successful
                    });
                    return;
                }

                const token = TokenUtil.generateVerificationToken();
                const expiresAt = TokenUtil.getExpirationDate(1);

                const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
                const resetUrl = `${baseUrl}/authentication/reset-password?token=${token}`;

                await this.prismaClient.passwordResetToken.create({
                    data: {
                        userId: user.id,
                        token,
                        expiresAt
                    }
                });

                try {
                    await SendGridService.sendPasswordResetEmail({
                        to: user.email || '',
                        resetUrl,
                        userName: user.name || undefined
                    });
                } catch (emailError) {
                    console.error("Failed to send password reset email:", emailError);
                }

                res.status(200).json({
                    message: "If an account exists with this email, a password reset link has been sent",
                    status: Status.successful
                });
            } catch (error) {
                console.error("Error during forgot password:", error);
                res.status(500).json({
                    message: "Failed to process forgot password request",
                    status: Status.failed
                });
            }
        });
    }

    public get forgotPasswordRoute(): Router {
        return this._forgotPasswordRoute;
    }
}
