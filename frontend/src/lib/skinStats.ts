import type { SkinId } from '../store/useGameStore';

export type SkinStats = {
  tapBonus: number;
  passiveBonus: number;
  critChance: number;
  critValue: number;
  boostMultiplier: number;
  special?: 'every50x5' | 'every25x10';
};

export const SKIN_STATS: Record<SkinId, SkinStats> = {
  orange:      { tapBonus: 0.03, passiveBonus: 0,    critChance: 0,    critValue: 1,  boostMultiplier: 1 },
  pear:        { tapBonus: 0,    passiveBonus: 0,    critChance: 0.07, critValue: 3,  boostMultiplier: 1 },
  banana:      { tapBonus: 0,    passiveBonus: 0,    critChance: 0,    critValue: 1,  boostMultiplier: 2 },
  grape:       { tapBonus: 0.07, passiveBonus: 0.05, critChance: 0,    critValue: 1,  boostMultiplier: 1 },
  strawberry:  { tapBonus: 0,    passiveBonus: 0,    critChance: 0.12, critValue: 5,  boostMultiplier: 1 },
  cherry:      { tapBonus: 0.15, passiveBonus: 0,    critChance: 0,    critValue: 1,  boostMultiplier: 1 },
  kiwi:        { tapBonus: 0.25, passiveBonus: 0,    critChance: 0,    critValue: 1,  boostMultiplier: 1 },
  peach:       { tapBonus: 0,    passiveBonus: 0.4,  critChance: 0,    critValue: 1,  boostMultiplier: 1 },
  pineapple:   { tapBonus: 0,    passiveBonus: 0,    critChance: 0.18, critValue: 7,  boostMultiplier: 1 },
  mango:       { tapBonus: 0.1,  passiveBonus: 1.0,  critChance: 0,    critValue: 1,  boostMultiplier: 1 },
  lemon:       { tapBonus: 0.15, passiveBonus: 1.0,  critChance: 0,    critValue: 1,  boostMultiplier: 1 },
  avocado:     { tapBonus: 0.2,  passiveBonus: 1.5,  critChance: 0,    critValue: 1,  boostMultiplier: 1 },
  blueberry:   { tapBonus: 0,    passiveBonus: 0,    critChance: 0.25, critValue: 10, boostMultiplier: 1 },
  coconut:     { tapBonus: 0,    passiveBonus: 3.0,  critChance: 0,    critValue: 1,  boostMultiplier: 1, special: 'every50x5' },
  dragonfruit: { tapBonus: 0,    passiveBonus: 4.0,  critChance: 0.35, critValue: 25, boostMultiplier: 1, special: 'every25x10' },
};

export function getSkinStats(skin: SkinId | null): SkinStats {
  if (!skin) return { tapBonus: 0, passiveBonus: 0, critChance: 0, critValue: 1, boostMultiplier: 1 };
  return SKIN_STATS[skin];
}
