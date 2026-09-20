import { useState } from 'react';
import { Modal } from './Modal';
import { useGame } from '../store/useGameStore';
import { fmt } from '../lib/format';

type SecretGame = 'durak' | 'checkers';

export function SecretGamesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chips = useGame(s => s.chips);
  const [selected, setSelected] = useState<SecretGame | null>(null);

  const close = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="🕹 Секретные игры">
      <div className="mb-4 p-3 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
        <div className="text-xs opacity-70 mb-1">Фишки</div>
        <div className="text-2xl font-black tabular-nums">🪙 {fmt(chips)}</div>
      </div>

      {!selected ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelected('durak')}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-[var(--tg-card)] active:scale-95 transition"
          >
            <span className="text-4xl">🃏</span>
            <span className="font-bold text-sm">Дурак</span>
            <span className="text-[10px] text-[var(--tg-hint)]">+100% / −100%</span>
          </button>
          <button
            onClick={() => setSelected('checkers')}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-[var(--tg-card)] active:scale-95 transition"
          >
            <span className="text-4xl">⚫</span>
            <span className="font-bold text-sm">Шашки</span>
            <span className="text-[10px] text-[var(--tg-hint)]">+50% / −100%</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center text-2xl font-black">
            {selected === 'durak' ? '🃏 Дурак' : '⚫ Шашки'}
          </div>
          <div className="text-center py-6 text-[var(--tg-hint)]">
            Скоро…
          </div>
          <button
            onClick={() => setSelected(null)}
            className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95"
          >← Назад</button>
        </div>
      )}
    </Modal>
  );
}
