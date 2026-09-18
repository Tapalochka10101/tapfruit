type TgWebApp = {
  ready: () => void;
  expand: () => void;
  initData: string;
  colorScheme?: 'light' | 'dark';
  HapticFeedback?: {
    impactOccurred: (s: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred: (t: 'error' | 'success' | 'warning') => void;
  };
  setHeaderColor?: (c: string) => void;
  disableVerticalSwipes?: () => void;
};

const w = window as any;
export const tg: TgWebApp = w.Telegram?.WebApp ?? {
  ready: () => {},
  expand: () => {},
  initData: '',
};

tg.ready?.();
tg.expand?.();
try { tg.disableVerticalSwipes?.(); } catch {}
tg.setHeaderColor?.('#ffffff');

export const initData = tg.initData || '';

export function applyTheme(mode: 'light' | 'dark' | 'tg') {
  const html = document.documentElement;
  const effective = mode === 'tg' ? (tg.colorScheme ?? 'light') : mode;
  html.dataset.theme = effective;
  tg.setHeaderColor?.(effective === 'dark' ? '#1c1c1e' : '#ffffff');
}