import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { GAME } from '../services/gameConfig.js';
import {
  parseGenerators,
  serializeGenerators,
  totalTapsPerMinute,
  pendingPassive,
  maxCappedPassive,
  addGenerator,
  collectBonusFor,
} from '../services/generators.js';

export const generatorsRouter = Router();

/** GET /api/generators — список купленных + пассив */
generatorsRouter.get('/generators', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const owned = parseGenerators(user.generators);
  const rate = totalTapsPerMinute(owned);
  const pending = pendingPassive(user);
  const cap = maxCappedPassive(owned, user.activeSkin);

  const skinDef: any = user.activeSkin ? (GAME.SKINS as any)[user.activeSkin] : null;
  const discount: number = skinDef?.generatorDiscount ?? 0;
  const capMs = skinDef?.offlineCapHours ? skinDef.offlineCapHours * 3_600_000 : GAME.MAX_OFFLINE_MS;

  const now = Date.now();
  const last = user.lastPassiveAt?.getTime() ?? now;
  const elapsed = now - last;
  const filledUntilFull = Math.max(0, capMs - elapsed);

  res.json({
    owned,
    rate,
    pending: pending.toString(),
    cap: cap.toString(),
    msUntilFull: filledUntilFull,
    maxOfflineMs: capMs,
    discount,
    catalog: GAME.GENERATORS.map((g: { id: string; label: string; emoji: string; price: bigint; tapsPerMin: number }) => ({
      id: g.id,
      label: g.label,
      emoji: g.emoji,
      price: discount > 0
        ? ((g.price * BigInt(Math.round((1 - discount) * 100))) / 100n).toString()
        : g.price.toString(),
      basePrice: g.price.toString(),
      tapsPerMin: g.tapsPerMin,
    })),
  });
});

const BuySchema = z.object({ generatorId: z.string() });

/** POST /api/generators/buy — купить генератор */
generatorsRouter.post('/generators/buy', async (req, res) => {
  const parsed = BuySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const gen = GAME.getGenerator(parsed.data.generatorId);
  if (!gen) return res.status(404).json({ error: 'no_such_generator' });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });

  const skinDef: any = user.activeSkin ? (GAME.SKINS as any)[user.activeSkin] : null;
  const discount: number = skinDef?.generatorDiscount ?? 0;
  const price = discount > 0
    ? (gen.price * BigInt(Math.round((1 - discount) * 100))) / 100n
    : gen.price;

  if (user.balance < price) return res.status(400).json({ error: 'insufficient_funds' });

  const owned = parseGenerators(user.generators);
  const next = addGenerator(owned, gen.id);

  const pending = pendingPassive(user);
  const newBalance = user.balance - price + pending;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: newBalance,
      generators: serializeGenerators(next),
      lastPassiveAt: new Date(),
    },
  });

  const rateNow = totalTapsPerMinute(next);

  res.json({
    ok: true,
    balance: updated.balance.toString(),
    generators: next,
    rate: rateNow,
  });
});

/** POST /api/generators/collect — собрать накопленное */
generatorsRouter.post('/generators/collect', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const pending = pendingPassive(user);

  const bonus = collectBonusFor(user.activeSkin);
  const collected = bonus > 0
    ? (pending * BigInt(100 + Math.round(bonus * 100))) / 100n
    : pending;

  const newBalance = user.balance + collected;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: newBalance,
      lastPassiveAt: new Date(),
    },
  });

  res.json({
    ok: true,
    collected: collected.toString(),
    bonus,
    balance: updated.balance.toString(),
  });
});