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

      // Обновляем tapIndex/seed всегда — они монотонные и не «прыгают».
      const patch: any = {
        tapIndex: Number(r.tapIndex),
      };
      if (r.rotated) patch.seed = Number(r.tapSeed);

      // А balance перезаписываем ТОЛЬКО когда всё осело:
      // буфер пуст и в полёте не осталось других батчей.
      // Иначе мы бы затирали локальный оптимистичный баланс более старым серверным.
      // Если сервер отклонил — НЕ трогаем balance (иначе UI откатится),
      // просто сбрасываем индекс сессии.
      if (r.rejected) {
        sessionStartIdxRef.current = null;
        pendingRef.current -= count; // уже вычли выше, но оставим для страховки
      } else {
        const idle = bufferRef.current === 0 && pendingRef.current === 0;
        if (idle) {
          patch.balance = Number(r.balance);
        }
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