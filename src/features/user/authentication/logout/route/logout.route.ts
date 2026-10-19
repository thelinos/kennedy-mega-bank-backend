import express, { Router, Request, Response } from "express";
import Status from "../../../../../shared/types/enums/status.enum.ts";

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
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');

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
