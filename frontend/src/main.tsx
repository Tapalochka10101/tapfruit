import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './lib/telegram';

// === Telegram viewport → CSS-переменная --tg-viewport-height ===
(function setupTelegramViewport() {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;

  const setH = () => {
    const h = tg.viewportStableHeight || tg.viewportHeight || window.innerHeight;
    document.documentElement.style.setProperty('--tg-viewport-height', `${h}px`);
  };

  tg.ready();
  tg.expand?.();
  setH();

  tg.onEvent?.('viewportChanged', setH);
  window.addEventListener('resize', setH);
  window.addEventListener('orientationchange', setH);
})();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);