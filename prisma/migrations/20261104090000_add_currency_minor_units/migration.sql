ALTER TABLE "Account" RENAME COLUMN "balanceCents" TO "balanceMinorUnits";
ALTER TABLE "Account" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "Transaction" RENAME COLUMN "amountCents" TO "amountMinorUnits";
