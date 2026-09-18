import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { GAME } from '../services/gameConfig.js';

export const shopRouter = Router();

const BuySchema = z.object({
  itemType: z.enum(['upgrade', 'skin']),
  itemId: z.string(),
});

shopRouter.post('/shop/buy', async (req, res) => {
  const parsed = BuySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });
  const { itemType, itemId } = parsed.data;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });

  if (itemType === 'upgrade') {
    const upgrade = GAME.UPGRADES.find(u => u.id === itemId);
    if (!upgrade) return res.status(404).json({ error: 'no_such_upgrade' });

    // ✅ Случай 1: уровень уже когда-то куплен (maxUpgradeLevel ≥ level) — просто переключаемся
    if (upgrade.level <= user.maxUpgradeLevel) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { upgradeLevel: upgrade.level },
      });
      return res.json({
        ok: true,
        balance: updated.balance.toString(),
        upgradeLevel: updated.upgradeLevel,
        maxUpgradeLevel: updated.maxUpgradeLevel,
        switched: true,
      });
    }

    // Случай 2: покупка нового уровня
    if (user.balance < upgrade.price) return res.status(400).json({ error: 'insufficient_funds' });

    // ✅ Проверяем, есть ли уже Purchase для этого itemId (защита от дубликата)
    const existingPurchase = await prisma.purchase.findUnique({
      where: { userId_itemType_itemId: { userId: user.id, itemType: 'upgrade', itemId } },
    });

    // Если Purchase уже есть — не создаём (был баг), только обновляем юзера
    const txs = [
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: upgrade.price },
          upgradeLevel: upgrade.level,
          maxUpgradeLevel: upgrade.level,
        },
      }),
    ];
    if (!existingPurchase) {
      txs.push(
        prisma.purchase.create({
          data: { userId: user.id, itemType, itemId, price: upgrade.price },
        }) as any
      );
    }

    const [updated] = await prisma.$transaction(txs);

    return res.json({
      ok: true,
      balance: updated.balance.toString(),
      upgradeLevel: updated.upgradeLevel,
      maxUpgradeLevel: updated.maxUpgradeLevel,
    });
  }

  // Skin
  if (!GAME.isSkinId(itemId)) return res.status(404).json({ error: 'no_such_skin' });
  const skin = GAME.SKINS[itemId];

  const existing = await prisma.purchase.findUnique({
    where: { userId_itemType_itemId: { userId: user.id, itemType: 'skin', itemId } },
  });
  if (existing) return res.status(400).json({ error: 'already_owned' });
  if (user.balance < skin.price) return res.status(400).json({ error: 'insufficient_funds' });

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: skin.price }, activeSkin: itemId },
    }),
    prisma.purchase.create({
      data: { userId: user.id, itemType: 'skin', itemId, price: skin.price },
    }),
  ]);
  res.json({ ok: true, balance: updated.balance.toString(), activeSkin: updated.activeSkin });
});

const EquipSchema = z.object({ skinId: z.string().nullable() });

shopRouter.post('/skins/equip', async (req, res) => {
  const parsed = EquipSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });
  const { skinId } = parsed.data;

  if (skinId !== null) {
    if (!GAME.isSkinId(skinId)) return res.status(404).json({ error: 'no_such_skin' });
    const owned = await prisma.purchase.findUnique({
      where: { userId_itemType_itemId: { userId: req.userId!, itemType: 'skin', itemId: skinId } },
    });
    if (!owned) return res.status(400).json({ error: 'not_owned' });
  }

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: { activeSkin: skinId },
  });
  res.json({ ok: true, activeSkin: updated.activeSkin });
});