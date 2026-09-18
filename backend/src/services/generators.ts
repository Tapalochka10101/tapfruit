import { GAME } from './gameConfig.js';
import type { User } from '@prisma/client';

export type OwnedGenerator = { id: string; count: number };

export function parseGenerators(json: string): OwnedGenerator[] {
  try {
    const arr = JSON.parse(json || '[]');
    if (!Array.isArray(arr)) return [];
    return arr.filter(x => x && typeof x.id === 'string' && typeof x.count === 'number');
  } catch {
    return [];
  }
}

export function serializeGenerators(list: OwnedGenerator[]): string {
  return JSON.stringify(list);
}

/** Сколько тапсов в МИНУТУ даёт игрок со всеми генераторами. */
export function totalTapsPerMinute(owned: OwnedGenerator[]): number {
  let total = 0;
  for (const o of owned) {
    const g = GAME.getGenerator(o.id);
    if (g) total += g.tapsPerMin * o.count;
  }
  return total;
}

/** Считает накопленный пассив с lastPassiveAt. Максимум — 8 часов. */
export function pendingPassive(user: User): bigint {
  const owned = parseGenerators(user.generators);
  const ratePerMin = totalTapsPerMinute(owned);
  if (ratePerMin <= 0) return 0n;

  const now = Date.now();
  const last = user.lastPassiveAt?.getTime() ?? now;
  const elapsed = Math.min(now - last, GAME.MAX_OFFLINE_MS);

  const skin = user.activeSkin;
  let offlineMult = 1;
  if (skin === 'cherry') offlineMult = 2;

  const minutes = elapsed / 60_000;
  const taps = Math.floor(minutes * ratePerMin * offlineMult);
  return BigInt(taps);
}

/** Максимум за 8 часов — для прогресс-бара. */
export function maxCappedPassive(owned: OwnedGenerator[]): bigint {
  const ratePerMin = totalTapsPerMinute(owned);
  const minutes = GAME.MAX_OFFLINE_MS / 60_000;
  return BigInt(Math.floor(minutes * ratePerMin));
}

export function addGenerator(owned: OwnedGenerator[], id: string): OwnedGenerator[] {
  const next = [...owned];
  const found = next.find(g => g.id === id);
  if (found) found.count += 1;
  else next.push({ id, count: 1 });
  return next;
}