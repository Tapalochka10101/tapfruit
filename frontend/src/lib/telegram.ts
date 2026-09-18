import WebApp from '@twa-dev/sdk';

WebApp.ready();
WebApp.expand();
try { WebApp.requestFullscreen?.(); } catch { /* older clients */ }
WebApp.disableVerticalSwipes?.();
WebApp.setHeaderColor?.('#ffffff');

export const tg = WebApp;
export const initData = WebApp.initData;

export function applyTheme(mode: 'light' | 'dark' | 'tg') {
  const html = document.documentElement;
  const effective = mode === 'tg' ? (WebApp.colorScheme ?? 'light') : mode;
  html.dataset.theme = effective;
  WebApp.setHeaderColor?.(effective === 'dark' ? '#1c1c1e' : '#ffffff');
}

export function getStartParam(): string | null {
  try {
    const fromSdk = WebApp.initDataUnsafe?.start_param;
    if (fromSdk) return fromSdk;
  } catch { /* ignore */ }
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('startapp') || url.searchParams.get('topup');
  } catch {
    return null;
  }
}
