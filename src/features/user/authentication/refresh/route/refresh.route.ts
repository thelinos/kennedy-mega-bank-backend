import express, { Router, Request, Response } from "express";
import { JWTUtil } from "../../../../../shared/utils/jwt.util.ts";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";

/**
 * Refresh - Handles JWT token refresh
 *
 * This route implements token refresh using a refresh token:
 * - Extracts refresh token from HTTP-only cookie
 * - Validates the refresh token
 * - Verifies user still exists in database
 * - Generates new access and refresh tokens
 * - Sets new tokens in HTTP-only cookies
 * - Returns user data without password
 *
 * Security Considerations:
 * - Refresh tokens are longer-lived (7 days) than access tokens (1 hour)
 * - New refresh token is issued on each refresh (token rotation)
 * - Old refresh token becomes invalid after refresh
 * - Prevents token reuse and extends session
 *
 * @route POST /authentication/refresh
 * @cookie refreshToken (required)
 * @returns { message: string, status: string, user: object }
 */
export default class Refresh {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private _refreshRoute(): Router {
        return this.router.post("/refresh", async (req: Request<never, never, never>, res: Response): Promise<void> => {
            try {
                const refreshToken = req.cookies.refreshToken;

                if (!refreshToken) {
                    res.status(401).json({
                        message: "Refresh token not found",
                        status: Status.failed
                    });
                    return;
                }

                const payload = JWTUtil.verifyToken(refreshToken);

                const user = await this.prismaClient.user.findUnique({
                    where: { id: payload.userId }
                });

                if (!user) {
                    res.status(401).json({
                        message: "User not found",
                        status: Status.failed
                    });
                    return;
                }

                const { accessToken, refreshToken: newRefreshToken } = JWTUtil.generateTokenPair({
                    userId: user.id,
                    email: user.email || ''
                });

                const isProduction = process.env.NODE_ENV === 'production';
                res.cookie('accessToken', accessToken, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 1000
                });

                res.cookie('refreshToken', newRefreshToken, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000
                });

                const { password: _, ...userWithoutPassword } = user;

                res.status(200).json({
                    message: "Token refreshed successfully",
                    status: Status.successful,
                    user: userWithoutPassword
                });
            } catch (error) {
                console.error("Error during token refresh:", error);
                res.status(401).json({
                    message: "Invalid or expired refresh token",
                    status: Status.failed
                });
            }
        });
    }

    public get refreshRoute(): Router {
        return this._refreshRoute();
    }
}
