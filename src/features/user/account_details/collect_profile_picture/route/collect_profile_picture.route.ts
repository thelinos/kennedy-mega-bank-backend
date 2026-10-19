import express, { Request, Response, Router } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { authenticate } from "../../../../../shared/middleware/auth.middleware.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";

interface CollectProfilePictureRequestBody {
    profilePicture: string;
}

export class CollectProfilePicture {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private async _collectProfilePictureController(req: Request<never, never, CollectProfilePictureRequestBody>, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required",
                    status: Status.failed
                });
                return;
            }

            const { profilePicture } = req.body;

            if (!profilePicture) {
                res.status(400).json({
                    message: "Profile picture is required",
                    status: Status.failed
                });
                return;
            }

            // Check if user already provided profile picture
            const existingCredential = await this.prismaClient.userCredential.findUnique({
                where: { userId: req.user.userId }
            });

            if (existingCredential?.profilePicture) {
                res.status(400).json({
                    message: "Profile picture has already been provided",
                    status: Status.failed
                });
                return;
            }

            // Create or update user credential with profile picture
            const userCredential = await this.prismaClient.userCredential.upsert({
                where: { userId: req.user.userId },
                create: {
                    userId: req.user.userId,
                    profilePicture,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                update: {
                    profilePicture,
                    updatedAt: new Date()
                }
            });

            const user = await this.prismaClient.user.findUnique({
                where: { id: req.user.userId }
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
                message: "Profile picture collected successfully",
                status: Status.successful,
                user: userWithoutPassword
            });
        } catch (error: unknown) {
            console.error("Error collecting profile picture:", error);
            res.status(500).json({
                message: "Failed to collect profile picture",
                status: Status.failed
            });
        }
    }

    private get _collectProfilePictureRoute(): Router {
        return this.router.post("/collect-profile-picture", authenticate, this._collectProfilePictureController.bind(this));
    }

    public get collectProfilePictureRoute(): Router {
        return this._collectProfilePictureRoute;
    }
}
