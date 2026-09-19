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
  tapBonus: number;
  critChainChance: number;
};

export function getTapModifiers(user: User): TapModifiers {
  const now = Date.now();
  const skin = user.activeSkin as SkinId | null;
  const def: any = skin ? (GAME.SKINS as any)[skin] : null;

  const critChance = def?.critChance ?? 0;
  const critValue = def?.critValue ?? GAME.BASE_TAP;
  const dailyBonus = (def?.dailyBonus ?? 0n) as bigint;
  const tapBonus = def?.tapBonus ?? 0;
  const critChainChance = def?.critChainChance ?? 0;

  let boostMultiplier = 1;
  if (def?.boostMultiplier && user.bananaBoostUntil && user.bananaBoostUntil.getTime() > now) {
    boostMultiplier = def.boostMultiplier;
  }

  const upgradeMultiplier = GAME.upgradeMultiplier(user.upgradeLevel);
  return { critChance, critValue, boostMultiplier, upgradeMultiplier, dailyBonus, tapBonus, critChainChance };
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

  let lastWasCrit = false;
  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    let isCrit = rollCrit(seed, idx, mods.critChance);

    if (!isCrit && lastWasCrit && mods.critChainChance > 0) {
      const chainRoll = rollCrit(seed ^ 0xdeadbeef, idx, mods.critChainChance);
      if (chainRoll) isCrit = true;
    }

    if (isCrit) { crits++; lastWasCrit = true; } else { lastWasCrit = false; }

    const base = isCrit ? mods.critValue : GAME.BASE_TAP;
    let mult = 1 + mods.tapBonus;
    mult *= mods.boostMultiplier;

    const value = Math.round(base * mods.upgradeMultiplier * mult);
    sum += BigInt(value);
  }

  return { totalTaps: count, totalValue: sum, crits };
}

export function tryClaimDaily(user: User): { claimed: boolean; amount: bigint } {
  const skin = user.activeSkin as SkinId | null;
  const def: any = skin ? (GAME.SKINS as any)[skin] : null;
  const bonus = (def?.dailyBonus ?? 0n) as bigint;
  if (bonus <= 0n) return { claimed: false, amount: 0n };
  if (user.lastDailyClaim && sameMskDay(user.lastDailyClaim, new Date())) {
    return { claimed: false, amount: 0n };
  }
  return { claimed: true, amount: bonus };
}
