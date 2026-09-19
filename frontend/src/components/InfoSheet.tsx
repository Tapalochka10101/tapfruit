type Props = { open: boolean; onClose: () => void };

export function InfoSheet({ open, onClose }: Props) {
  if (!open) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--tg-card)] rounded-t-3xl p-5 pb-8 max-h-[80vh] overflow-y-auto"
        onClick={stop}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black">Информация</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 text-lg font-bold"
          >✕</button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <div>
            <div className="font-bold mb-1">Политика конфиденциальности</div>
            <a
              href="https://telegra.ph/Politika-konfidencialnosti-09-19-56"
              target="_blank"
              rel="noreferrer"
              className="text-violet-500 underline break-all"
            >telegra.ph/Politika-konfidencialnosti-09-19-56</a>
          </div>

          <div>
            <div className="font-bold mb-1">Пользовательское соглашение</div>
            <a
              href="https://telegra.ph/Polzovatelskoe-soglashenie-09-19-67"
              target="_blank"
              rel="noreferrer"
              className="text-violet-500 underline break-all"
            >telegra.ph/Polzovatelskoe-soglashenie-09-19-67</a>
          </div>

          <div>
            <div className="font-bold mb-1">Контакты поддержки</div>
            <a
              href="https://t.me/yolotag52"
              target="_blank"
              rel="noreferrer"
              className="text-violet-500 underline"
            >@yolotag52</a>
          </div>

          <div>
            <div className="font-bold mb-1">Актуальный тариф</div>
            <div>100 ₽ = 3 дня подписки на игру</div>
          </div>
        </div>
      </div>
    </div>
  );
}
