import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { createPayment, TAPS_PER_RUB, MIN_RUB } from '../services/payments.js';

export const walletRouter = Router();

const DepositSchema = z.object({
  amountRub: z.number().int().min(MIN_RUB).max(100_000),
});

walletRouter.post('/wallet/deposit', async (req, res) => {
  const parsed = DepositSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const payment = await createPayment({ userId: req.userId!, amountRub: parsed.data.amountRub });

  res.json({
    paymentId: payment.id,
    amountRub: payment.amountRub,
    tapsAmount: payment.tapsAmount.toString(),
    status: payment.status,
    stubImageUrl: 'https://99px.ru/sstorage/53/2018/01/tmb_218546_200186.jpg',
    rate: TAPS_PER_RUB.toString(),
  });
});

walletRouter.get('/wallet/payments', async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ payments });
});