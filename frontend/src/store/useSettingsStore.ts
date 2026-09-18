import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '../lib/i18n';
import { applyTheme } from '../lib/telegram';

export type ThemeMode = 'light' | 'dark' | 'tg';

type State = {
  lang: Lang;
  sound: boolean;
  soundId: 'click' | 'pop';
  vibration: boolean;
  theme: ThemeMode;
  particles: boolean;
  setLang(l: Lang): void;
  setSound(v: boolean): void;
  setSoundId(v: 'click' | 'pop'): void;
  setVibration(v: boolean): void;
  setTheme(t: ThemeMode): void;
  setParticles(v: boolean): void;
};

export const useSettings = create<State>()(
  persist(
    (set) => ({
      lang: 'ru',
      sound: true,
      soundId: 'pop',
      vibration: true,
      theme: 'tg',
      particles: true,
      setLang: (lang) => set({ lang }),
      setSound: (sound) => set({ sound }),
      setSoundId: (soundId) => set({ soundId }),
      setVibration: (vibration) => set({ vibration }),
      setTheme: (theme) => { applyTheme(theme); set({ theme }); },
      setParticles: (particles) => set({ particles }),
    }),
    {
      name: 'tapfruit.settings',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);