import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useGame } from '../store/useGameStore';
import { fmt } from '../lib/format';
import { useHaptics } from '../hooks/useHaptics';

type CaseItem = { id: string; label: string; emoji: string; price: string; color: string };
type Prize =
  | { kind: 'taps'; amount: string }
  | { kind: 'chips'; amount: string }
  | { kind: 'skin'; skinId: string; alreadyOwned: boolean };

export function CasesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [catalog, setCatalog] = useState<CaseItem[]>([]);
  const [opening, setOpening] = useState<string | null>(null);
  const [prize, setPrize] = useState<Prize | null>(null);
  const haptics = useHaptics();

  const balance = useGame(s => s.balance);
  const setBalance = useGame(s => s.setBalance);
  const setChips = useGame(s => s.setChips);

  useEffect(() => {
    if (!open) return;
    api.getCases().then(r => {
      setCatalog(r.catalog);
      setBalance(Number(r.balance));
      setChips(Number(r.chips));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openCase = async (id: string) => {
    if (opening) return;
    setOpening(id);
    setPrize(null);
    haptics.tap();
    try {
      // небольшая задержка для анимации
      await new Promise(r => setTimeout(r, 900));
      const r = await api.openCase(id);
      setBalance(Number(r.balance));
      setChips(Number(r.chips));
      setPrize(r.prize);
      haptics.success();
    } catch (e: any) {
      haptics.error();
      alert(e?.body?.error || 'Error');
    } finally {
      setOpening(null);
    }
  };

  const closePrize = () => setPrize(null);

  return (
    <Modal open={open} onClose={onClose} title="📦 Сундуки">
      <AnimatePresence>
        {prize && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
            onClick={closePrize}
          >
            <div className="bg-[var(--tg-bg)] rounded-3xl p-6 max-w-xs w-full text-center">
              <div className="text-6xl mb-3">
                {prize.kind === 'skin' ? '🎨' : prize.kind === 'chips' ? '🪙' : '💰'}
              </div>
              <div className="text-xs uppercase text-[var(--tg-hint)] mb-2">Твой приз</div>
              <div className="text-2xl font-black mb-4">
                {prize.kind === 'taps' && `+${fmt(prize.amount)} тапсов`}
                {prize.kind === 'chips' && `+${fmt(prize.amount)} фишек`}
                {prize.kind === 'skin' && (
                  prize.alreadyOwned
                    ? `Скин уже был — компенсация`
                    : `Скин: ${prize.skinId}`
                )}
              </div>
              <button
                onClick={closePrize}
                className="w-full py-3 rounded-2xl bg-brand text-white font-bold active:scale-95 transition"
              >Забрать</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-700 text-white">
        <div className="text-xs opacity-80 mb-1">Баланс</div>
        <div className="text-2xl font-black">💰 {fmt(balance)}</div>
        <div className="text-xs opacity-80 mt-1">Открывай сундуки и получай призы</div>
      </div>

      <div className="space-y-3">
        {catalog.map(c => {
          const price = Number(c.price);
          const affordable = balance >= price;
          const isOpening = opening === c.id;
          return (
            <button
              key={c.id}
              disabled={!affordable || !!opening}
              onClick={() => openCase(c.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition ${
                affordable && !opening
                  ? 'bg-[var(--tg-card)] active:scale-95'
                  : 'bg-gray-200 text-gray-400'
              }`}
              style={affordable ? { borderLeft: `4px solid ${c.color}` } : undefined}
            >
              <motion.div
                animate={isOpening ? { rotate: [0, 20, -20, 20, 0], scale: [1, 1.2, 1.2, 1.2, 1] } : {}}
                transition={isOpening ? { duration: 0.9 } : {}}
                className="text-4xl shrink-0"
              >
                {c.emoji}
              </motion.div>
              <div className="flex-1 text-left">
                <div className="font-bold">{c.label}</div>
                <div className="text-xs text-[var(--tg-hint)]">
                  {isOpening ? 'Открываем...' : fmt(price) + ' тапсов'}
                </div>
              </div>
              <div className="text-xs font-bold px-3 py-2 rounded-xl bg-brand text-white">
                {isOpening ? '...' : 'Открыть'}
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}