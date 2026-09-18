import { GAME, type SkinId } from './gameConfig.js';
import { rollCrit } from './prng.js';
import { sameMskDay } from '../lib/msk.js';
import type { User } from '@prisma/client';

export type TapModifiers = {
  critChance: number;
  critValue: number;
  boostMultiplier: number;
  upgradeMultiplier: number;
  dailyBonus: bigint;
};

/**
 * Собирает модификаторы тапа. Каждый скин добавляет свой модификатор независимо.
 */
export function getTapModifiers(user: User): TapModifiers {
  const now = Date.now();
  const skin = user.activeSkin as SkinId | null;

  let critChance = 0;
  let critValue = GAME.BASE_TAP;
  let boostMultiplier = 1;
  let dailyBonus = 0n;

  const upgradeMultiplier = GAME.upgradeMultiplier(user.upgradeLevel);

  if (skin === 'pear') {
    critChance = GAME.SKINS.pear.critChance;
    critValue = GAME.SKINS.pear.critValue;
  }
  if (skin === 'orange') {
    dailyBonus = GAME.SKINS.orange.dailyBonus;
  }
  if (skin === 'banana' && user.bananaBoostUntil && user.bananaBoostUntil.getTime() > now) {
    boostMultiplier = GAME.SKINS.banana.boostMultiplier;
  }

  return { critChance, critValue, boostMultiplier, upgradeMultiplier, dailyBonus };
}

export type TapResult = {
  totalTaps: number;
  totalValue: bigint;
  crits: number;
};

export function computeTaps(user: User, startIdx: number, count: number): TapResult {
  const mods = getTapModifiers(user);
  const seed = Number(user.tapSeed % 0xffffffffn);

  let sum = 0n;
  let crits = 0;

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const isCrit = rollCrit(seed, idx, mods.critChance);
    if (isCrit) crits++;

    const base = isCrit ? mods.critValue : GAME.BASE_TAP;
    const value = Math.round(base * mods.upgradeMultiplier * mods.boostMultiplier);
    sum += BigInt(value);
  }

  return { totalTaps: count, totalValue: sum, crits };
}

export function tryClaimDaily(user: User): { claimed: boolean; amount: bigint } {
  if (user.activeSkin !== 'orange') return { claimed: false, amount: 0n };
  if (user.lastDailyClaim && sameMskDay(user.lastDailyClaim, new Date())) {
    return { claimed: false, amount: 0n };
  }
  return { claimed: true, amount: GAME.SKINS.orange.dailyBonus };
}
