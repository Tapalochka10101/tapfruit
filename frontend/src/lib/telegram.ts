// Используем глобальный window.Telegram (он появляется из telegram-web-app.js
// который подключается в index.html). Никакого npm-пакета не нужно.

const getWebApp = () => window.Telegram?.WebApp;

export const tg = getWebApp();
export const initData = getWebApp()?.initData ?? '';

// Side-effect: инициализация
if (tg) {
  tg.ready();
  tg.expand();
  try { tg.requestFullscreen?.(); } catch { /* older clients */ }
  tg.disableVerticalSwipes?.();
  tg.setHeaderColor?.('#ffffff');
}

export function applyTheme(mode: 'light' | 'dark' | 'tg') {
  const html = document.documentElement;
  const effective = mode === 'tg' ? (getWebApp()?.colorScheme ?? 'light') : mode;
  html.dataset.theme = effective;
  getWebApp()?.setHeaderColor?.(effective === 'dark' ? '#1c1c1e' : '#ffffff');
}

export function getStartParam(): string | null {
  try {
    const fromSdk = getWebApp()?.initDataUnsafe?.start_param;
    if (fromSdk) return fromSdk;
  } catch { /* ignore */ }
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('startapp') || url.searchParams.get('topup');
  } catch {
    return null;
  }
}
