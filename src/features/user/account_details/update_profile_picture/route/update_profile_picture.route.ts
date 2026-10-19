import express, { Request, Response, Router } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { authenticate } from "../../../../../shared/middleware/auth.middleware.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";

interface UpdateProfilePictureRequestBody {
    profilePicture: string;
}

export class UpdateProfilePicture {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private async _updateProfilePictureController(req: Request<never, never, UpdateProfilePictureRequestBody>, res: Response): Promise<void> {
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

            // Update user credential with profile picture
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
                message: "Profile picture updated successfully",
                status: Status.successful,
                user: userWithoutPassword
            });
        } catch (error: unknown) {
            console.error("Error updating profile picture:", error);
            res.status(500).json({
                message: "Failed to update profile picture",
                status: Status.failed
            });
        }
    }

    private get _updateProfilePictureRoute(): Router {
        return this.router.patch("/update-profile-picture", authenticate, this._updateProfilePictureController.bind(this));
    }

    public get updateProfilePictureRoute(): Router {
        return this._updateProfilePictureRoute;
    }
}
