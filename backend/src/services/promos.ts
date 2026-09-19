import { prisma } from '../lib/prisma.js';

export type Promo = {
  code: string;
  reward: bigint;
  maxUses: number;
  showImage?: boolean;
  label: string;
};

/** Legacy: использовался до переезда в БД. Оставлен для совместимости с фронтом. */
export const PROMOS: Promo[] = [
  { code: 'hapulka',      reward: 10_000n,      maxUses: 1,   label: '+10 000 тапсов' },
  { code: 'rich',         reward: 500n,         maxUses: 1,   label: '+500 тапсов' },
  { code: 'zavoz',        reward: 1_000n,       maxUses: 4,   showImage: true, label: '+1 000 тапсов (×4)' },
  { code: 'bablobarbosa', reward: 10_000_000n,  maxUses: 100, label: '+10 000 000 тапсов (×100)' },
  { code: 'плаtega',      reward: 1111n,        maxUses: 2,   label: '+1 111 тапсов (×2)' },
];

let promoCache: Map<string, Promo> = new Map();

/** Загружает промокоды из БД. Если в БД пусто — заливает legacy из PROMOS. */
export async function loadPromosFromDb(): Promise<void> {
  try {
    let rows = await prisma.promoCode.findMany();
    if (rows.length === 0) {
      console.log('[promo] пустая таблица — сидирую legacy');
      for (const p of PROMOS) {
        await prisma.promoCode.create({
          data: { code: p.code, reward: p.reward, maxUses: p.maxUses, label: p.label },
        });
      }
      rows = await prisma.promoCode.findMany();
    }
    promoCache = new Map();
    for (const r of rows) {
      promoCache.set(r.code, {
        code: r.code,
        reward: r.reward,
        maxUses: r.maxUses,
        label: r.label ?? ('+' + r.reward.toString() + ' тапсов'),
      });
    }
    console.log('[promo] loaded', promoCache.size, 'promos');
  } catch (e) {
    console.warn('[promo] load failed:', (e as Error).message);
  }
}

/** Ищет промокод в БД (свежий) — вызывается при вводе кода. */
export async function findPromoAsync(code: string): Promise<Promo | null> {
  const normalized = code.trim().toLowerCase();
  try {
    const row = await prisma.promoCode.findUnique({ where: { code: normalized } });
    if (!row) return null;
    return {
      code: row.code,
      reward: row.reward,
      maxUses: row.maxUses,
      label: row.label ?? ('+' + row.reward.toString() + ' тапсов'),
    };
  } catch {
    return promoCache.get(normalized) ?? null;
  }
}

export function findPromo(code: string): Promo | null {
  const normalized = code.trim().toLowerCase();
  return promoCache.get(normalized) ?? PROMOS.find(p => p.code === normalized) ?? null;
}

/** Создаёт или обновляет промокод в БД + кэш. */
export async function upsertPromo(input: { code: string; reward: bigint; maxUses: number; label?: string }): Promise<void> {
  const code = input.code.trim().toLowerCase();
  await prisma.promoCode.upsert({
    where: { code },
    create: { code, reward: input.reward, maxUses: input.maxUses, label: input.label ?? null },
    update: { reward: input.reward, maxUses: input.maxUses, label: input.label ?? null, usedCount: 0 },
  });
  promoCache.set(code, {
    code,
    reward: input.reward,
    maxUses: input.maxUses,
    label: input.label ?? ('+' + input.reward.toString() + ' тапсов'),
  });
}

export async function deletePromo(code: string): Promise<void> {
  const c = code.trim().toLowerCase();
  await prisma.promoCode.delete({ where: { code: c } }).catch(() => {});
  promoCache.delete(c);
}

export async function listPromos(): Promise<{ code: string; reward: bigint; maxUses: number; usedCount: number; label: string }[]> {
  try {
    const rows = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(r => ({
      code: r.code,
      reward: r.reward,
      maxUses: r.maxUses,
      usedCount: r.usedCount,
      label: r.label ?? ('+' + r.reward.toString() + ' тапсов'),
    }));
  } catch {
    return [];
  }
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