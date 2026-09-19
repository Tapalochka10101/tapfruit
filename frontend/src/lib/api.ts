import { initData } from './telegram';

const BASE = import.meta.env.VITE_API_URL || 'https://tapfruit-backend.onrender.com/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(initData ? { 'x-init-data': initData } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'network' }));
    throw Object.assign(new Error(err.error || 'request_failed'), { status: res.status, body: err });
  }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => req<MeResponse>('/me'),
  tap: (b: { startIdx: string; endIdx: string; count: number }) =>
    req<TapResponse>('/tap', { method: 'POST', body: JSON.stringify(b) }),
  buy: (itemType: 'upgrade' | 'skin', itemId: string) =>
    req<any>('/shop/buy', { method: 'POST', body: JSON.stringify({ itemType, itemId }) }),
  equip: (skinId: string | null) =>
    req<any>('/skins/equip', { method: 'POST', body: JSON.stringify({ skinId }) }),
  claimDaily: () => req<any>('/skins/daily', { method: 'POST' }),
  activateBanana: () => req<any>('/skins/banana/activate', { method: 'POST' }),
  saveSettings: (settings: Record<string, unknown>) =>
    req<any>('/settings', { method: 'POST', body: JSON.stringify({ settings }) }),
  deleteAccount: () => req<any>('/account', { method: 'DELETE' }),
  referral: () => req<{ url: string }>('/referral'),
  deposit: (amountRub: number) =>
    req<any>('/wallet/deposit', { method: 'POST', body: JSON.stringify({ amountRub }) }),
  buyChips: (taps: number) =>
    req<any>('/minigames/buy-chips', { method: 'POST', body: JSON.stringify({ taps }) }),
  sellChips: (chips: number) =>
    req<any>('/minigames/sell-chips', { method: 'POST', body: JSON.stringify({ chips }) }),
  sellAllChips: () =>
    req<any>('/minigames/sell-all-chips', { method: 'POST' }),
  wordStart: (bet: number, wordLength: 3 | 4 | 5) =>
    req<any>('/minigames/word/start', { method: 'POST', body: JSON.stringify({ bet, wordLength }) }),
  wordGuess: (sessionId: string, letter: string) =>
    req<any>('/minigames/word/guess', { method: 'POST', body: JSON.stringify({ sessionId, letter }) }),
  tttStart: (bet: number) =>
    req<any>('/minigames/tictactoe/start', { method: 'POST', body: JSON.stringify({ bet }) }),
  tttMove: (sessionId: string, cell: number) =>
    req<any>('/minigames/tictactoe/move', { method: 'POST', body: JSON.stringify({ sessionId, cell }) }),
  playMinigame: (gameId: string, bet: number, choice: string) =>
    req<any>('/minigames/play', { method: 'POST', body: JSON.stringify({ gameId, bet, choice }) }),
  getGenerators: () => req<any>('/generators'),
  buyGenerator: (generatorId: string) =>
    req<any>('/generators/buy', { method: 'POST', body: JSON.stringify({ generatorId }) }),
  collectPassive: () => req<any>('/generators/collect', { method: 'POST' }),
  redeemPromo: (code: string) =>
    req<any>('/promos/redeem', { method: 'POST', body: JSON.stringify({ code }) }),
  getReferrals: () => req<{ link: string; referredCount: number; earnings: string; percent: number }>('/referrals'),
  getDailyStatus: () => req<{ canClaim: boolean; currentStreak: number; nextStreak: number; nextReward: string; streakTable: { day: number; reward: string }[] }>('/daily/status'),
  claimDailyStreak: () => req<{ ok: boolean; reward: string; streak: number; balance: string }>('/daily/claim', { method: 'POST' }),
};

export type MeResponse = {
  user: {
    tgId: string; username: string | null; balance: string; chips: string; totalTaps: string;
    upgradeLevel: number; maxUpgradeLevel: number;
    activeSkin: string | null; ownedSkins: string[];
    generators: { id: string; count: number }[];
    generatorRate: number;
    pendingPassive: string;
    referralEarnings: string;
    referredCount: number;
    dailyStreak: number;
    canClaimDaily: boolean;
    lastDailyClaim: string | null; bananaBoostUntil: string | null; bananaCooldownUntil: string | null;
    tapSeed: string; tapIndex: string; settings: Record<string, unknown>;
    createdAt: string; now: number;
  };
};

export type TapResponse = {
  balance: string; tapIndex: string; tapSeed: string;
  appliedValue: string; crits: number; rotated: boolean;
  rejected?: boolean; reason?: string;
};
