import express, { Request, Response, Router } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";
import { EmailValidationError, LoggedInUser, PasswordValidationError } from "../../../../../shared/types/model/data_types.ts";
import { AuthCookieUtil } from "../../../../../shared/utils/cookie.util.ts";
import { AuthSessionUtil } from "../../../../../shared/utils/auth-session.util.ts";
import { authRateLimit } from "../../../../../shared/middleware/rate-limit.middleware.ts";
import { PasswordUtil } from "../../../../../shared/utils/password.util.ts";
import { ValidationUtil } from "../../../../../shared/utils/validation.util.ts";

interface LoginRequestBody {
    email: string;
    password: string;
}

/**
 * Login - Handles user authentication
 *
 * This route implements user login with the following features:
 * - Email format validation
 * - Password existence check
 * - User lookup by email
 * - Password comparison using bcrypt
 * - JWT token pair generation (access + refresh)
 * - HTTP-only cookie setting for secure token storage
 * - Generic error message for invalid credentials (security)
 *
 * Security Considerations:
 * - Same error message for "user not found" and "wrong password" (prevents email enumeration)
 * - Password is never returned in response
 * - Cookies are httpOnly, secure (in production), and sameSite=strict
 * - Access token expires in 15 minutes, refresh token in 7 days
 *
 * @route POST /authentication/login
 * @body { email: string, password: string }
 * @returns { message: string, status: string, user: object }
 */
export default class Login {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private async _loginRouteController(req: Request<never, never, LoginRequestBody>, res: Response<EmailValidationError | PasswordValidationError | LoggedInUser>): Promise<void> {
        try {
            const { email, password } = req.body;

            const emailValidation = ValidationUtil.validateEmail(email);
            if (!emailValidation.valid) {
                res.status(400).json({
                    message: "Invalid email",
                    emailValidationsErrors: emailValidation.errors,
                    status: Status.failed
                });
                return;
            }

            const passwordValidation = ValidationUtil.validateRequired(password, 'Password');
            if (!passwordValidation.valid) {
                res.status(400).json({
                    message: "Password is required",
                    status: Status.failed
                });
                return;
            }

            const user = await this.prismaClient.user.findUnique({
                where: { email }
            });

            if (!user) {
                res.status(401).json({
                    message: "Invalid credentials",
                    status: Status.failed
                });
                return;
            }

            const isPasswordValid = await PasswordUtil.compare(password, user.password || '');

            if (!isPasswordValid) {
                res.status(401).json({
                    message: "Invalid credentials",
                    status: Status.failed
                });
                return;
            }

            const tokens = await AuthSessionUtil.issueTokenPair({
                userId: user.id,
                email: user.email || ''
            });
            AuthCookieUtil.setAuthCookies(res, tokens);

            const { password: _, ...userWithoutPassword } = user;

            res.status(200).json({
                message: "Login successful",
                status: Status.successful,
                email: userWithoutPassword.email || undefined,
                id: userWithoutPassword.id,
                emailVerified: userWithoutPassword.emailVerified,
                createdAt: userWithoutPassword.createdAt,
                updatedAt: userWithoutPassword.updatedAt,
            });
        } catch (error) {
            console.error("Error during login:", error);
            res.status(500).json({
                message: "Failed to login",
                status: Status.failed
            });
        }
    }

    private get _loginRoute(): Router {
        return this.router.post("/login", authRateLimit, this._loginRouteController.bind(this));
    }

    public get loginRoute(): Router {
        return this._loginRoute;
    }
}
