export const GAME_CONFIG = {
  // 10 уровней — индекс = upgradeLevel, значение = множитель
  upgradeMultipliers: [1, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 10.0] as const,
  pearCritChance: 0.07,
  strawberryCritChance: 0.15,
  blueberryCritChance: 0.20,
  critValue: 7,
} as const;