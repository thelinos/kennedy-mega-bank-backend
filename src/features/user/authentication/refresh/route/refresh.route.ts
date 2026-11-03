import express, { Router, Request, Response } from "express";
import { AuthSessionUtil } from "../../../../../shared/utils/auth-session.util.ts";
import { AuthCookieUtil } from "../../../../../shared/utils/cookie.util.ts";
import { JWTPayload, JWTUtil } from "../../../../../shared/utils/jwt.util.ts";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";
import { authRateLimit } from "../../../../../shared/middleware/rate-limit.middleware.ts";

export default class Refresh {
    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private _refreshRoute(): Router {
        return this.router.post("/refresh", authRateLimit, async (req: Request<never, never, never>, res: Response): Promise<void> => {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                AuthCookieUtil.clearAuthCookies(res);
                res.status(401).json({
                    message: "Refresh token not found",
                    status: Status.failed
                });
                return;
            }

            let payload: JWTPayload;
            try {
                payload = JWTUtil.verifyRefreshToken(refreshToken);
            } catch {
                AuthCookieUtil.clearAuthCookies(res);
                res.status(401).json({
                    message: "Invalid or expired refresh token",
                    status: Status.failed
                });
                return;
            }

            if (!payload.tokenId) {
                AuthCookieUtil.clearAuthCookies(res);
                res.status(401).json({
                    message: "Invalid or expired refresh token",
                    status: Status.failed
                });
                return;
            }

            try {
                const rotated = await this.prismaClient.$transaction(async (tx) => {
                    const now = new Date();
                    const session = await tx.refreshSession.findUnique({
                        where: { tokenId: payload.tokenId }
                    });

                    if (!session || session.userId !== payload.userId) {
                        return null;
                    }

                    const user = await tx.user.findUnique({
                        where: { id: payload.userId }
                    });
                    if (!user) {
                        return null;
                    }

                    const claimed = await tx.refreshSession.updateMany({
                        where: {
                            tokenId: payload.tokenId,
                            userId: payload.userId,
                            revokedAt: null,
                            expiresAt: { gt: now }
                        },
                        data: { revokedAt: now }
                    });

                    if (claimed.count !== 1) {
                        await tx.refreshSession.updateMany({
                            where: {
                                familyId: session.familyId,
                                revokedAt: null
                            },
                            data: { revokedAt: now }
                        });
                        return null;
                    }

                    const tokens = await AuthSessionUtil.issueTokenPair({
                        userId: user.id,
                        email: user.email || ''
                    }, session.familyId, tx);

                    return { tokens, user };
                });

                if (!rotated) {
                    AuthCookieUtil.clearAuthCookies(res);
                    res.status(401).json({
                        message: "Invalid or expired refresh token",
                        status: Status.failed
                    });
                    return;
                }

                AuthCookieUtil.setAuthCookies(res, rotated.tokens);

                const { password: _, ...userWithoutPassword } = rotated.user;
                res.status(200).json({
                    message: "Token refreshed successfully",
                    status: Status.successful,
                    user: userWithoutPassword
                });
            } catch (error) {
                console.error("Error during token refresh:", error);
                res.status(500).json({
                    message: "Failed to refresh token",
                    status: Status.failed
                });
            }
        });
    }

    public get refreshRoute(): Router {
        return this._refreshRoute();
    }
}
