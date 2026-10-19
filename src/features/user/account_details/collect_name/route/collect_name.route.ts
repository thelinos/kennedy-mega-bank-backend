import express, { Request, Response, Router } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { authenticate } from "../../../../../shared/middleware/auth.middleware.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";
import { CollectNameRequestBody } from "../../../../../shared/types/model/data_types.ts";


export class CollectName {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private async _collectNameController(req: Request<never, never, CollectNameRequestBody>, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required",
                    status: Status.failed
                });
                return;
            }

            const { firstName, middleName, surname } = req.body;

            // Validate required fields
            if (!firstName || !surname) {
                res.status(400).json({
                    message: "First name and surname are required",
                    status: Status.failed
                });
                return;
            }

            // Validate string lengths
            if (firstName.length < 2 || surname.length < 2) {
                res.status(400).json({
                    message: "First name and surname must be at least 2 characters",
                    status: Status.failed
                });
                return;
            }

            // Validate middle name if provided
            if (middleName && middleName.length < 2) {
                res.status(400).json({
                    message: "Middle name must be at least 2 characters if provided",
                    status: Status.failed
                });
                return;
            }

            // Check if user already provided name
            const existingCredential = await this.prismaClient.userCredential.findUnique({
                where: { userId: req.user?.userId }
            });

            if (existingCredential?.firstName && existingCredential?.surname) {
                res.status(400).json({
                    message: "Name has already been provided",
                    status: Status.failed
                });
                return;
            }

            // Create or update user credential with name
            const userCredential = await this.prismaClient.userCredential.upsert({
                where: { userId: req.user.userId },
                create: {
                    userId: req.user.userId,
                    firstName,
                    middleName,
                    surname,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                update: {
                    firstName,
                    middleName,
                    surname,
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
                message: "Name collected successfully",
                status: Status.successful,
                user: userWithoutPassword
            });
        } catch (error: unknown) {
            console.error("Error collecting name:", error);
            res.status(500).json({
                message: "Failed to collect name",
                status: Status.failed
            });
        }
    }

    private get _collectNameRoute(): Router {
        return this.router.post("/collect-name", authenticate, this._collectNameController.bind(this));
    }

    public get collectNameRoute(): Router {
        return this._collectNameRoute;
    }
}
