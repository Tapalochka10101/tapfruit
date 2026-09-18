-- 💳 Add subscription fields
ALTER TABLE "User" ADD COLUMN "balanceRub" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "subscriptionUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastChargeAt" TIMESTAMP(3);

-- 🎰 Remove cases field
ALTER TABLE "User" DROP COLUMN "totalCasesOpened";
