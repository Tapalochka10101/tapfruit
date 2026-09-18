-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tgId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "chips" BIGINT NOT NULL DEFAULT 0,
    "totalTaps" BIGINT NOT NULL DEFAULT 0,
    "upgradeLevel" INTEGER NOT NULL DEFAULT 0,
    "maxUpgradeLevel" INTEGER NOT NULL DEFAULT 0,
    "activeSkin" TEXT,
    "generators" TEXT NOT NULL DEFAULT '[]',
    "lastPassiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrerId" TEXT,
    "referralEarnings" BIGINT NOT NULL DEFAULT 0,
    "usedPromos" TEXT NOT NULL DEFAULT '[]',
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyClaim" DATETIME,
    "totalCasesOpened" INTEGER NOT NULL DEFAULT 0,
    "bananaBoostUntil" DATETIME,
    "bananaCooldownUntil" DATETIME,
    "tapSeed" BIGINT NOT NULL DEFAULT 1,
    "tapIndex" BIGINT NOT NULL DEFAULT 0,
    "lastBatchAt" DATETIME,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("activeSkin", "balance", "bananaBoostUntil", "bananaCooldownUntil", "chips", "createdAt", "firstName", "flagged", "generators", "id", "lastBatchAt", "lastDailyClaim", "lastPassiveAt", "maxUpgradeLevel", "referralEarnings", "referrerId", "settings", "tapIndex", "tapSeed", "tgId", "totalTaps", "updatedAt", "upgradeLevel", "usedPromos", "username") SELECT "activeSkin", "balance", "bananaBoostUntil", "bananaCooldownUntil", "chips", "createdAt", "firstName", "flagged", "generators", "id", "lastBatchAt", "lastDailyClaim", "lastPassiveAt", "maxUpgradeLevel", "referralEarnings", "referrerId", "settings", "tapIndex", "tapSeed", "tgId", "totalTaps", "updatedAt", "upgradeLevel", "usedPromos", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_tgId_key" ON "User"("tgId");
CREATE INDEX "User_tgId_idx" ON "User"("tgId");
CREATE INDEX "User_referrerId_idx" ON "User"("referrerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
