import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store/useGameStore';
import { api } from '../lib/api';
import { useSettings } from '../store/useSettingsStore';
import { STRINGS } from '../lib/i18n';
import { fmtTime } from '../lib/format';
import { useHaptics } from '../hooks/useHaptics';

export function BananaBoostButton() {
  const activeSkin = useGame(s => s.activeSkin);
  const boostUntil = useGame(s => s.bananaBoostUntil);
  const cooldownUntil = useGame(s => s.bananaCooldownUntil);
  const setBanana = useGame(s => s.setBanana);
  const [, setTick] = useState(0);
  const lang = useSettings(s => s.lang);
  const t = STRINGS[lang];
  const haptics = useHaptics();

  useEffect(() => {
    const id = setInterval(() => setTick(x => x + 1), 500);
    return () => clearInterval(id);
  }, []);

  if (activeSkin !== 'banana') return null;

  const now = Date.now();
  const isActive = boostUntil != null && boostUntil > now;
  const onCooldown = !isActive && cooldownUntil != null && cooldownUntil > now;
  const ready = !isActive && !onCooldown;

  const activate = async () => {
    if (!ready) return;
    try {
      const r = await api.activateBanana();
      setBanana(r);
      haptics.success();
    } catch { haptics.error(); }
  };

  return (
    <motion.button
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={activate}
      disabled={!ready}
      className={`fixed bottom-28 left-1/2 -translate-x-1/2 px-7 py-4 rounded-3xl font-black text-base shadow-2xl z-40 transition ${
        isActive
          ? 'bg-yellow-400 text-black'
          : onCooldown
            ? 'bg-[var(--tg-card)] text-[var(--tg-hint)]'
            : 'bg-gradient-to-br from-yellow-300 to-amber-500 text-black active:scale-95'
      }`}
    >
      {isActive
        ? `🍌 ${t.bananaActive} · ${fmtTime(boostUntil! - now)}`
        : onCooldown
          ? `🍌 ${t.bananaCooldown} · ${fmtTime(cooldownUntil! - now)}`
          : `🍌 ${t.bananaReady}`}
    </motion.button>
  );
}