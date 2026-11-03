import express, { Request, Response, Router } from "express";
import { getPrismaClient } from "../../../../shared/database/prisma.ts";
import { authenticate } from "../../../../shared/middleware/auth.middleware.ts";
import { ledgerRateLimit } from "../../../../shared/middleware/rate-limit.middleware.ts";
import Status from "../../../../shared/types/enums/status.enum.ts";
import { ACCOUNT_TYPES, MoneyUtil } from "../../../../shared/utils/money.util.ts";

interface CreateAccountRequestBody {
    accountType: string;
    currency?: string;
}

export class CreateAccount {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private async _createAccountController(req: Request<never, never, CreateAccountRequestBody>, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required",
                    status: Status.failed
                });
                return;
            }

            const { accountType } = req.body;
            const currency = req.body.currency ?? 'USD';

            if (!MoneyUtil.isAccountType(accountType)) {
                res.status(400).json({
                    message: `accountType must be one of: ${ACCOUNT_TYPES.join(', ')}`,
                    status: Status.failed
                });
                return;
            }

            if (MoneyUtil.currencyDigits(currency) === null) {
                res.status(400).json({
                    message: "currency must be a supported ISO 4217 currency code",
                    status: Status.failed
                });
                return;
            }

            const account = await this.prismaClient.account.create({
                data: {
                    userId: req.user.userId,
                    accountType,
                    balanceMinorUnits: 0n,
                    currency,
                }
            });

            res.status(201).json({
                message: "Account created successfully",
                status: Status.successful,
                account: {
                    id: account.id,
                    userId: account.userId,
                    accountType: account.accountType,
                    balance: MoneyUtil.formatAmount(account.balanceMinorUnits, account.currency),
                    currency: account.currency,
                    createdAt: account.createdAt,
                    updatedAt: account.updatedAt,
                },
            });
        } catch (error: unknown) {
            console.error("Error creating account:", error);
            res.status(500).json({
                message: "Failed to create account",
                status: Status.failed
            });
        }
    }

    private get _createAccountRoute(): Router {
        return this.router.post("/", authenticate, ledgerRateLimit, this._createAccountController.bind(this));
    }

    public get createAccountRoute(): Router {
        return this._createAccountRoute;
    }
}
