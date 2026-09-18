import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { createPayment } from '../services/payments.js';

export const walletRouter = Router();

const DepositSchema = z.object({
  amountRub: z.number().int().min(100).max(100_000),
});

/** POST /api/wallet/deposit — создать платёж. */
walletRouter.post('/wallet/deposit', async (req, res) => {
  const parsed = DepositSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload', min: 100 });

  const payment = await createPayment({
    userId: req.userId!,
    amountRub: parsed.data.amountRub,
  });

  res.json({
    paymentId: payment.id,
    amountRub: payment.amountRub,
    status: payment.status,
    payUrl: '/payments/stub/' + payment.id,
    stubImageUrl: 'https://99px.ru/sstorage/53/2018/01/tmb_218546_200186.jpg',
  });
});

/** GET /api/wallet/payments — история. */
walletRouter.get('/wallet/payments', async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ payments });
});
