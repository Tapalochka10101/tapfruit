import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../store/useGameStore';
import { fmt } from '../lib/format';

export function TopBar({
  onSettings,
  onDaily,
  showDaily,
  onSubscription,
}: {
  onSettings: () => void;
  onDaily: () => void;
  showDaily: boolean;
  onSubscription: () => void;
}) {
  const balance = useGame(s => s.balance);
  const subscriptionActive = useGame(s => s.subscriptionActive);
  const subscriptionUntil = useGame(s => s.subscriptionUntil);

  const daysLeft = subscriptionUntil
    ? Math.max(0, Math.ceil((subscriptionUntil - Date.now()) / 86400000))
    : 0;

  return (
    <div
      className="flex items-center justify-between px-4 pb-3 relative z-20"
      style={{ paddingTop: 60 }}
    >
      {/* ПОДПИСКА слева */}
      <button
        onClick={onSubscription}
        className={`px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition ${
          subscriptionActive
            ? 'bg-green-500/20 text-green-600'
            : 'bg-red-500/20 text-red-600'
        }`}
      >
        {subscriptionActive ? `✅ ${daysLeft} дн.` : '⚠️ Нет'}
      </button>

      {/* Баланс по центру */}
      <div className="flex flex-col items-center relative">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={balance}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="text-3xl font-black tabular-nums"
          >
            {fmt(balance)}
          </motion.div>
        </AnimatePresence>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--tg-hint)] mt-0.5">
          TAPS
        </div>
      </div>

      {/* Настройки + дейли справа */}
      <div className="flex gap-2">
        {showDaily && (
          <motion.button
            onClick={onDaily}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xl shadow-lg active:scale-95 transition"
            aria-label="daily"
          >📅</motion.button>
        )}
        <button
          onClick={onSettings}
          className="w-11 h-11 rounded-2xl bg-[var(--tg-card)] flex items-center justify-center text-xl active:scale-95 transition shadow-sm"
          aria-label="settings"
        >⚙️</button>
      </div>
    </div>
  );
}
