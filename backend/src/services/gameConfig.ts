type Upgrade = {
  id: string;
  level: number;
  multiplier: number;
  price: bigint;
  label: string;
};

type Generator = {
  id: string;
  label: string;
  emoji: string;
  price: bigint;
  tapsPerMin: number;
};

type Skin = {
  id: string;
  label: string;
  price: bigint;
  dailyBonus?: bigint;
  critChance?: number;
  critValue?: number;
  passiveBonus?: number;
  offlineMultiplier?: number;
  boostMultiplier?: number;
  boostDurationMs?: number;
  boostCooldownMs?: number;
};

type DailyReward = { day: number; reward: bigint };

const UPGRADES: Upgrade[] = [
  { id: 'multitap_1', level: 1, multiplier: 1.25, price: 500n,             label: 'Деревянный палец' },
  { id: 'multitap_2', level: 2, multiplier: 1.5,  price: 2_500n,           label: 'Стальной палец' },
  { id: 'multitap_3', level: 3, multiplier: 2.0,  price: 10_000n,          label: 'Золотой палец' },
  { id: 'multitap_4', level: 4, multiplier: 2.5,  price: 50_000n,          label: 'Алмазный палец' },
  { id: 'multitap_5', level: 5, multiplier: 3.0,  price: 250_000n,         label: 'Платиновый палец' },
  { id: 'multitap_6', level: 6, multiplier: 4.0,  price: 1_000_000n,       label: 'Легендарный палец' },
  { id: 'multitap_7', level: 7, multiplier: 5.0,  price: 5_000_000n,       label: 'Космический палец' },
  { id: 'multitap_8', level: 8, multiplier: 6.0,  price: 20_000_000n,      label: 'Квантовый палец' },
  { id: 'multitap_9', level: 9, multiplier: 10.0, price: 100_000_000n,     label: 'Божественный палец' },
];

const GENERATORS: Generator[] = [
  { id: 'coin',     label: 'Монетка',        emoji: '🪙', price: 5_760n,            tapsPerMin: 1 },
  { id: 'wallet',   label: 'Кошелёк',        emoji: '👛', price: 57_600n,           tapsPerMin: 10 },
  { id: 'bag',      label: 'Мешок',          emoji: '💰', price: 576_000n,          tapsPerMin: 100 },
  { id: 'chest',    label: 'Сундук',         emoji: '🎁', price: 5_760_000n,        tapsPerMin: 1_000 },
  { id: 'bank',     label: 'Банк',           emoji: '🏦', price: 57_600_000n,       tapsPerMin: 10_000 },
  { id: 'factory',  label: 'Завод',          emoji: '🏭', price: 576_000_000n,      tapsPerMin: 100_000 },
  { id: 'quantum',  label: 'Квантовое ядро', emoji: '⚛️', price: 5_760_000_000n,    tapsPerMin: 1_000_000 },
];

const SKINS: Record<string, Skin> = {
  orange:     { id: 'orange',     label: '🍊 Апельсин',  price: 500n,       dailyBonus: 100n },
  pear:       { id: 'pear',       label: '🍐 Груша',     price: 2_000n,     critChance: 0.07, critValue: 7 },
  banana:     { id: 'banana',     label: '🍌 Банан',     price: 5_000n,
                boostMultiplier: 5,  boostDurationMs: 15_000, boostCooldownMs: 30 * 60_000 },
  grape:      { id: 'grape',      label: '🍇 Виноград',  price: 15_000n,    passiveBonus: 0.05 },
  strawberry: { id: 'strawberry', label: '🍓 Клубника',  price: 40_000n,    critChance: 0.15, critValue: 7 },
  cherry:     { id: 'cherry',     label: '🍒 Вишня',     price: 100_000n,   offlineMultiplier: 2 },
  kiwi:       { id: 'kiwi',       label: '🥝 Киви',      price: 250_000n,
                boostMultiplier: 10, boostDurationMs: 10_000, boostCooldownMs: 60 * 60_000 },
  peach:      { id: 'peach',      label: '🍑 Персик',    price: 750_000n,   passiveBonus: 0.3 },
  pineapple:  { id: 'pineapple',  label: '🍍 Ананас',    price: 2_000_000n, passiveBonus: 0.5 },
  mango:      { id: 'mango',      label: '🥭 Манго',     price: 10_000_000n, passiveBonus: 1.0,
                boostMultiplier: 10, boostDurationMs: 20_000, boostCooldownMs: 60 * 60_000 },
  lemon:      { id: 'lemon',      label: '🍋 Лимон',     price: 25_000_000n,  passiveBonus: 0.8 },
  avocado:    { id: 'avocado',    label: '🥑 Авокадо',   price: 50_000_000n,  passiveBonus: 1.0 },
  blueberry:  { id: 'blueberry',  label: '🫐 Голубика',  price: 100_000_000n, critChance: 0.2, critValue: 7 },
  coconut:    { id: 'coconut',    label: '🥥 Кокос',     price: 250_000_000n, dailyBonus: 500n },
  dragonfruit:{ id: 'dragonfruit',label: '🐉 Драконий фрукт', price: 1_000_000_000n, passiveBonus: 2.0 },
};

const SKIN_IDS: string[] = Object.keys(SKINS);

const DAILY_STREAK: DailyReward[] = [
  { day: 1, reward: 1_000n },
  { day: 2, reward: 2_500n },
  { day: 3, reward: 5_000n },
  { day: 4, reward: 10_000n },
  { day: 5, reward: 25_000n },
  { day: 6, reward: 50_000n },
  { day: 7, reward: 150_000n },
];

export const GAME = {
  BASE_TAP: 1,
  MAX_CPS: 500,
  MAX_BATCH_TAPS: 200,

  UPGRADES,
  upgradeMultiplier(level: number): number {
    const found = UPGRADES.find(u => u.level === level);
    return found?.multiplier ?? 1;
  },

  GENERATORS,
  isGeneratorId(x: string): boolean {
    return GENERATORS.some(g => g.id === x);
  },
  getGenerator(id: string): Generator | null {
    return GENERATORS.find(g => g.id === id) ?? null;
  },

  MAX_OFFLINE_MS: 8 * 60 * 60 * 1000,

  DAILY_STREAK,

  SKINS,
  SKIN_IDS,
  isSkinId(x: string): boolean {
    return SKIN_IDS.includes(x);
  },
};

export type SkinId = keyof typeof SKINS;
export type UpgradeId = typeof UPGRADES[number]['id'];
export type GeneratorId = typeof GENERATORS[number]['id'];