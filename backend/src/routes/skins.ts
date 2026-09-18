import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { GAME } from '../services/gameConfig.js';
import { tryClaimDaily } from '../services/game.js';

export const skinsRouter = Router();

skinsRouter.post('/skins/daily', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const { claimed, amount } = tryClaimDaily(user);
  if (!claimed) return res.status(400).json({ error: 'not_available' });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { balance: { increment: amount }, lastDailyClaim: new Date() },
  });
  res.json({ ok: true, balance: updated.balance.toString(), amount: amount.toString() });
});

skinsRouter.post('/skins/banana/activate', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.activeSkin !== 'banana') return res.status(400).json({ error: 'skin_not_active' });

  const now = Date.now();
  if (user.bananaCooldownUntil && user.bananaCooldownUntil.getTime() > now) {
    return res.status(400).json({ error: 'cooldown' });
  }

  const banana = GAME.SKINS.banana;
  const boostDurationMs = banana.boostDurationMs ?? 15_000;
  const boostCooldownMs = banana.boostCooldownMs ?? 30 * 60_000;

  const boostUntil = new Date(now + boostDurationMs);
  const cooldownUntil = new Date(now + boostCooldownMs);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { bananaBoostUntil: boostUntil, bananaCooldownUntil: cooldownUntil },
  });
  res.json({ ok: true, boostUntil: updated.bananaBoostUntil, cooldownUntil: updated.bananaCooldownUntil });
});