import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { fmt } from '../lib/format';
import { useHaptics } from '../hooks/useHaptics';

export function ReferralSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [link, setLink] = useState('');
  const [count, setCount] = useState(0);
  const [earnings, setEarnings] = useState('0');
  const [copied, setCopied] = useState(false);
  const haptics = useHaptics();

  useEffect(() => {
    if (!open) return;
    api.getReferrals().then(r => {
      setLink(r.link);
      setCount(r.referredCount);
      setEarnings(r.earnings);
    }).catch(() => {});
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      haptics.success();
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const share = () => {
    const text = '🍎 Играю в Tap Fruit — присоединяйся!';
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <Modal open={open} onClose={onClose} title="🤝 Пригласи друзей">
      {/* Сводка */}
      <div className="mb-4 p-5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-700 text-white text-center">
        <div className="text-5xl mb-2">🤝</div>
        <div className="text-2xl font-black mb-1">+5% с каждого тапа</div>
        <div className="text-sm opacity-90">приглашённого — навсегда</div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-4 rounded-2xl bg-[var(--tg-card)] text-center">
          <div className="text-xs text-[var(--tg-hint)] mb-1">Приглашено</div>
          <div className="text-2xl font-black">{count}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--tg-card)] text-center">
          <div className="text-xs text-[var(--tg-hint)] mb-1">Заработано</div>
          <div className="text-2xl font-black">{fmt(earnings)}</div>
        </div>
      </div>

      {/* Ссылка */}
      <div className="mb-4">
        <div className="text-xs text-[var(--tg-hint)] mb-2">Твоя реферальная ссылка</div>
        <div className="p-3 rounded-2xl bg-[var(--tg-card)] text-xs font-mono break-all select-all">
          {link || '—'}
        </div>
      </div>

      {/* Кнопки */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={copy}
          className="py-4 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95 transition"
        >
          {copied ? '✓ Скопировано' : '📋 Скопировать'}
        </button>
        <button
          onClick={share}
          className="py-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm active:scale-95 transition"
        >
          ✈️ Поделиться
        </button>
      </div>
    </Modal>
  );
}