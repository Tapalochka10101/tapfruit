import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useGame } from '../store/useGameStore';
import { fmt } from '../lib/format';
import { useHaptics } from '../hooks/useHaptics';

type Status = {
  canClaim: boolean;
  currentStreak: number;
  nextStreak: number;
  nextReward: string;
  streakTable: { day: number; reward: string }[];
};

export function DailyStreakSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  const haptics = useHaptics();

  const setBalance = useGame(s => s.setBalance);
  const setDaily = useGame(s => s.setDaily);

  useEffect(() => {
    if (!open) return;
    api.getDailyStatus().then(setStatus).catch(() => {});
  }, [open]);

  const claim = async () => {
    if (!status?.canClaim || claiming) return;
    setClaiming(true);
    try {
      const r = await api.claimDailyStreak();
      setBalance(Number(r.balance));
      setDaily(r.streak, false);
      setJustClaimed(r.reward);
      haptics.success();
      // обновляем статус
      const s = await api.getDailyStatus();
      setStatus(s);
    } catch (e: any) {
      haptics.error();
      alert(e?.body?.error || 'Error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="📅 Ежедневная награда">
      {!status ? (
        <div className="py-10 text-center text-[var(--tg-hint)]">Загрузка...</div>
      ) : (
        <>
          <div className="mb-4 p-5 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white text-center">
            <div className="text-5xl mb-2">🔥</div>
            <div className="text-3xl font-black">Стрик {status.currentStreak} дн.</div>
            <div className="text-xs opacity-90 mt-1">Заходи каждый день — награда растёт</div>
          </div>

          {/* Таблица стриков */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {status.streakTable.map(d => {
              const isCurrent = d.day === status.currentStreak;
              const isPast = d.day < status.currentStreak;
              const isNext = d.day === status.nextStreak && status.canClaim;
              return (
                <div
                  key={d.day}
                  className={`p-2 rounded-xl text-center text-xs transition ${
                    isCurrent ? 'bg-green-500 text-white' :
                    isPast ? 'bg-brand/30 text-brand' :
                    isNext ? 'bg-yellow-400 text-black ring-2 ring-yellow-300' :
                    'bg-[var(--tg-card)] text-[var(--tg-hint)]'
                  }`}
                >
                  <div className="text-lg font-black">{d.day}</div>
                  <div className="text-[10px]">{fmt(d.reward)}</div>
                </div>
              );
            })}
          </div>

          {/* Кнопка */}
          <button
            onClick={claim}
            disabled={!status.canClaim || claiming}
            className={`w-full py-5 rounded-2xl font-black text-lg transition ${
              status.canClaim && !claiming
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg active:scale-95'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            {claiming
              ? '...'
              : status.canClaim
                ? `🎁 Забрать +${fmt(status.nextReward)}`
                : '✅ Уже забрано — приходи завтра'}
          </button>

          {justClaimed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-center py-3 rounded-2xl bg-green-500 text-white font-bold"
            >
              🎉 +{fmt(justClaimed)} тапсов
            </motion.div>
          )}

          <div className="mt-4 text-xs text-[var(--tg-hint)] text-center">
            Пропустил день → стрик сбрасывается на 1
          </div>
        </>
      )}
    </Modal>
  );
}