import { useGame } from '../store/useGameStore';

export function SubscriptionInfoSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const subscriptionActive = useGame(s => s.subscriptionActive);
  const subscriptionUntil = useGame(s => s.subscriptionUntil);
  const balanceRub = useGame(s => s.balanceRub) ?? 0;

  if (!open) return null;

  const daysLeft = subscriptionUntil
    ? Math.max(0, Math.ceil((subscriptionUntil - Date.now()) / 86400000))
    : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60"
      onClick={onClose}
    >
      <div
        className="max-w-sm w-full bg-white rounded-3xl p-6 text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {subscriptionActive ? (
          <>
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-black text-green-600 mb-3">
              У вас активна подписка
            </h2>
            <p className="text-gray-600 mb-2">Можете играть спокойно 🍎</p>
            <div className="bg-green-50 rounded-2xl p-3 mt-4">
              <div className="text-sm text-gray-600">Осталось дней</div>
              <div className="text-3xl font-black text-green-600">{daysLeft}</div>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3">⚠️</div>
            <h2 className="text-xl font-black text-red-600 mb-3">
              Подписка неактивна
            </h2>
            <p className="text-gray-600 mb-4">Чтобы играть, пополните баланс</p>
            <div className="bg-red-50 rounded-2xl p-3">
              <div className="text-sm text-gray-600">Текущий баланс</div>
              <div className="text-2xl font-black text-red-600">
                {balanceRub.toFixed(2)}₽
              </div>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black active:scale-95 transition"
        >
          ОК
        </button>
      </div>
    </div>
  );
}
