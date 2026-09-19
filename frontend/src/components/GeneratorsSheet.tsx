import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useGame } from '../store/useGameStore';
import { fmt, fmtTime } from '../lib/format';
import { useHaptics } from '../hooks/useHaptics';

type CatalogItem = {
  id: string;
  label: string;
  emoji: string;
  price: string;
  basePrice?: string;
  tapsPerMin: number;
};

const DEFAULT_OFFLINE_MS = 8 * 60 * 60 * 1000;

export function GeneratorsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [pending, setPending] = useState<number>(0);
  const [basePending, setBasePending] = useState<number>(0);
  const [cap, setCap] = useState<number>(0);
  const [msUntilFull, setMsUntilFull] = useState<number>(DEFAULT_OFFLINE_MS);
  const [maxOfflineMs, setMaxOfflineMs] = useState<number>(DEFAULT_OFFLINE_MS);
  const [discount, setDiscount] = useState<number>(0);
  const [collectBonus, setCollectBonus] = useState<number>(0);
  const [tickStart, setTickStart] = useState<number>(Date.now());
  const haptics = useHaptics();

  const balance = useGame(s => s.balance);
  const generators = useGame(s => s.generators);
  const generatorRate = useGame(s => s.generatorRate); // taps/мин
  const activeSkin = useGame(s => s.activeSkin);
  const setBalance = useGame(s => s.setBalance);
  const setGenerators = useGame(s => s.setGenerators);

  const ownedMap = new Map(generators.map(g => [g.id, g.count]));

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api.getGenerators().then(r => {
      if (cancelled) return;
      setCatalog(r.catalog);
      setBasePending(Number(r.pending));
      setCap(Number(r.cap));
      setMsUntilFull(r.msUntilFull);
      setMaxOfflineMs((r as any).maxOfflineMs ?? DEFAULT_OFFLINE_MS);
      setDiscount((r as any).discount ?? 0);
      setCollectBonus((r as any).collectBonus ?? 0);
      setTickStart(Date.now());
      setPending(Number(r.pending));
      setGenerators(r.owned, r.rate);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [open, setGenerators]);

  // Локальный тикер — растёт каждые 250мс, с учётом капа
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - tickStart) / 1000;
      const ratePerSec = (generatorRate / 60) * (activeSkin === 'cherry' ? 2 : 1);
      const current = basePending + elapsedSec * ratePerSec;
      setPending(Math.min(Math.floor(current), cap || Number.MAX_SAFE_INTEGER));
    }, 250);
    return () => clearInterval(interval);
  }, [open, basePending, tickStart, generatorRate, activeSkin, cap]);

  const isFull = cap > 0 && pending >= cap;

  const buy = async (id: string) => {
    try {
      const r = await api.buyGenerator(id);
      setBalance(Number(r.balance));
      setGenerators(r.generators, r.rate);
      // Перезагружаем кап — rate мог измениться
      const rr = await api.getGenerators();
      setCap(Number(rr.cap));
      setBasePending(0);
      setPending(0);
      setTickStart(Date.now());
      setMsUntilFull(rr.msUntilFull);
      setMaxOfflineMs((rr as any).maxOfflineMs ?? DEFAULT_OFFLINE_MS);
      haptics.success();
    } catch (e: any) {
      haptics.error();
      alert(e?.body?.error || 'Error');
    }
  };

  const collect = async () => {
    try {
      const r = await api.collectPassive();
      setBalance(Number(r.balance));
      setBasePending(0);
      setPending(0);
      setTickStart(Date.now());
      haptics.success();
    } catch (e: any) {
      haptics.error();
      alert(e?.body?.error || 'Error');
    }
  };

  // Прогресс-бар заполнения (0..1)
  const fillPercent = cap > 0 ? Math.min(100, (pending / cap) * 100) : 0;
  // Сколько осталось до заполнения
  const remainingMs = Math.max(0, msUntilFull - (Date.now() - tickStart));

  return (
    <Modal open={open} onClose={onClose} title="🏭 Генераторы">
      {/* Сводка */}
      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white">
        <div className="text-xs opacity-80 mb-1">Доход</div>
        <div className="text-2xl font-black">+{fmt(generatorRate)} / мин</div>
        <div className="text-xs opacity-80 mt-1">
          ⏱ Максимум копится {Math.round(maxOfflineMs / 3_600_000)} ч
          {maxOfflineMs > DEFAULT_OFFLINE_MS && ' 🥥'}
        </div>
      </div>

      {/* Собрать пассив с прогресс-баром */}
      <div className="mb-4">
        {/* Прогресс-бар */}
        <div className="mb-2 h-2 rounded-full bg-[var(--tg-card)] overflow-hidden">
          <div
            className={`h-full transition-all ${isFull ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--tg-hint)] mb-2">
          <span>{fmt(pending)} / {fmt(cap)}</span>
          <span>
            {isFull
              ? '🔴 ЗАПОЛНЕНО — лишнее теряется'
              : `⏳ до заполнения: ${fmtTime(remainingMs)}`}
          </span>
        </div>

        <button
          onClick={collect}
          disabled={pending <= 0}
          className={`w-full py-5 rounded-2xl font-black text-lg transition ${
            pending > 0
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg active:scale-95'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          💰 Собрать +{fmt(collectBonus > 0 ? Math.floor(pending * (1 + collectBonus)) : pending)}
          {collectBonus > 0 && (
            <span className="ml-2 text-xs bg-white/25 px-2 py-0.5 rounded-full">
              🥑 +{Math.round(collectBonus * 100)}%
            </span>
          )}
        </button>
      </div>

      {/* Список генераторов */}
      <div className="space-y-2">
        {catalog.map(c => {
          const owned = ownedMap.get(c.id) ?? 0;
          const price = Number(c.price);
          const basePrice = c.basePrice ? Number(c.basePrice) : price;
          const hasDiscount = discount > 0 && basePrice > price;
          const affordable = balance >= price;
          return (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--tg-card)]">
              <div className="w-12 h-12 rounded-xl bg-[var(--tg-bg)] flex items-center justify-center text-2xl shrink-0">
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm flex items-center gap-2">
                  {c.label}
                  {owned > 0 && (
                    <span className="text-[10px] bg-brand text-white px-1.5 py-0.5 rounded-full">
                      ×{owned}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--tg-hint)]">
                  +{fmt(c.tapsPerMin)} тап/мин
                  {hasDiscount && (
                    <span className="ml-2 text-[10px] text-green-600 font-bold">
                      🍋 −{Math.round(discount * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <button
                disabled={!affordable}
                onClick={() => buy(c.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex flex-col items-end ${
                  affordable
                    ? 'bg-brand text-white active:scale-95'
                    : 'bg-gray-300 text-gray-500'
                }`}
              >
                {hasDiscount && (
                  <span className="text-[10px] line-through opacity-60 font-normal">
                    {fmt(basePrice)}
                  </span>
                )}
                <span>{fmt(price)}</span>
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}