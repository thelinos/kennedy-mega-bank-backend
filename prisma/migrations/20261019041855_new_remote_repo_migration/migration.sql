-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PhoneVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhoneVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PhoneVerification" ("createdAt", "expiresAt", "id", "otp", "phoneNumber", "userId", "verified") SELECT "createdAt", "expiresAt", "id", "otp", "phoneNumber", "userId", "verified" FROM "PhoneVerification";
DROP TABLE "PhoneVerification";
ALTER TABLE "new_PhoneVerification" RENAME TO "PhoneVerification";
CREATE INDEX "PhoneVerification_userId_idx" ON "PhoneVerification"("userId");
CREATE INDEX "PhoneVerification_phoneNumber_idx" ON "PhoneVerification"("phoneNumber");
CREATE INDEX "PhoneVerification_otp_idx" ON "PhoneVerification"("otp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
