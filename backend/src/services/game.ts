import { GAME, type SkinId } from './gameConfig.js';
import { rollCrit } from './prng.js';
import { sameMskDay } from '../lib/msk.js';
import type { User } from '@prisma/client';

export type TapContext = {
  upgradeMultiplier: number;
  critChance: number;
  critValue: number;
  boostMultiplier: number;
  seed: number;
  startIdx: number;
  count: number;
};

export function buildTapContext(user: User, count: number): TapContext {
  const now = Date.now();
  const bananaActive = user.bananaBoostUntil && user.bananaBoostUntil.getTime() > now;
  const skin = user.activeSkin as SkinId | null;

  return {
    upgradeMultiplier: GAME.upgradeMultiplier(user.upgradeLevel),
    critChance: skin === 'pear' ? GAME.SKINS.pear.critChance : 0,
    critValue: skin === 'pear' ? GAME.SKINS.pear.critValue : GAME.BASE_TAP,
    boostMultiplier: bananaActive ? GAME.SKINS.banana.boostMultiplier : 1,
    seed: Number(user.tapSeed % 0xffffffffn),
    startIdx: Number(user.tapIndex),
    count,
  };
}

export function computeTaps(ctx: TapContext) {
  let sum = 0n;
  let crits = 0;
  for (let i = 0; i < ctx.count; i++) {
    const idx = ctx.startIdx + i;
    const isCrit = rollCrit(ctx.seed, idx, ctx.critChance);
    if (isCrit) crits++;
    const base = isCrit ? ctx.critValue : GAME.BASE_TAP;
    const v = Math.round(base * ctx.upgradeMultiplier * ctx.boostMultiplier);
    sum += BigInt(v);
  }
  return { totalValue: sum, crits };
}

export function tryClaimDaily(user: User): { claimed: boolean; amount: bigint } {
  const skin = user.activeSkin as SkinId | null;
  if (skin !== 'orange') return { claimed: false, amount: 0n };
  if (user.lastDailyClaim && sameMskDay(user.lastDailyClaim, new Date())) {
    return { claimed: false, amount: 0n };
  }
  return { claimed: true, amount: GAME.SKINS.orange.dailyBonus };
}