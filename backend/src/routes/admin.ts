import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ENV } from '../env.js';

export const adminRouter = Router();

function isAdmin(tgId: bigint | undefined): boolean {
  if (!tgId) return false;
  const adminId = process.env.ADMIN_TG_ID;
  return !!adminId && tgId.toString() === adminId;
}

adminRouter.use((req, res, next) => {
  if (!isAdmin(req.tgId)) return res.status(403).json({ error: 'forbidden' });
  next();
});

const GrantSchema = z.object({
  username: z.string().min(1),
  days: z.number().int().min(1).max(3650).default(10),
});

/** POST /api/admin/grant-by-username — выдать подписку по @username. */
adminRouter.post('/grant-by-username', async (req, res) => {
  const parsed = GrantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const username = parsed.data.username.replace(/^@/, '').trim();
  const days = parsed.data.days;

  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });

  if (!user) return res.status(404).json({ error: 'user_not_found', username });

  const base = Math.max(Date.now(), user.subscriptionUntil?.getTime() ?? 0);
  const until = new Date(base + days * 86400000);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionUntil: until },
  });

  res.json({
    ok: true,
    user: {
      tgId: updated.tgId.toString(),
      username: updated.username,
      subscriptionUntil: updated.subscriptionUntil?.toISOString() ?? null,
      daysLeft: days,
    },
  });
});

/** GET /api/admin/whoami — проверка, что ты админ. */
adminRouter.get('/whoami', (req, res) => {
  res.json({ isAdmin: isAdmin(req.tgId), tgId: req.tgId?.toString() ?? null });
});
