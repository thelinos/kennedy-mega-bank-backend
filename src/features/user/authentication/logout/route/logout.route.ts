import express, { Router, Request, Response } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";
import { AuthCookieUtil } from "../../../../../shared/utils/cookie.util.ts";
import { JWTPayload, JWTUtil } from "../../../../../shared/utils/jwt.util.ts";

/**
 * Logout - Handles user logout
 *
 * This route implements user logout by clearing authentication cookies:
 * - Clears accessToken cookie
 * - Clears refreshToken cookie
 * - Returns success message
 *
 * Security Considerations:
 * - Cookies are cleared from client side
 * - No server-side token revocation (simple implementation)
 * - For production, consider maintaining a token blacklist
 *
 * @route POST /authentication/logout
 * @returns { message: string, status: string }
 */
export default class Logout {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private _logoutRoute(): Router {
        return this.router.post("/logout", async (req: Request<never, never, never>, res: Response): Promise<void> => {
            try {
                const refreshToken = req.cookies?.refreshToken;
                if (refreshToken) {
                    let payload: JWTPayload | null;
                    try {
                        payload = JWTUtil.verifyRefreshToken(refreshToken);
                    } catch {
                        payload = null;
                    }

                    if (payload?.tokenId) {
                        const session = await getPrismaClient().refreshSession.findUnique({
                            where: { tokenId: payload.tokenId }
                        });
                        if (session && session.userId === payload.userId) {
                            await getPrismaClient().refreshSession.updateMany({
                                where: { familyId: session.familyId, revokedAt: null },
                                data: { revokedAt: new Date() }
                            });
                        }
                    }
                }

                AuthCookieUtil.clearAuthCookies(res);

                res.status(200).json({
                    message: "Logout successful",
                    status: Status.successful
                });
            } catch (error) {
                console.error("Error during logout:", error);
                res.status(500).json({
                    message: "Failed to logout",
                    status: Status.failed
                });
            }
        });
    }

    public get logoutRoute(): Router {
        return this._logoutRoute();
    }
}
