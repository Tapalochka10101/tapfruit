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
  const def: any = skin ? (GAME.SKINS as any)[skin] : null;
  const offlineMult = def?.offlineMultiplier ?? 1;
  const passiveMult = 1 + (def?.passiveBonus ?? 0);
  const capMs = def?.offlineCapHours ? def.offlineCapHours * 3_600_000 : GAME.MAX_OFFLINE_MS;
  const elapsedCapped = Math.min(elapsed, capMs);

  const minutes = elapsedCapped / 60_000;
  const taps = Math.floor(minutes * ratePerMin * offlineMult * passiveMult);
  return BigInt(taps);
}

/** Максимум за 8 часов — для прогресс-бара. */
export function maxCappedPassive(owned: OwnedGenerator[], activeSkin?: string | null): bigint {
  const ratePerMin = totalTapsPerMinute(owned);
  const def: any = activeSkin ? (GAME.SKINS as any)[activeSkin] : null;
  const capMs = def?.offlineCapHours ? def.offlineCapHours * 3_600_000 : GAME.MAX_OFFLINE_MS;
  const passiveMult = 1 + (def?.passiveBonus ?? 0);
  const minutes = capMs / 60_000;
  return BigInt(Math.floor(minutes * ratePerMin * passiveMult));
}

/** Бонус за сбор пассива (например, у авокадо +50%). */
export function collectBonusFor(activeSkin?: string | null): number {
  const def: any = activeSkin ? (GAME.SKINS as any)[activeSkin] : null;
  return def?.collectBonus ?? 0;
}

export function addGenerator(owned: OwnedGenerator[], id: string): OwnedGenerator[] {
  const next = [...owned];
  const found = next.find(g => g.id === id);
  if (found) found.count += 1;
  else next.push({ id, count: 1 });
  return next;
}