import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { bot } from '../bot.js';

export const referralsRouter = Router();

/** GET /api/referrals — ссылка + статистика */
referralsRouter.get('/referrals', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });

  const referredCount = await prisma.user.count({ where: { referrerId: user.id } });

  const username = (bot as any)?.botInfo?.username ?? 'TapFruit_bot';
  const link = `https://t.me/${username}?start=ref_${user.tgId.toString()}`;

  res.json({
    link,
    referredCount,
    earnings: user.referralEarnings.toString(),
    percent: 5,
  });
});