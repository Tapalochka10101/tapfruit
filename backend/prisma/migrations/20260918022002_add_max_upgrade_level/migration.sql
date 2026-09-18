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
    "lastDailyClaim" DATETIME,
    "bananaBoostUntil" DATETIME,
    "bananaCooldownUntil" DATETIME,
    "tapSeed" BIGINT NOT NULL DEFAULT 1,
    "tapIndex" BIGINT NOT NULL DEFAULT 0,
    "lastBatchAt" DATETIME,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("activeSkin", "balance", "bananaBoostUntil", "bananaCooldownUntil", "chips", "createdAt", "firstName", "flagged", "id", "lastBatchAt", "lastDailyClaim", "settings", "tapIndex", "tapSeed", "tgId", "totalTaps", "updatedAt", "upgradeLevel", "username") SELECT "activeSkin", "balance", "bananaBoostUntil", "bananaCooldownUntil", "chips", "createdAt", "firstName", "flagged", "id", "lastBatchAt", "lastDailyClaim", "settings", "tapIndex", "tapSeed", "tgId", "totalTaps", "updatedAt", "upgradeLevel", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_tgId_key" ON "User"("tgId");
CREATE INDEX "User_tgId_idx" ON "User"("tgId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
