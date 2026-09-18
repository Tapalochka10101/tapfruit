import { tg } from '../lib/telegram';
import { useSettings } from '../store/useSettingsStore';

export function useHaptics() {
  const enabled = useSettings(s => s.vibration);
  return {
    tap: () => { if (enabled) tg.HapticFeedback?.impactOccurred('light'); },
    crit: () => { if (enabled) tg.HapticFeedback?.notificationOccurred('success'); },
    success: () => { if (enabled) tg.HapticFeedback?.notificationOccurred('success'); },
    error: () => { if (enabled) tg.HapticFeedback?.notificationOccurred('error'); },
  };
}