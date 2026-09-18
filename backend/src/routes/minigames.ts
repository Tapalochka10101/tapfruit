import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const minigamesRouter = Router();

const CHIPS_PER_TAP = 100n;
const MIN_BET = 10;
const MAX_BET = 500;

// 🎲 Шансы
const WIN_CHANCE = 0.30;   // 30% выигрыш
const LOSE_CHANCE = 0.70;  // 70% проигрыш

const BuyChipsSchema = z.object({
  taps: z.number().int().positive().max(100_000_000),
});

minigamesRouter.post('/minigames/buy-chips', async (req, res) => {
  const parsed = BuyChipsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const tapsCost = BigInt(parsed.data.taps);
  if (tapsCost % CHIPS_PER_TAP !== 0n) {
    return res.status(400).json({ error: 'must_be_multiple_of_100' });
  }
  const chipsToGive = tapsCost / CHIPS_PER_TAP;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.balance < tapsCost) return res.status(400).json({ error: 'insufficient_funds' });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: { decrement: tapsCost },
      chips: { increment: chipsToGive },
    },
  });
  res.json({ ok: true, balance: updated.balance.toString(), chips: updated.chips.toString() });
});

const SellChipsSchema = z.object({
  chips: z.number().int().positive().max(1_000_000),
});

minigamesRouter.post('/minigames/sell-chips', async (req, res) => {
  const parsed = SellChipsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const chipsCost = BigInt(parsed.data.chips);
  const tapsToGive = chipsCost * CHIPS_PER_TAP;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.chips < chipsCost) return res.status(400).json({ error: 'insufficient_chips' });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { chips: { decrement: chipsCost }, balance: { increment: tapsToGive } },
  });
  res.json({ ok: true, balance: updated.balance.toString(), chips: updated.chips.toString() });
});

const PlaySchema = z.object({
  gameId: z.string(),
  bet: z.number().int().min(MIN_BET).max(MAX_BET),
  choice: z.string(),
});

/** 🎲 30% выигрыш ×2, 70% проигрыш −bet */
minigamesRouter.post('/minigames/play', async (req, res) => {
  const parsed = PlaySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const { gameId, bet, choice } = parsed.data;
  if (choice !== 'A' && choice !== 'B') {
    return res.status(400).json({ error: 'choice_must_be_A_or_B' });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.chips < BigInt(bet)) return res.status(400).json({ error: 'insufficient_chips' });

  const roll = Math.random();
  const won = roll < WIN_CHANCE;

  const serverResult: 'A' | 'B' = won
    ? (choice as 'A' | 'B')
    : (choice === 'A' ? 'B' : 'A');

  let detail = '';
  const isA = serverResult === 'A';
  switch (gameId) {
    case 'dice':      detail = isA ? 'Выпало чётное' : 'Выпало нечётное'; break;
    case 'coin':      detail = isA ? '🪙 Орёл' : '🪙 Решка'; break;
    case 'cards':     detail = isA ? '🟥 Красная карта' : '⬛ Чёрная карта'; break;
    case 'dart':      detail = isA ? '🎯 Попал в цель!' : '💨 Промах'; break;
    case 'number':    detail = isA ? 'Выпало 1-5' : 'Выпало 6-10'; break;
    case 'rainbow':   detail = isA ? '🔥 Тёплый оттенок' : '❄️ Холодный оттенок'; break;
    case 'snail':     detail = isA ? '🐢 Левая быстрее' : '🐢 Правая быстрее'; break;
    case 'lightning': detail = isA ? '⚡ Молния ударила!' : '☁️ Молния ушла в сторону'; break;
    case 'clover':    detail = isA ? '🍀 Нашёл клевер!' : '🌿 Обычная трава'; break;
    case 'star':      detail = isA ? '⭐ Упала звезда' : '🌠 Звезда улетела'; break;
    default:          detail = isA ? 'A' : 'B';
  }

  const chipsDelta = won ? BigInt(bet * 2) : -BigInt(bet);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { chips: { increment: chipsDelta } },
  });

  res.json({
    ok: true,
    won,
    result: serverResult,
    detail,
    roll: roll.toFixed(4),
    chips: updated.chips.toString(),
    delta: Number(chipsDelta),
  });
});

minigamesRouter.get('/minigames/me', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  res.json({
    chips: user.chips.toString(),
    balance: user.balance.toString(),
    rate: CHIPS_PER_TAP.toString(),
  });
});