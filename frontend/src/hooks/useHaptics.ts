import { useMemo } from 'react';

type HF = {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
};

const getHf = (): HF | undefined => {
  try {
    return (window.Telegram?.WebApp as any)?.HapticFeedback;
  } catch {
    return undefined;
  }
};

export function useHaptics() {
  return useMemo(() => ({
    tap: () => getHf()?.impactOccurred('light'),
    crit: () => getHf()?.impactOccurred('heavy'),
    success: () => getHf()?.notificationOccurred('success'),
    error: () => getHf()?.notificationOccurred('error'),
    select: () => getHf()?.selectionChanged(),
  }), []);
}
