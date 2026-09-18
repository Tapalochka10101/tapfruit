import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { parseGenerators, totalTapsPerMinute, pendingPassive } from '../services/generators.js';
import { GAME } from '../services/gameConfig.js';
import { mskDate } from '../lib/msk.js';

export const authRouter = Router();

authRouter.get('/me', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const purchases = await prisma.purchase.findMany({ where: { userId: user.id } });

  const owned = parseGenerators(user.generators);
  const rate = totalTapsPerMinute(owned);
  const pending = pendingPassive(user);

  const referredCount = await prisma.user.count({ where: { referrerId: user.id } });

  // 📅 может ли забрать стрик
  const canClaimDaily =
    !user.lastDailyClaim || mskDate(user.lastDailyClaim) !== mskDate(new Date());

  res.json({
    user: {
      tgId: user.tgId.toString(),
      username: user.username,
      balance: user.balance.toString(),
      chips: user.chips.toString(),
      totalTaps: user.totalTaps.toString(),
      upgradeLevel: user.upgradeLevel,
      maxUpgradeLevel: user.maxUpgradeLevel,
      activeSkin: user.activeSkin,
      ownedSkins: purchases.filter(p => p.itemType === 'skin').map(p => p.itemId),
      generators: owned,
      generatorRate: rate,
      pendingPassive: pending.toString(),
      referralEarnings: user.referralEarnings.toString(),
      referredCount,
      dailyStreak: user.dailyStreak,
      canClaimDaily,
      totalCasesOpened: user.totalCasesOpened,
      lastDailyClaim: user.lastDailyClaim?.toISOString() ?? null,
      bananaBoostUntil: user.bananaBoostUntil?.toISOString() ?? null,
      bananaCooldownUntil: user.bananaCooldownUntil?.toISOString() ?? null,
      tapSeed: user.tapSeed.toString(),
      tapIndex: user.tapIndex.toString(),
      settings: JSON.parse(user.settings || '{}'),
      createdAt: user.createdAt.toISOString(),
      now: Date.now(),
    },
  });
});