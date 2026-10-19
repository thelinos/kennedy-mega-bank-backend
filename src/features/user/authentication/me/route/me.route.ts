import express, { Router, Request, Response } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { authenticate } from "../../../../../shared/middleware/auth.middleware.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";

/**
 * Me - Handles retrieving current authenticated user
 *
 * This route returns the current user's profile:
 * - Requires valid JWT authentication (via authenticate middleware)
 * - Extracts user ID from decoded JWT token
 * - Fetches user from database including accounts
 * - Returns user data without password
 * - Returns 401 if not authenticated
 * - Returns 404 if user not found (shouldn't happen with valid token)
 *
 * Security Considerations:
 * - Protected by authenticate middleware
 * - Password is excluded from response
 * - Includes related accounts data
 * - User context injected by middleware
 *
 * @route GET /authentication/me
 * @cookie accessToken (required)
 * @returns { message: string, status: string, user: object }
 */
export default class Me {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private _meRoute(): Router {
        return this.router.get("/me", authenticate, async (req: Request<never, never, never>, res: Response): Promise<void> => {
            try {
                if (!req.user) {
                    res.status(401).json({
                        message: "Authentication required",
                        status: Status.failed
                    });
                    return;
                }

                const user = await this.prismaClient.user.findUnique({
                    where: { id: req.user.userId },
                    include: {
                        accounts: true
                    }
                });

                if (!user) {
                    res.status(404).json({
                        message: "User not found",
                        status: Status.failed
                    });
                    return;
                }

                const { password: _, ...userWithoutPassword } = user;

                res.status(200).json({
                    message: "User retrieved successfully",
                    status: Status.successful,
                    user: userWithoutPassword
                });
            } catch (error) {
                console.error("Error retrieving user:", error);
                res.status(500).json({
                    message: "Failed to retrieve user",
                    status: Status.failed
                });
            }
        });
    }

    public get meRoute(): Router {
        return this._meRoute();
    }
}
