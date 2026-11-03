import express, { Router, Request, Response } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { PasswordUtil } from "../../../../../shared/utils/password.util.ts";
import { ValidationUtil } from "../../../../../shared/utils/validation.util.ts";
import { authRateLimit } from "../../../../../shared/middleware/rate-limit.middleware.ts";
import { AuthCookieUtil } from "../../../../../shared/utils/cookie.util.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";

/**
 * ResetPassword - Handles password reset with token
 *
 * This route completes the password reset flow:
 * - Validates reset token exists
 * - Validates new password meets strength requirements
 * - Verifies token exists in database
 * - Checks token hasn't been used
 * - Checks token hasn't expired
 * - Hashes new password with bcrypt
 * - Updates user password using database transaction
 * - Marks token as used (prevents reuse)
 * - Clears authentication cookies (requires re-login)
 *
 * Security Considerations:
 * - Uses database transaction for atomicity
 * - Token marked as used immediately (prevents replay attacks)
 * - Cookies cleared to force re-login with new password
 * - Password strength validation applies to reset as well
 * - All operations in single transaction (all-or-nothing)
 *
 * @route POST /authentication/reset-password
 * @body { token: string, newPassword: string }
 * @returns { message: string, status: string }
 */
export default class ResetPassword {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private _resetPasswordRoute(): Router {
        return this.router.post("/reset-password", authRateLimit, async (req: Request<never, never, { token: string; newPassword: string }>, res: Response): Promise<void> => {
            try {
                const { token, newPassword } = req.body;

                if (!token) {
                    res.status(400).json({
                        message: "Token is required",
                        status: Status.failed
                    });
                    return;
                }

                const passwordValidation = ValidationUtil.validatePassword(newPassword);
                if (!passwordValidation.valid) {
                    res.status(400).json({
                        message: "Invalid password",
                        errors: passwordValidation.errors,
                        status: Status.failed
                    });
                    return;
                }

                const resetToken = await this.prismaClient.passwordResetToken.findUnique({
                    where: { token },
                    include: { user: true }
                });

                if (!resetToken) {
                    res.status(400).json({
                        message: "Invalid or expired token",
                        status: Status.failed
                    });
                    return;
                }

                if (resetToken.used) {
                    res.status(400).json({
                        message: "Token has already been used",
                        status: Status.failed
                    });
                    return;
                }

                if (new Date() > resetToken.expiresAt) {
                    res.status(400).json({
                        message: "Token has expired",
                        status: Status.failed
                    });
                    return;
                }

                const hashedPassword = await PasswordUtil.hash(newPassword);

                await this.prismaClient.$transaction(async (tx) => {
                    await tx.user.update({
                        where: { id: resetToken.userId },
                        data: { password: hashedPassword }
                    });
                    await tx.passwordResetToken.update({
                        where: { id: resetToken.id },
                        data: { used: true }
                    });
                    await tx.refreshSession.updateMany({
                        where: { userId: resetToken.userId, revokedAt: null },
                        data: { revokedAt: new Date() }
                    });
                });

                AuthCookieUtil.clearAuthCookies(res);

                res.status(200).json({
                    message: "Password reset successfully. Please login with your new password.",
                    status: Status.successful
                });
            } catch (error) {
                console.error("Error during password reset:", error);
                res.status(500).json({
                    message: "Failed to reset password",
                    status: Status.failed
                });
            }
        });
    }

    public get resetPasswordRoute(): Router {
        return this._resetPasswordRoute();
    }
}
