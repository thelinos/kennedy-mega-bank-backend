import express, { Request, Response, Router } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { authenticate } from "../../../../../shared/middleware/auth.middleware.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";
import { UpdateNameRequestBody } from "../../../../../shared/types/model/data_types.ts";

export class UpdateName {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private async _updateNameController(req: Request<never, never, UpdateNameRequestBody>, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required",
                    status: Status.failed
                });
                return;
            }

            const { firstName, middleName, surname } = req.body;

            // Validate that at least one field is provided
            if (!firstName && !middleName && !surname) {
                res.status(400).json({
                    message: "At least one name field must be provided",
                    status: Status.failed
                });
                return;
            }

            // Validate string lengths if provided
            if (firstName && firstName.length < 2) {
                res.status(400).json({
                    message: "First name must be at least 2 characters",
                    status: Status.failed
                });
                return;
            }

            if (surname && surname.length < 2) {
                res.status(400).json({
                    message: "Surname must be at least 2 characters",
                    status: Status.failed
                });
                return;
            }

            if (middleName && middleName.length < 2) {
                res.status(400).json({
                    message: "Middle name must be at least 2 characters if provided",
                    status: Status.failed
                });
                return;
            }

            // Build update data object with only provided fields
            const updateData: { firstName?: string; middleName?: string; surname?: string } = {};
            if (firstName !== undefined) updateData.firstName = firstName;
            if (middleName !== undefined) updateData.middleName = middleName;
            if (surname !== undefined) updateData.surname = surname;

            // Update user credential with name
            const userCredential = await this.prismaClient.userCredential.upsert({
                where: { userId: req.user.userId },
                create: {
                    userId: req.user.userId,
                    ...updateData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                update: {
                    ...updateData,
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
                message: "Name updated successfully",
                status: Status.successful,
                user: userWithoutPassword
            });
        } catch (error: unknown) {
            console.error("Error updating name:", error);
            res.status(500).json({
                message: "Failed to update name",
                status: Status.failed
            });
        }
    }

    private get _updateNameRoute(): Router {
        return this.router.patch("/update-name", authenticate, this._updateNameController.bind(this));
    }

    public get updateNameRoute(): Router {
        return this._updateNameRoute;
    }
}
