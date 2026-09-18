import { useRef, useCallback } from 'react';
import { useSettings } from '../store/useSettingsStore';

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabled = useSettings(s => s.sound);
  const soundId = useSettings(s => s.soundId);

  const play = useCallback((type: 'tap' | 'crit') => {
    if (!enabled) return;
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);

    if (type === 'crit') {
      o.type = 'triangle';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
    } else {
      o.type = soundId === 'click' ? 'square' : 'sine';
      o.frequency.setValueAtTime(soundId === 'click' ? 220 : 440, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.05);
    }
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    o.start();
    o.stop(ctx.currentTime + 0.11);
  }, [enabled, soundId]);

  return { play };
}