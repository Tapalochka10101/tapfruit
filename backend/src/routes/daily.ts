import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { GAME } from '../services/gameConfig.js';
import { mskDate } from '../lib/msk.js';

export const dailyRouter = Router();

/** Проверка — можно ли забрать сегодня */
function canClaimToday(lastClaim: Date | null): boolean {
  if (!lastClaim) return true;
  return mskDate(lastClaim) !== mskDate(new Date());
}

/** Был ли последний клейм вчера (для стрика) */
function wasYesterday(lastClaim: Date | null): boolean {
  if (!lastClaim) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return mskDate(lastClaim) === mskDate(yesterday);
}

dailyRouter.get('/daily/status', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });

  const canClaim = canClaimToday(user.lastDailyClaim);
  const currentStreak = user.dailyStreak;
  const nextStreak = canClaim
    ? (wasYesterday(user.lastDailyClaim) ? Math.min(currentStreak + 1, 7) : 1)
    : currentStreak;

  const reward = GAME.DAILY_STREAK.find(d => d.day === nextStreak)?.reward ?? 1_000n;

  res.json({
    canClaim,
    currentStreak,
    nextStreak,
    nextReward: reward.toString(),
    streakTable: GAME.DAILY_STREAK.map(d => ({ day: d.day, reward: d.reward.toString() })),
  });
});

dailyRouter.post('/daily/claim', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });

  if (!canClaimToday(user.lastDailyClaim)) {
    return res.status(400).json({ error: 'already_claimed' });
  }

  const newStreak = wasYesterday(user.lastDailyClaim)
    ? Math.min(user.dailyStreak + 1, 7)
    : 1;

  // Если стрик уже 7 — циклически возвращаемся к 1 после получения 7-го
  const actualStreak = (newStreak > 7) ? 1 : newStreak;

  const reward = GAME.DAILY_STREAK.find(d => d.day === actualStreak)?.reward ?? 1_000n;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: user.balance + reward,
      dailyStreak: actualStreak === 7 ? 7 : actualStreak,
      lastDailyClaim: new Date(),
    },
  });

  res.json({
    ok: true,
    reward: reward.toString(),
    streak: actualStreak,
    balance: updated.balance.toString(),
  });
});