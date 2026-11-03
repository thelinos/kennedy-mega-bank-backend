import { createHash } from 'node:crypto';
import express, { Request, Response, Router } from "express";
import { getPrismaClient } from "../../../../shared/database/prisma.ts";
import { authenticate } from "../../../../shared/middleware/auth.middleware.ts";
import { ledgerRateLimit } from "../../../../shared/middleware/rate-limit.middleware.ts";
import Status from "../../../../shared/types/enums/status.enum.ts";
import { MAX_MINOR_UNITS, MoneyUtil, TRANSACTION_TYPES } from "../../../../shared/utils/money.util.ts";

interface CreateTransactionRequestBody {
    accountId: string;
    amount: number | string;
    type: string;
    description?: string;
}

interface TransactionResponse {
    message: string;
    status: number;
    account: {
        id: string;
        userId: string;
        accountType: string;
        balance: string;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
    };
    transaction: {
        id: string;
        accountId: string;
        amount: string;
        currency: string;
        type: string;
        description: string | null;
        createdAt: Date;
    };
}

class LedgerError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = 'LedgerError';
    }
}

const isPrismaUniqueViolation = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002';

export class CreateTransaction {
    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private async _createTransactionController(req: Request<never, never, CreateTransactionRequestBody>, res: Response): Promise<void> {
        let requestHash: string | null = null;
        const idempotencyKey = req.get('Idempotency-Key');

        try {
            if (!req.user) {
                res.status(401).json({
                    message: "Authentication required",
                    status: Status.failed
                });
                return;
            }

            if (!idempotencyKey || !/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
                res.status(400).json({
                    message: "A valid Idempotency-Key header is required",
                    status: Status.failed
                });
                return;
            }

            const { accountId, type, description } = req.body;
            if (typeof accountId !== 'string' || accountId.trim().length === 0) {
                res.status(400).json({
                    message: "accountId is required",
                    status: Status.failed
                });
                return;
            }

            if (description !== undefined && (typeof description !== 'string' || description.length > 256)) {
                res.status(400).json({
                    message: "description must be a string of at most 256 characters",
                    status: Status.failed
                });
                return;
            }

            if (!MoneyUtil.isTransactionType(type)) {
                res.status(400).json({
                    message: `type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
                    status: Status.failed
                });
                return;
            }

            const userId = req.user.userId;
            const creditOperators = new Set(
                (process.env.LEDGER_CREDIT_USER_IDS ?? '')
                    .split(',')
                    .map((id) => id.trim())
                    .filter(Boolean)
            );
            const canCredit = type === 'credit' && creditOperators.has(userId);

            if (type === 'credit' && !canCredit) {
                res.status(403).json({
                    message: "Credit transactions require an authorized ledger operator",
                    status: Status.failed
                });
                return;
            }

            const result = await this.prismaClient.$transaction(async (tx) => {
                const account = await tx.account.findUnique({
                    where: { id: accountId }
                });

                if (!account || (account.userId !== userId && !canCredit)) {
                    throw new LedgerError("Account not found", 404);
                }

                const amount = MoneyUtil.parsePositiveAmount(req.body.amount, account.currency);
                if (amount === null) {
                    throw new LedgerError(`amount must be greater than 0 and use ${account.currency}'s minor-unit precision`, 400);
                }

                requestHash = createHash('sha256')
                    .update(JSON.stringify({
                        accountId,
                        amountMinorUnits: amount.toString(),
                        type,
                        description: description ?? null,
                    }))
                    .digest('hex');

                const existing = await tx.idempotencyRecord.findUnique({
                    where: {
                        userId_key: {
                            userId,
                            key: idempotencyKey,
                        }
                    }
                });

                if (existing) {
                    if (existing.requestHash !== requestHash) {
                        throw new LedgerError("Idempotency-Key was already used with a different request", 409);
                    }
                    if (!existing.responseJson) {
                        throw new LedgerError("An identical request is still being processed", 409);
                    }
                    return JSON.parse(existing.responseJson) as TransactionResponse;
                }

                const record = await tx.idempotencyRecord.create({
                    data: {
                        userId,
                        key: idempotencyKey,
                        requestHash,
                    }
                });

                if (type === 'credit') {
                    const credit = await tx.account.updateMany({
                        where: {
                            id: accountId,
                            balanceMinorUnits: { lte: MAX_MINOR_UNITS - amount }
                        },
                        data: { balanceMinorUnits: { increment: amount } }
                    });
                    if (credit.count === 0) {
                        throw new LedgerError("Credit exceeds the supported balance limit", 400);
                    }
                } else {
                    const debit = await tx.account.updateMany({
                        where: {
                            id: accountId,
                            userId,
                            balanceMinorUnits: { gte: amount }
                        },
                        data: { balanceMinorUnits: { decrement: amount } }
                    });

                    if (debit.count === 0) {
                        throw new LedgerError("Insufficient funds", 400);
                    }
                }

                const updatedAccount = await tx.account.findUniqueOrThrow({
                    where: { id: accountId }
                });

                const transaction = await tx.transaction.create({
                    data: {
                        accountId,
                        amountMinorUnits: amount,
                        type,
                        description: description || null,
                    }
                });

                const body: TransactionResponse = {
                    message: "Transaction created successfully",
                    status: Status.successful,
                    account: {
                        id: updatedAccount.id,
                        userId: updatedAccount.userId,
                        accountType: updatedAccount.accountType,
                        balance: MoneyUtil.formatAmount(updatedAccount.balanceMinorUnits, updatedAccount.currency),
                        currency: updatedAccount.currency,
                        createdAt: updatedAccount.createdAt,
                        updatedAt: updatedAccount.updatedAt,
                    },
                    transaction: {
                        id: transaction.id,
                        accountId: transaction.accountId,
                        amount: MoneyUtil.formatAmount(transaction.amountMinorUnits, updatedAccount.currency),
                        currency: updatedAccount.currency,
                        type: transaction.type,
                        description: transaction.description,
                        createdAt: transaction.createdAt,
                    },
                };

                await tx.idempotencyRecord.update({
                    where: { id: record.id },
                    data: { responseJson: JSON.stringify(body) }
                });

                return body;
            });

            res.status(201).json(result);
        } catch (error: unknown) {
            if (error instanceof LedgerError) {
                res.status(error.statusCode).json({
                    message: error.message,
                    status: Status.failed
                });
                return;
            }

            if (isPrismaUniqueViolation(error) && requestHash && req.user && idempotencyKey) {
                try {
                    const existing = await this.prismaClient.idempotencyRecord.findUnique({
                        where: {
                            userId_key: {
                                userId: req.user.userId,
                                key: idempotencyKey,
                            }
                        }
                    });
                    if (existing?.responseJson) {
                        if (existing.requestHash !== requestHash) {
                            res.status(409).json({
                                message: "Idempotency-Key was already used with a different request",
                                status: Status.failed
                            });
                            return;
                        }
                        res.status(201).json(JSON.parse(existing.responseJson) as TransactionResponse);
                        return;
                    }
                } catch (replayError) {
                    console.error("Error reading idempotent transaction result:", replayError);
                    res.status(500).json({
                        message: "Failed to verify transaction result",
                        status: Status.failed
                    });
                    return;
                }
            }

            console.error("Error creating transaction:", error);
            res.status(500).json({
                message: "Failed to create transaction",
                status: Status.failed
            });
        }
    }

    private get _createTransactionRoute(): Router {
        return this.router.post("/", authenticate, ledgerRateLimit, this._createTransactionController.bind(this));
    }

    public get createTransactionRoute(): Router {
        return this._createTransactionRoute;
    }
}
