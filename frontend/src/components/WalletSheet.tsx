import { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useSettings } from '../store/useSettingsStore';
import { STRINGS } from '../lib/i18n';
import { fmt } from '../lib/format';

const RATE = 50;
const MIN_RUB = 50;

export function WalletSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lang = useSettings(s => s.lang);
  const t = STRINGS[lang];
  const [raw, setRaw] = useState('100');
  const [stubImg, setStubImg] = useState<string | null>(null);

  const amount = Math.floor(Number(raw) || 0);
  const valid = amount >= MIN_RUB && amount <= 100_000;

  const deposit = async () => {
    if (!valid) return;
    const r = await api.deposit(amount);
    setStubImg(r.stubImageUrl);
  };

  return (
    <Modal open={open} onClose={() => { setStubImg(null); onClose(); }} title={t.wallet}>
      {stubImg ? (
        <div className="space-y-3">
          <img src={stubImg} alt="stub" className="w-full rounded-2xl" />
          <p className="text-center text-sm text-[var(--tg-hint)]">
            Заглушка. Здесь будет интерфейс оплаты по СБП.
          </p>
          <button
            onClick={() => setStubImg(null)}
            className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold"
          >{t.cancel}</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--tg-hint)]">{t.amount}</label>
            <input
              inputMode="numeric"
              pattern="\d*"
              value={raw}
              onChange={e => setRaw(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-1 w-full px-4 py-3 rounded-2xl bg-[var(--tg-card)] text-2xl font-extrabold tabular-nums outline-none"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-[var(--tg-hint)]">Вы получите</span>
            <span className="font-bold">{fmt(amount * RATE)} TAPS</span>
          </div>
          <div className="text-xs text-[var(--tg-hint)]">
            Курс: 1 ₽ = {RATE} тапсов · {t.minAmount}
          </div>

          <button
            disabled={!valid}
            onClick={deposit}
            className={`w-full py-4 rounded-2xl font-extrabold text-lg ${
              valid ? 'bg-brand text-white active:scale-95' : 'bg-gray-300 text-gray-500'
            } transition`}
          >{t.sbp}</button>
        </div>
      )}
    </Modal>
  );
}