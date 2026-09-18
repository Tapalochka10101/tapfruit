import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { buildTapContext, computeTaps } from '../services/game.js';
import { validateTapBatch } from '../services/antiCheat.js';
import { payReferralBonus } from '../services/referrals.js';

export const tapRouter = Router();

const TapSchema = z.object({
  startIdx: z.string().regex(/^\d+$/),
  endIdx: z.string().regex(/^\d+$/),
  count: z.number().int().positive().max(200),
});

tapRouter.post('/tap', async (req, res) => {
  const parsed = TapSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });
  const { startIdx, endIdx, count } = parsed.data;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });

  const check = validateTapBatch({
    count,
    startIdx: BigInt(startIdx),
    endIdx: BigInt(endIdx),
    serverTapIndex: user.tapIndex,
    nowMs: Date.now(),
    lastBatchAtMs: user.lastBatchAt?.getTime() ?? null,
  });

  if (!check.ok) {
    await prisma.tapLog.create({
      data: { userId: user.id, count, crits: 0, cps: check.cps, flagged: true, reason: check.reason },
    });
    return res.json({
      rejected: true,
      reason: check.reason,
      balance: user.balance.toString(),
      tapIndex: user.tapIndex.toString(),
      tapSeed: user.tapSeed.toString(),
    });
  }

  const ctx = buildTapContext(user, count);
  const result = computeTaps(ctx);
  const newBalance = user.balance + result.totalValue;
  const newTapIndex = BigInt(ctx.startIdx + count);
  const rotate = newTapIndex % 200n === 0n;
  const newSeed = rotate ? BigInt(Math.floor(Math.random() * 0xffffffff)) : user.tapSeed;

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        balance: newBalance,
        totalTaps: user.totalTaps + BigInt(count),
        tapIndex: rotate ? 0n : newTapIndex,
        tapSeed: newSeed,
        lastBatchAt: new Date(),
      },
    }),
    prisma.tapLog.create({
      data: { userId: user.id, count, crits: result.crits, cps: check.cps },
    }),
  ]);

  // 🤝 Реферальный бонус — не блокируем ответ, шлём асинхронно
  payReferralBonus(user.id, result.totalValue).catch(e => {
    console.error('[referral] bonus failed:', e);
  });

  res.json({
    balance: updated.balance.toString(),
    tapIndex: updated.tapIndex.toString(),
    tapSeed: updated.tapSeed.toString(),
    appliedValue: result.totalValue.toString(),
    crits: result.crits,
    rotated: rotate,
  });
});