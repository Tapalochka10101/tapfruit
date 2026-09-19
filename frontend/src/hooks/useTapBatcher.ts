import { useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useGame } from '../store/useGameStore';

const FLUSH_MS = 1500;
const MAX_BUFFER = 50;

export function useTapBatcher() {
  const bufferRef = useRef<number>(0);
  const sessionStartIdxRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  // Сколько тапов сейчас "в полёте" (отправлены, но ответ не пришёл).
  const pendingRef = useRef<number>(0);

  const flush = async () => {
    if (inFlightRef.current) return;
    const count = bufferRef.current;
    if (count === 0) return;

    const startIdx = sessionStartIdxRef.current ?? useGame.getState().tapIndex;
    const endIdx = startIdx + count - 1;
    bufferRef.current = 0;
    sessionStartIdxRef.current = endIdx + 1;
    inFlightRef.current = true;
    pendingRef.current += count;

    try {
      const r = await api.tap({
        startIdx: String(startIdx),
        endIdx: String(endIdx),
        count,
      });
      pendingRef.current -= count;

      // Баланс НЕ синкаем — живёт локально (оптимистично).
      // С сервера берём только tapIndex/seed, чтобы батчи не рассинхронились.
      const patch: any = {
        tapIndex: Number(r.tapIndex),
      };
      if (r.rotated) patch.seed = Number(r.tapSeed);

      if (r.rejected) {
        sessionStartIdxRef.current = null;
        console.warn('[tap] rejected:', r.reason);
      }

      useGame.setState(patch);
    } catch (e) {
      pendingRef.current -= count;
      bufferRef.current += count;
      sessionStartIdxRef.current = startIdx;
      console.warn('[tap] flush failed', e);
    } finally {
      inFlightRef.current = false;
    }
  };

  const schedule = () => {
    if (timerRef.current != null) return;
    timerRef.current = window.setTimeout(async () => {
      timerRef.current = null;
      await flush();
    }, FLUSH_MS);
  };

  const push = (n = 1) => {
    bufferRef.current += n;
    if (bufferRef.current >= MAX_BUFFER) flush();
    else schedule();
  };

  useEffect(() => {
    const onVis = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { push, flush };
}