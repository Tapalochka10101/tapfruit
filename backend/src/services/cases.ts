export type CasePrize =
  | { kind: 'taps'; amount: bigint }
  | { kind: 'chips'; amount: bigint }
  | { kind: 'skin'; skinId: string };

export type CaseDef = {
  id: string;
  label: string;
  emoji: string;
  price: bigint;
  color: string;
  roll: () => CasePrize;
};

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const CASES: CaseDef[] = [
  {
    id: 'bronze',
    label: 'Бронзовый',
    emoji: '📦',
    price: 5_000n,
    color: '#a16207',
    roll: () => {
      const r = Math.random();
      if (r < 0.15) return { kind: 'chips', amount: BigInt(randInt(5, 20)) };
      return { kind: 'taps', amount: BigInt(randInt(3_000, 15_000)) };
    },
  },
  {
    id: 'silver',
    label: 'Серебряный',
    emoji: '🎁',
    price: 50_000n,
    color: '#94a3b8',
    roll: () => {
      const r = Math.random();
      if (r < 0.20) return { kind: 'chips', amount: BigInt(randInt(30, 100)) };
      if (r < 0.25) return { kind: 'skin', skinId: pick(['orange', 'pear', 'banana']) };
      return { kind: 'taps', amount: BigInt(randInt(20_000, 100_000)) };
    },
  },
  {
    id: 'gold',
    label: 'Золотой',
    emoji: '🏆',
    price: 500_000n,
    color: '#eab308',
    roll: () => {
      const r = Math.random();
      if (r < 0.05) return { kind: 'skin', skinId: pick(['grape', 'strawberry', 'cherry', 'kiwi']) };
      if (r < 0.30) return { kind: 'chips', amount: BigInt(randInt(150, 400)) };
      return { kind: 'taps', amount: BigInt(randInt(200_000, 1_000_000)) };
    },
  },
  {
    id: 'diamond',
    label: 'Алмазный',
    emoji: '💎',
    price: 5_000_000n,
    color: '#06b6d4',
    roll: () => {
      const r = Math.random();
      if (r < 0.20) return { kind: 'skin', skinId: pick(['peach', 'pineapple', 'lemon', 'avocado']) };
      if (r < 0.35) return { kind: 'chips', amount: BigInt(randInt(800, 2_000)) };
      return { kind: 'taps', amount: BigInt(randInt(1_000_000, 10_000_000)) };
    },
  },
];

export function getCase(id: string): CaseDef | null {
  return CASES.find(c => c.id === id) ?? null;
}