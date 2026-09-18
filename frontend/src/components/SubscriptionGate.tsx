import { useState } from 'react';
import { useGame } from '../store/useGameStore';
import { api } from '../lib/api';

const PLANS = [
  { rub: 100, days: 3 },
  { rub: 500, days: 15 },
  { rub: 1000, days: 30 },
];

export function SubscriptionGate() {
  const [selected, setSelected] = useState<number | null>(null);
  const [customRub, setCustomRub] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balanceRub = useGame(s => s.balanceRub);

  const submit = async (rub: number) => {
    if (rub < 100) { setError('Минимум 100 ₽'); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await api.deposit(rub);
      // TODO: когда подключишь кассу — здесь будет redirect на payUrl
      // window.location.href = r.payUrl;
      setError(`Платёж на ${rub}₽ создан. Подключение кассы — следующий шаг.`);
    } catch (e: any) {
      setError(e?.message || 'Ошибка создания платежа');
    } finally {
      setLoading(false);
    }
  };

  const finalRub = selected ?? (customRub ? Number(customRub) : 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-amber-50 to-orange-100">
      <div className="text-6xl mb-4">🍎</div>
      <h1 className="text-2xl font-black mb-2">Чтобы начать игру</h1>
      <p className="text-gray-700 mb-6 max-w-xs">
        Вам необходимо купить подписку, пожалуйста пополните баланс
      </p>

      <div className="text-lg mb-6 px-4 py-2 bg-white rounded-xl shadow">
        💰 Текущий баланс: <b>{balanceRub.toFixed(2)}₽</b>
      </div>

      <div className="grid gap-3 w-full max-w-sm mb-4">
        {PLANS.map(p => (
          <button
            key={p.rub}
            onClick={() => { setSelected(p.rub); setCustomRub(''); }}
            className={`p-4 rounded-2xl border-2 font-bold transition ${
              selected === p.rub
                ? 'border-orange-500 bg-orange-100 text-orange-900'
                : 'border-gray-300 bg-white text-gray-800'
            }`}
          >
            {p.rub}₽ = {p.days} дней доступа
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm mb-4">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Своя сумма (от 100₽)"
          value={customRub}
          onChange={e => { setCustomRub(e.target.value); setSelected(null); }}
          className="w-full p-4 rounded-2xl border-2 border-gray-300 bg-white text-center font-bold"
        />
      </div>

      {error && (
        <div className={`mb-4 text-sm px-4 py-2 rounded-xl ${error.includes('создан') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      <button
        disabled={loading || finalRub < 100}
        onClick={() => submit(finalRub)}
        className="w-full max-w-sm p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black text-lg disabled:opacity-50 active:scale-95 transition"
      >
        {loading ? 'Создаём платёж...' : 'ПОПОЛНИТЬ'}
      </button>

      <p className="text-xs text-gray-500 mt-4 max-w-xs">
        Выберите удобный способ оплаты (СБП +8,5%)
      </p>
    </div>
  );
}
