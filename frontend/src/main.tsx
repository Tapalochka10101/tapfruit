import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './lib/telegram';

// Telegram viewport → CSS-переменная (без expand, только реальная видимая высота)
(function setupTelegramViewport() {
  const tg = (window as any).Telegram?.WebApp;
  const setH = () => {
    const h =
      (tg && (tg.viewportStableHeight || tg.viewportHeight)) ||
      window.innerHeight;
    document.documentElement.style.setProperty('--tg-viewport-height', `${h}px`);
  };
  setH();
  if (tg) {
    tg.ready?.();
    tg.onEvent?.('viewportChanged', setH);
  }
  window.addEventListener('resize', setH);
  window.addEventListener('orientationchange', setH);
})();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
