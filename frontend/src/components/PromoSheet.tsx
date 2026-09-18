import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useGame } from '../store/useGameStore';
import { useHaptics } from '../hooks/useHaptics';
import { fmt } from '../lib/format';

const STUB_IMG = 'https://99px.ru/sstorage/53/2018/01/tmb_218546_200186.jpg';

type Result =
  | { type: 'success'; reward: string; balance: string; label: string; showImage: boolean }
  | { type: 'error'; message: string };

export function PromoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [showImage, setShowImage] = useState(false);
  const setBalance = useGame(s => s.setBalance);
  const haptics = useHaptics();

  const submit = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await api.redeemPromo(code.trim());
      setBalance(Number(r.balance));
      setResult({
        type: 'success',
        reward: r.reward,
        balance: r.balance,
        label: r.label,
        showImage: r.showImage,
      });
      if (r.showImage) setShowImage(true);
      haptics.success();
      setCode('');
    } catch (e: any) {
      const err = e?.body?.error || 'network';
      const msg =
        err === 'invalid_promo' ? 'Промокод не найден' :
        err === 'limit_reached' ? 'Ты уже использовал этот промокод максимально' :
        'Ошибка. Попробуй ещё раз';
      setResult({ type: 'error', message: msg });
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setCode('');
    setResult(null);
    setShowImage(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="🎁 Промокод">
      {showImage ? (
        <div className="space-y-3">
          <img src={STUB_IMG} alt="promo" className="w-full rounded-2xl" />
          <button
            onClick={() => setShowImage(false)}
            className="w-full py-3 rounded-2xl bg-brand text-white font-bold active:scale-95 transition"
          >Продолжить</button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--tg-hint)] text-center">
            Введи промокод из нашего канала
          </p>

          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Например: bobik"
            className="w-full px-4 py-4 rounded-2xl bg-[var(--tg-card)] text-center text-lg font-bold outline-none uppercase tracking-wider"
            onKeyDown={e => e.key === 'Enter' && submit()}
          />

          <button
            onClick={submit}
            disabled={!code.trim() || loading}
            className={`w-full py-4 rounded-2xl font-black text-lg transition ${
              code.trim() && !loading
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white active:scale-95'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            {loading ? '...' : '🎁 Активировать'}
          </button>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-center py-4 rounded-2xl font-bold ${
                  result.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {result.type === 'success'
                  ? `🎉 Получено +${fmt(result.reward)} тапсов!`
                  : `😢 ${result.message}`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Modal>
  );
}