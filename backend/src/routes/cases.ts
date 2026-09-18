import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { CASES, getCase } from '../services/cases.js';
import { GAME } from '../services/gameConfig.js';

export const casesRouter = Router();

casesRouter.get('/cases', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const owned = await prisma.purchase.findMany({
    where: { userId: user.id, itemType: 'skin' },
  });
  const ownedSkins = owned.map(p => p.itemId);

  res.json({
    balance: user.balance.toString(),
    chips: user.chips.toString(),
    ownedSkins,
    catalog: CASES.map(c => ({
      id: c.id,
      label: c.label,
      emoji: c.emoji,
      price: c.price.toString(),
      color: c.color,
    })),
  });
});

const OpenSchema = z.object({ caseId: z.string() });

casesRouter.post('/cases/open', async (req, res) => {
  const parsed = OpenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const box = getCase(parsed.data.caseId);
  if (!box) return res.status(404).json({ error: 'no_such_case' });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.balance < box.price) return res.status(400).json({ error: 'insufficient_funds' });

  const prize = box.roll();

  let newBalance = user.balance - box.price;
  let newChips = user.chips;
  let newSkin: string | null = null;
  let skinAlreadyOwned = false;

  if (prize.kind === 'taps') {
    newBalance += prize.amount;
  } else if (prize.kind === 'chips') {
    newChips += prize.amount;
  } else if (prize.kind === 'skin') {
    // Проверяем есть ли уже
    const existing = await prisma.purchase.findUnique({
      where: { userId_itemType_itemId: { userId: user.id, itemType: 'skin', itemId: prize.skinId } },
    });
    if (existing) {
      // Компенсация тапсами = 30% от цены скина
      const skinDef = GAME.SKINS[prize.skinId as keyof typeof GAME.SKINS];
      const compensate = skinDef ? skinDef.price * 30n / 100n : 100_000n;
      newBalance += compensate;
      skinAlreadyOwned = true;
    } else {
      await prisma.purchase.create({
        data: { userId: user.id, itemType: 'skin', itemId: prize.skinId, price: 0n },
      });
      newSkin = prize.skinId;
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: newBalance,
      chips: newChips,
      totalCasesOpened: { increment: 1 },
    },
  });

  res.json({
    ok: true,
    prize: prize.kind === 'taps' ? { kind: 'taps', amount: prize.amount.toString() }
         : prize.kind === 'chips' ? { kind: 'chips', amount: prize.amount.toString() }
         : { kind: 'skin', skinId: prize.skinId, alreadyOwned: skinAlreadyOwned },
    balance: updated.balance.toString(),
    chips: updated.chips.toString(),
  });
});