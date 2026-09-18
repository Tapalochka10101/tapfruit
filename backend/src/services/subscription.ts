import { prisma } from '../lib/prisma.js';
import type { User } from '@prisma/client';

export const SUBSCRIPTION = {
  DAY_MS: 24 * 60 * 60 * 1000,
  CHARGE_PERIOD_DAYS: 3,
  CHARGE_AMOUNT_RUB: 100n * 100n,
};

export function daysLeft(user: User): number {
  if (!user.subscriptionUntil) return 0;
  const ms = user.subscriptionUntil.getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / SUBSCRIPTION.DAY_MS) : 0;
}

export function isSubscriptionActive(user: User): boolean {
  return user.subscriptionUntil != null && user.subscriptionUntil.getTime() > Date.now();
}

export async function chargeIfNeeded(user: User): Promise<User> {
  const now = Date.now();
  const lastCharge = user.lastChargeAt?.getTime() ?? 0;
  const sinceLastCharge = now - lastCharge;

  // Ещё не время списывать
  if (lastCharge > 0 && sinceLastCharge < SUBSCRIPTION.CHARGE_PERIOD_DAYS * SUBSCRIPTION.DAY_MS) {
    return user;
  }

  // Первый заход после выдачи админом — просто ставим метку времени
  if (lastCharge === 0) {
    return prisma.user.update({
      where: { id: user.id },
      data: { lastChargeAt: new Date(now) },
    });
  }

  // Подписка уже истекла — ничего не делаем
  if (!isSubscriptionActive(user)) {
    return user;
  }

  // Денег нет — НЕ продлеваем, но и НЕ обнуляем
  if (user.balanceRub < SUBSCRIPTION.CHARGE_AMOUNT_RUB) {
    return user;
  }

  const base = Math.max(now, user.subscriptionUntil!.getTime());
  return prisma.user.update({
    where: { id: user.id },
    data: {
      balanceRub: { decrement: SUBSCRIPTION.CHARGE_AMOUNT_RUB },
      lastChargeAt: new Date(now),
      subscriptionUntil: new Date(base + SUBSCRIPTION.CHARGE_PERIOD_DAYS * SUBSCRIPTION.DAY_MS),
    },
  });
}

export async function addToSubscription(userId: string, amountRub: number) {
  const days = Math.max(3, Math.floor((amountRub / 100) * 3));
  const now = Date.now();

  return prisma.user.update({
    where: { id: userId },
    data: {
      balanceRub: { increment: BigInt(amountRub * 100) },
      subscriptionUntil: new Date(now + days * SUBSCRIPTION.DAY_MS),
      lastChargeAt: new Date(now),
    },
  });
}
