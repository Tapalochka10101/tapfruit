import { prisma } from '../lib/prisma.js';
import type { User } from '@prisma/client';

export const SUBSCRIPTION = {
  DAY_MS: 24 * 60 * 60 * 1000,
  CHARGE_PERIOD_DAYS: 3,
  CHARGE_AMOUNT_RUB: 100n * 100n, // 100₽ в копейках
};

/** Возвращает кол-во дней до конца подписки (0 если истекла). */
export function daysLeft(user: User): number {
  if (!user.subscriptionUntil) return 0;
  const ms = user.subscriptionUntil.getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / SUBSCRIPTION.DAY_MS) : 0;
}

/** Активна ли подписка. */
export function isSubscriptionActive(user: User): boolean {
  return user.subscriptionUntil != null && user.subscriptionUntil.getTime() > Date.now();
}

/**
 * Списывает 100₽ раз в 3 дня, продлевает подписку на 3 дня.
 * Вызывается при каждом /api/me (лёгкая проверка, без cron).
 */
export async function chargeIfNeeded(user: User): Promise<User> {
  const now = Date.now();
  const lastCharge = user.lastChargeAt?.getTime() ?? 0;
  const sinceLastCharge = now - lastCharge;

  if (sinceLastCharge < SUBSCRIPTION.CHARGE_PERIOD_DAYS * SUBSCRIPTION.DAY_MS) {
    return user; // ещё не время
  }

  if (user.balanceRub < SUBSCRIPTION.CHARGE_AMOUNT_RUB) {
    // Не хватает денег — подписка истекает
    if (isSubscriptionActive(user)) {
      return prisma.user.update({
        where: { id: user.id },
        data: { subscriptionUntil: new Date(), lastChargeAt: new Date(now) },
      });
    }
    return user;
  }

  // Списываем и продлеваем
  return prisma.user.update({
    where: { id: user.id },
    data: {
      balanceRub: { decrement: SUBSCRIPTION.CHARGE_AMOUNT_RUB },
      lastChargeAt: new Date(now),
      subscriptionUntil: new Date(now + SUBSCRIPTION.CHARGE_PERIOD_DAYS * SUBSCRIPTION.DAY_MS),
    },
  });
}

/**
 * Пополнение: добавляет дни к подписке в зависимости от суммы.
 * 100₽ = 3 дня, 500₽ = 15 дней, 1000₽ = 30 дней.
 * Своя сумма: пропорционально (1₽ ≈ 0.03 дня, т.е. 100₽ → 3 дня).
 */
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
