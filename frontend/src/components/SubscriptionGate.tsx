import { useState } from 'react';
import { useGame } from '../store/useGameStore';

const PLANS = [
  { rub: 100, days: 3, label: '3 дня' },
  { rub: 500, days: 15, label: '15 дней' },
  { rub: 1000, days: 30, label: '30 дней' },
];

const SBP_STUB_IMAGE = 'https://masterpiecer-images.s3.yandex.net/5fcf62e03cf6297:upscaled';

export function SubscriptionGate() {
  const rawBalance = useGame(s => s.balanceRub);
  const safeBalance = typeof rawBalance === 'number' && isFinite(rawBalance) ? rawBalance : 0;

  const [step, setStep] = useState<'plan' | 'method' | 'sbp'>('plan');
  const [selected, setSelected] = useState<number | null>(null);
  const [customRub, setCustomRub] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totalRub = selected ?? (customRub ? Number(customRub) : 0);

  const proceedToMethod = () => {
    if (!totalRub || totalRub < 100) {
      setError('Минимальная сумма — 100 ₽');
      return;
    }
    setError(null);
    setStep('method');
  };

  if (step === 'plan') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-amber-50 to-orange-100 overflow-y-auto"
        style={{ minHeight: 'var(--tg-viewport-height, 100dvh)', paddingTop: 60 }}>
        <div className="text-5xl mb-3">🍎</div>
        <h1 className="text-xl font-black mb-2">Чтобы начать игру</h1>
        <p className="text-sm text-gray-700 mb-4 max-w-xs">
          Купи подписку и пополни баланс
        </p>

        <div className="text-base mb-4 px-4 py-2 bg-white rounded-xl shadow">
          💰 Баланс: <b>{safeBalance.toFixed(2)}₽</b>
        </div>

        <div className="grid gap-2 w-full max-w-sm mb-3">
          {PLANS.map(p => (
            <button
              key={p.rub}
              onClick={() => { setSelected(p.rub); setCustomRub(''); setError(null); }}
              className={`p-3 rounded-2xl border-2 font-bold text-sm transition ${
                selected === p.rub
                  ? 'border-orange-500 bg-orange-100 text-orange-900'
                  : 'border-gray-300 bg-white text-gray-800'
              }`}
            >
              {p.rub}₽ = {p.label}
            </button>
          ))}
        </div>

        <input
          type="number"
          inputMode="numeric"
          placeholder="Своя сумма (от 100₽)"
          value={customRub}
          onChange={e => { setCustomRub(e.target.value); setSelected(null); setError(null); }}
          className="w-full max-w-sm p-3 mb-3 rounded-2xl border-2 border-gray-300 bg-white text-center font-bold text-sm"
        />

        {error && (
          <div className="mb-3 text-sm px-4 py-2 rounded-xl bg-red-100 text-red-700">
            {error}
          </div>
        )}

        <button
          disabled={!totalRub || totalRub < 100}
          onClick={proceedToMethod}
          className="w-full max-w-sm p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-base disabled:opacity-50 active:scale-95 transition"
        >
          ПОПОЛНИТЬ
        </button>
      </div>
    );
  }

  if (step === 'method') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-amber-50 to-orange-100"
        style={{ minHeight: 'var(--tg-viewport-height, 100dvh)', paddingTop: 60 }}>
        <h1 className="text-xl font-black mb-2">Способ оплаты</h1>
        <p className="text-sm text-gray-700 mb-6">К оплате: <b>{totalRub}₽</b></p>

        <button
          onClick={() => setStep('sbp')}
          className="w-full max-w-sm p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-base active:scale-95 transition"
        >
          СБП +8,5%
        </button>

        <button
          onClick={() => setStep('plan')}
          className="mt-4 text-gray-600 underline text-sm"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-black"
        style={{ minHeight: 'var(--tg-viewport-height, 100dvh)', paddingTop: 60 }}>
      <img
        src={SBP_STUB_IMAGE}
        alt="Оплата СБП"
        className="max-w-full max-h-[60vh] rounded-2xl"
      />
      <p className="text-white mt-4 text-xs opacity-70">
        Оплата СБП — будет подключена позже
      </p>
      <button
        onClick={() => setStep('plan')}
        className="mt-4 px-6 py-3 rounded-2xl bg-white/10 text-white font-bold active:scale-95 transition"
      >
        Закрыть
      </button>
    </div>
  );
}
