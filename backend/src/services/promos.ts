export type Promo = {
  code: string;
  reward: bigint;
  maxUses: number;
  showImage?: boolean;
  label: string;
};

export const PROMOS: Promo[] = [
  { code: 'hapulka',      reward: 10_000n,      maxUses: 1,   label: '+10 000 тапсов' },
  { code: 'rich',         reward: 500n,         maxUses: 1,   label: '+500 тапсов' },
  { code: 'zavoz',        reward: 1_000n,       maxUses: 4,   showImage: true, label: '+1 000 тапсов (×4)' },
  { code: 'bablobarbosa', reward: 10_000_000n,  maxUses: 100, label: '+10 000 000 тапсов (×100)' },
];

export function findPromo(code: string): Promo | null {
  const normalized = code.trim().toLowerCase();
  return PROMOS.find(p => p.code === normalized) ?? null;
}

export type UsedPromo = { code: string; count: number; lastUsedAt: string };

export function parseUsedPromos(json: string): UsedPromo[] {
  try {
    const arr = JSON.parse(json || '[]');
    if (!Array.isArray(arr)) return [];
    return arr.filter(x => x && typeof x.code === 'string');
  } catch {
    return [];
  }
}

export function serializeUsedPromos(list: UsedPromo[]): string {
  return JSON.stringify(list);
}

export function getUsageCount(used: UsedPromo[], code: string): number {
  const found = used.find(u => u.code === code);
  return found?.count ?? 0;
}

export function incrementUsage(used: UsedPromo[], code: string): UsedPromo[] {
  const next = [...used];
  const found = next.find(u => u.code === code);
  if (found) {
    found.count += 1;
    found.lastUsedAt = new Date().toISOString();
  } else {
    next.push({ code, count: 1, lastUsedAt: new Date().toISOString() });
  }
  return next;
}