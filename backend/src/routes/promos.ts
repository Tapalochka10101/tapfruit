import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  findPromoAsync,
  parseUsedPromos,
  serializeUsedPromos,
  getUsageCount,
  incrementUsage,
} from '../services/promos.js';

export const promosRouter = Router();

const RedeemSchema = z.object({
  code: z.string().min(1).max(50),
});

/** POST /api/promos/redeem — активировать промокод */
promosRouter.post('/promos/redeem', async (req, res) => {
  const parsed = RedeemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  // ===== СЕКРЕТНЫЙ ПРОМОКОД =====
  const normalized = parsed.data.code.trim().toLowerCase();
  if (normalized === 'durakdurak') {
    const u = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
    const used = parseUsedPromos(u.usedPromos);
    if (getUsageCount(used, 'durakdurak') > 0) {
      return res.json({
        ok: true, secret: true, already: true,
        balance: u.balance.toString(),
        label: 'Секретное меню уже открыто',
      });
    }
    const newUsed = incrementUsage(used, 'durakdurak');
    const upd = await prisma.user.update({
      where: { id: u.id },
      data: { usedPromos: serializeUsedPromos(newUsed) },
    });
    return res.json({
      ok: true, secret: true,
      balance: upd.balance.toString(),
      label: '🕹 Секретное меню разблокировано!',
    });
  }

  const promo = await findPromoAsync(parsed.data.code);
  if (!promo) return res.status(404).json({ error: 'invalid_promo' });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const used = parseUsedPromos(user.usedPromos);
  const usedCount = getUsageCount(used, promo.code);

  if (usedCount >= promo.maxUses) {
    return res.status(400).json({
      error: 'limit_reached',
      maxUses: promo.maxUses,
      usedCount,
    });
  }

  const newUsed = incrementUsage(used, promo.code);
  const newBalance = user.balance + promo.reward;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: newBalance,
      usedPromos: serializeUsedPromos(newUsed),
    },
  });

  res.json({
    ok: true,
    reward: promo.reward.toString(),
    balance: updated.balance.toString(),
    showImage: !!promo.showImage,
    usedCount: usedCount + 1,
    maxUses: promo.maxUses,
    label: promo.label,
  });
});

/** GET /api/promos/my — сколько раз юзер уже вводил каждый промо */
promosRouter.get('/promos/my', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const used = parseUsedPromos(user.usedPromos);
  res.json({ used });
});

promosRouter.get('/promos/secret-status', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const used = parseUsedPromos(user.usedPromos);
  res.json({ secretUnlocked: getUsageCount(used, 'durakdurak') > 0 });
});
