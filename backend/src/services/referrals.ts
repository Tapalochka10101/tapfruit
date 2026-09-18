import { prisma } from '../lib/prisma.js';

// 5% от всех тапов приглашённого идёт пригласившему
export const REFERRAL_PERCENT = 0.05;

/**
 * Начисляет реферальный бонус пригласившему, когда приглашённый тапает.
 * Не блокирует основной tap — работает асинхронно через await.
 */
export async function payReferralBonus(referredUserId: string, tapsEarned: bigint) {
  if (tapsEarned <= 0n) return;

  const referred = await prisma.user.findUnique({
    where: { id: referredUserId },
    select: { referrerId: true },
  });

  if (!referred?.referrerId) return;

  const bonus = BigInt(Math.floor(Number(tapsEarned) * REFERRAL_PERCENT));
  if (bonus <= 0n) return;

  await prisma.user.update({
    where: { id: referred.referrerId },
    data: {
      balance: { increment: bonus },
      referralEarnings: { increment: bonus },
    },
  });
}