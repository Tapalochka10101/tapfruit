import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const settingsRouter = Router();

const SettingsSchema = z.object({ settings: z.record(z.any()) });

settingsRouter.post('/settings', async (req, res) => {
  const parsed = SettingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });
  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: { settings: JSON.stringify(parsed.data.settings) },
  });
  res.json({ ok: true, settings: JSON.parse(updated.settings) });
});

settingsRouter.delete('/account', async (req, res) => {
  await prisma.user.delete({ where: { id: req.userId! } });
  res.json({ ok: true });
});