import { create } from 'zustand';
import { api } from '../lib/api';

export type SkinId =
  | 'orange' | 'pear' | 'banana' | 'grape' | 'strawberry'
  | 'cherry' | 'kiwi' | 'peach' | 'pineapple' | 'mango'
  | 'lemon' | 'avocado' | 'blueberry' | 'coconut' | 'dragonfruit';

export type OwnedGenerator = { id: string; count: number };

type State = {
  ready: boolean;
  balanceRub: number;
  subscriptionUntil: number | null;
  subscriptionActive: boolean;
  balance: number;
  chips: number;
  totalTaps: number;
  upgradeLevel: number;
  maxUpgradeLevel: number;
  activeSkin: SkinId | null;
  ownedSkins: SkinId[];
  generators: OwnedGenerator[];
  generatorRate: number;
  dailyStreak: number;
  canClaimDaily: boolean;
  seed: number;
  tapIndex: number;
  lastDailyClaim: number | null;
  bananaBoostUntil: number | null;
  bananaCooldownUntil: number | null;
  createdAt: number;
  playtimeMs: number;
  sessionStart: number;
  tapsThisSession: number;

  init: () => Promise<void>;
  addOptimistic: (delta: number) => void;
  setBalance: (v: number) => void;
  setChips: (v: number) => void;
  setFromTap: (r: { balance: string; tapIndex: string; tapSeed: string; rotated?: boolean }) => void;
  setSkin: (s: SkinId | null) => void;
  setUpgrade: (lvl: number) => void;
  setMaxUpgrade: (lvl: number) => void;
  setGenerators: (list: OwnedGenerator[], rate: number) => void;
  setDaily: (streak: number, canClaim: boolean) => void;
  setBanana: (b: { boostUntil: string; cooldownUntil: string }) => void;
  registerTap: () => void;
};

export const useGame = create<State>((set) => ({
  ready: false,
  balanceRub: 0,
  subscriptionUntil: null,
  subscriptionActive: false,
  balance: 0,
  chips: 0,
  totalTaps: 0,
  upgradeLevel: 0,
  maxUpgradeLevel: 0,
  activeSkin: null,
  ownedSkins: [],
  generators: [],
  generatorRate: 0,
  dailyStreak: 0,
  canClaimDaily: false,
  seed: 1,
  tapIndex: 0,
  lastDailyClaim: null,
  bananaBoostUntil: null,
  bananaCooldownUntil: null,
  createdAt: Date.now(),
  playtimeMs: 0,
  sessionStart: Date.now(),
  tapsThisSession: 0,

  init: async () => {
    const r = await api.me();
    const u = r.user;
    set({
      ready: true,
      balanceRub: Number((u as any).balanceRub ?? 0) / 100,
      subscriptionUntil: (u as any).subscriptionUntil ? Date.parse((u as any).subscriptionUntil) : null,
      subscriptionActive: Boolean((u as any).subscriptionActive),
      balance: Number(u.balance),
      chips: Number(u.chips ?? 0),
      totalTaps: Number(u.totalTaps),
      upgradeLevel: u.upgradeLevel,
      maxUpgradeLevel: u.maxUpgradeLevel ?? u.upgradeLevel,
      activeSkin: (u.activeSkin as SkinId) ?? null,
      ownedSkins: (u.ownedSkins as SkinId[]) ?? [],
      generators: u.generators ?? [],
      generatorRate: u.generatorRate ?? 0,
      dailyStreak: u.dailyStreak ?? 0,
      canClaimDaily: u.canClaimDaily ?? false,
      seed: Number(u.tapSeed),
      tapIndex: Number(u.tapIndex),
      lastDailyClaim: u.lastDailyClaim ? Date.parse(u.lastDailyClaim) : null,
      bananaBoostUntil: u.bananaBoostUntil ? Date.parse(u.bananaBoostUntil) : null,
      bananaCooldownUntil: u.bananaCooldownUntil ? Date.parse(u.bananaCooldownUntil) : null,
      createdAt: Date.parse(u.createdAt),
      sessionStart: Date.now(),
    });
  },

  addOptimistic: (delta) => set(s => ({ balance: s.balance + delta })),
  setBalance: (v) => set({ balance: v }),
  setChips: (v) => set({ chips: v }),
  setFromTap: (r) => set({
    balance: Number(r.balance),
    tapIndex: Number(r.tapIndex),
    ...(r.rotated ? { seed: Number(r.tapSeed) } : {}),
  }),
  setSkin: (s) => set({ activeSkin: s }),
  setUpgrade: (lvl) => set({ upgradeLevel: lvl }),
  setMaxUpgrade: (lvl) => set({ maxUpgradeLevel: lvl }),
  setGenerators: (list, rate) => set({ generators: list, generatorRate: rate }),
  setDaily: (streak, canClaim) => set({ dailyStreak: streak, canClaimDaily: canClaim }),
  setBanana: (b) => set({
    bananaBoostUntil: Date.parse(b.boostUntil),
    bananaCooldownUntil: Date.parse(b.cooldownUntil),
  }),

  registerTap: () => set(s => ({
    totalTaps: s.totalTaps + 1,
    tapsThisSession: s.tapsThisSession + 1,
  })),
}));