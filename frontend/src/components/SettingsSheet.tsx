import { Modal } from './Modal';
import { useSettings } from '../store/useSettingsStore';
import { useGame } from '../store/useGameStore';
import { STRINGS } from '../lib/i18n';
import { fmt } from '../lib/format';

const CHANNEL_URL = 'https://t.me/tapfruit_channel';

export function SettingsSheet({
  open,
  onClose,
  onOpenPromo,
  onOpenReferral,
}: {
  open: boolean;
  onClose: () => void;
  onOpenPromo: () => void;
  onOpenReferral: () => void;
}) {
  const s = useSettings();
  const t = STRINGS[s.lang];
  const game = useGame();

  const playtimeMin = Math.floor(game.playtimeMs / 60_000);
  const avgCps = (game.tapsThisSession && game.playtimeMs)
    ? (game.tapsThisSession / (game.playtimeMs / 1000)).toFixed(2)
    : '—';

  const openChannel = () => {
    try {
      // В Telegram Mini App открывает ссылку внутри Telegram
      (window as any).Telegram?.WebApp?.openTelegramLink?.(CHANNEL_URL);
      // Fallback для браузера
      if (!(window as any).Telegram?.WebApp?.openTelegramLink) {
        window.open(CHANNEL_URL, '_blank');
      }
    } catch {
      window.open(CHANNEL_URL, '_blank');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t.settings}>
      <div className="space-y-3">
        {/* Быстрые действия */}
        <button
          onClick={onOpenPromo}
          className="w-full py-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-sm active:scale-95 transition"
        >
          🎁 Ввести промокод
        </button>

        <button
          onClick={onOpenReferral}
          className="w-full py-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-700 text-white font-bold text-sm active:scale-95 transition"
        >
          🤝 Пригласить друзей (+5%)
        </button>

        {/* Канал */}
        <button
          onClick={openChannel}
          className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95 transition flex items-center justify-center gap-2"
        >
          📢 Наш канал
        </button>

        {/* Настройки */}
        <div className="pt-3 border-t border-black/5 space-y-1">
          <Row label={t.sound}><Toggle on={s.sound} onChange={s.setSound} /></Row>
          <Row label={t.vibration}><Toggle on={s.vibration} onChange={s.setVibration} /></Row>
          <Row label={t.particles}><Toggle on={s.particles} onChange={s.setParticles} /></Row>

          <Row label={t.theme}>
            <select
              value={s.theme}
              onChange={e => s.setTheme(e.target.value as any)}
              className="bg-[var(--tg-card)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="tg">{t.themeTg}</option>
              <option value="light">{t.themeLight}</option>
              <option value="dark">{t.themeDark}</option>
            </select>
          </Row>

          <Row label={t.language}>
            <select
              value={s.lang}
              onChange={e => s.setLang(e.target.value as any)}
              className="bg-[var(--tg-card)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
          </Row>
        </div>

        {/* Статистика */}
        <div className="pt-3 border-t border-black/5">
          <div className="text-xs uppercase text-[var(--tg-hint)] mb-2">{t.stats}</div>
          <Stat label={t.totalTaps} value={fmt(game.totalTaps)} />
          <Stat label={t.avgCps} value={avgCps} />
          <Stat label={t.playtime} value={`${playtimeMin} мин`} />
          <Stat label={t.registeredAt} value={new Date(game.createdAt).toLocaleDateString()} />
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-12 h-7 rounded-full p-1 transition ${on ? 'bg-brand' : 'bg-gray-300'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white transition ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-[var(--tg-hint)]">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}