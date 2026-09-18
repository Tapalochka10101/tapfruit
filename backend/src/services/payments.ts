import { prisma } from '../lib/prisma.js';

export const TAPS_PER_RUB = 50n;
export const MIN_RUB = 50;

export async function createPayment(args: { userId: string; amountRub: number }) {
  const tapsAmount = BigInt(args.amountRub) * TAPS_PER_RUB;
  return prisma.payment.create({
    data: {
      userId: args.userId,
      amountRub: args.amountRub,
      tapsAmount,
      status: 'pending',
      provider: 'sbp_stub',
    },
  });
}

export async function markPaymentPaid(paymentId: string, externalId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === 'paid') return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'paid', paidAt: new Date(), externalId },
    }),
    prisma.user.update({
      where: { id: payment.userId },
      data: { balance: { increment: payment.tapsAmount } },
    }),
  ]);
}