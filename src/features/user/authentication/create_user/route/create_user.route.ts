import express, { Request, Response, Router } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";
import { CreatedUser, CreateUserRequestBody, EmailValidationError, ServerError } from "../../../../../shared/types/model/data_types.ts";
import { AuthSessionUtil } from "../../../../../shared/utils/auth-session.util.ts";
import { AuthCookieUtil } from "../../../../../shared/utils/cookie.util.ts";
import { authRateLimit } from "../../../../../shared/middleware/rate-limit.middleware.ts";
import { PasswordUtil } from "../../../../../shared/utils/password.util.ts";
import { ValidationUtil } from "../../../../../shared/utils/validation.util.ts";


/**
 * CreateUser - Handles user registration
 *
 * This route implements user sign-up with the following features:
 * - Input validation (email format, password strength)
 * - Password hashing using bcrypt (security)
 * - JWT token generation for immediate authentication
 * - HTTP-only cookie setting for secure token storage
 * - Duplicate email handling (Prisma P2002 error)
 * - Proper error responses with appropriate status codes
 *
 * Security Considerations:
 * - Password is never returned in response
 * - Cookies are httpOnly, secure (in production), and sameSite=strict
 * - Password must meet complexity requirements
 *
 * @route POST /authentication/create-user
 * @body { email: string, password: string }
 * @returns { message: string, status: string, user: object }
 */
export class CreateUser {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private async _createUserRouteController(req: Request<never, never, CreateUserRequestBody>, res: Response<EmailValidationError | CreatedUser | ServerError>): Promise<void> {
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

            const passwordValidation = ValidationUtil.validatePassword(password);
            if (!passwordValidation.valid) {
                res.status(400).json({
                    message: "Invalid password",
                    emailValidationsErrors: passwordValidation.errors,
                    status: Status.failed
                });
                return;
            }

            const hashedPassword = await PasswordUtil.hash(password);

            const newUser = await this.prismaClient.user.create({
                data: {
                    email,
                    password: hashedPassword,
                }
            });

            const tokens = await AuthSessionUtil.issueTokenPair({
                userId: newUser.id,
                email: newUser.email || ''
            });
            AuthCookieUtil.setAuthCookies(res, tokens);

            const { password: _, ...userWithoutPassword } = newUser;

            res.status(201).json({
                message: "Account created successfully",
                status: Status.successful,
                emailVerified: userWithoutPassword.emailVerified,
                email: userWithoutPassword.email || undefined,
                id: userWithoutPassword.id,
                createdAt: userWithoutPassword.createdAt,
                updatedAt: userWithoutPassword.updatedAt,
            });
        } catch (error: unknown) {
            console.error("Error creating user:", error);

            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
                res.status(409).json({
                    message: "Email already exists",
                    status: Status.failed
                });
                return;
            }

            res.status(500).json({
                message: "Failed to create user",
                status: Status.failed
            });
        }
    }

    private get _createUserRoute(): Router {
        return this.router.post("/create-user", authRateLimit, this._createUserRouteController.bind(this));
    }

    public get createUserRoute(): Router {
        return this._createUserRoute;
    }
}
