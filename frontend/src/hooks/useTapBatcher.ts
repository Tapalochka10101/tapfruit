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

  const flush = async () => {
    if (inFlightRef.current) return;
    const count = bufferRef.current;
    if (count === 0) return;

    const startIdx = sessionStartIdxRef.current ?? useGame.getState().tapIndex;
    const endIdx = startIdx + count - 1;
    bufferRef.current = 0;
    sessionStartIdxRef.current = endIdx + 1;
    inFlightRef.current = true;

    try {
      const r = await api.tap({
        startIdx: String(startIdx),
        endIdx: String(endIdx),
        count,
      });
      useGame.getState().setFromTap(r);
      if (r.rejected) sessionStartIdxRef.current = null;
    } catch (e) {
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