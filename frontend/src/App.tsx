import { useEffect, useRef, useState, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { SubscriptionGate } from './components/SubscriptionGate';
import { getStartParam } from './lib/telegram';
import { SubscriptionInfoSheet } from './components/SubscriptionInfoSheet';
import { Apple } from './components/Apple';
import { Particles, type Particle } from './components/Particles';
import { FloatingTexts, type Floating } from './components/FloatingText';
import { ShopSheet } from './components/ShopSheet';
import { SettingsSheet } from './components/SettingsSheet';
import { WalletSheet } from './components/WalletSheet';
import { MinigamesSheet } from './components/MinigamesSheet';
import { GeneratorsSheet } from './components/GeneratorsSheet';
import { PromoSheet } from './components/PromoSheet';
import { ReferralSheet } from './components/ReferralSheet';
import { DailyStreakSheet } from './components/DailyStreakSheet';
import { BananaBoostButton } from './components/BananaBoostButton';
import { useGame } from './store/useGameStore';
import { useSettings } from './store/useSettingsStore';
import { useTapBatcher } from './hooks/useTapBatcher';
import { useHaptics } from './hooks/useHaptics';
import { useSound } from './hooks/useSound';
import { rollCrit } from './lib/prng';
import { GAME_CONFIG } from './lib/gameConfig';

let uid = 0;

export default function App() {
  const ready = useGame(s => s.ready);
  const subscriptionActive = useGame(s => s.subscriptionActive);
  const init = useGame(s => s.init);
  const activeSkin = useGame(s => s.activeSkin);
  const upgradeLevel = useGame(s => s.upgradeLevel);
  const seed = useGame(s => s.seed);
  const boostUntil = useGame(s => s.bananaBoostUntil);
  const registerTap = useGame(s => s.registerTap);
  const addOptimistic = useGame(s => s.addOptimistic);
  const canClaimDaily = useGame(s => s.canClaimDaily);

  const particlesEnabled = useSettings(s => s.particles);
  const haptics = useHaptics();
  const { play } = useSound();
  const batcher = useTapBatcher();

  const [particles, setParticles] = useState<Particle[]>([]);
  const [floaters, setFloaters] = useState<Floating[]>([]);
  const sessionIdxRef = useRef(0);

  useEffect(() => {
    init().catch(e => console.error('init failed', e));
    const start = Date.now();
    const id = setInterval(() => useGame.setState({ playtimeMs: Date.now() - start }), 5000);
    return () => clearInterval(id);
  }, [init]);

  const onTap = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!ready) return;
    const x = e.clientX;
    const y = e.clientY;

    const skin = useGame.getState().activeSkin;
    let critChance = 0;
    if (skin === 'pear') critChance = GAME_CONFIG.pearCritChance;
    if (skin === 'strawberry') critChance = GAME_CONFIG.strawberryCritChance;
    if (skin === 'blueberry') critChance = GAME_CONFIG.blueberryCritChance;

    const idx = useGame.getState().tapIndex + sessionIdxRef.current;
    const isCrit = rollCrit(seed, idx, critChance);
    sessionIdxRef.current++;

    const upgradeMult = GAME_CONFIG.upgradeMultipliers[upgradeLevel] ?? 1;
    const bananaActive = boostUntil != null && boostUntil > Date.now();
    const boostMult = bananaActive ? 5 : 1;
    const base = isCrit ? GAME_CONFIG.critValue : 1;
    const value = Math.round(base * upgradeMult * boostMult);

    addOptimistic(value);
    registerTap();
    batcher.push(1);

    if (isCrit) { haptics.crit(); play('crit'); }
    else { haptics.tap(); play('tap'); }

    const f: Floating = { id: ++uid, x, y, text: `+${value}`, crit: isCrit };
    setFloaters(cur => [...cur, f]);
    setTimeout(() => setFloaters(cur => cur.filter(p => p.id !== f.id)), 900);

    if (particlesEnabled) {
      const newP: Particle[] = Array.from({ length: isCrit ? 12 : 7 }, () => ({
        id: ++uid, x, y,
        angle: Math.random() * Math.PI * 2,
        distance: 50 + Math.random() * 60,
        emoji: isCrit ? '⭐' : ['🍎', '🍊', '✨', '💫', '🌟'][Math.floor(Math.random() * 5)],
      }));
      setParticles(cur => [...cur, ...newP]);
      setTimeout(() => {
        const ids = new Set(newP.map(p => p.id));
        setParticles(cur => cur.filter(p => !ids.has(p.id)));
      }, 800);
    }
  }, [ready, seed, upgradeLevel, boostUntil, particlesEnabled, addOptimistic, registerTap, batcher, haptics, play]);

  // 🚪 Если подписка неактивна — показываем гейт вместо игры
  const forceTopup = getStartParam() === 'topup';
  if (ready && (!subscriptionActive || forceTopup)) {
    return <SubscriptionGate />;
  }

  const [shopOpen, setShopOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [gensOpen, setGensOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [subscriptionInfoOpen, setSubscriptionInfoOpen] = useState(false);

  return (
    <div
      className="flex flex-col relative overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <div className="app-bg"><div className="blob3" /></div>

      {/* Тап-таргет поверх всего полотна */}
      <div
        onPointerDown={onTap}
        className="absolute inset-0 z-20 tap-target"
        style={{ background: 'transparent' }}
      />

      {/* Частицы и всплывашки */}
      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        <Particles items={particles} />
        <FloatingTexts items={floaters} />
      </div>

      {/* Топбар — наверху */}
      <div className="relative z-50 pt-4">
        <TopBar
          onSettings={() => setSettingsOpen(true)}
          onDaily={() => setDailyOpen(true)}
          showDaily={canClaimDaily}
          onSubscription={() => setSubscriptionInfoOpen(true)}
        />
      </div>

      {/* Верхний спейсер */}
      <div className="flex-1 min-h-0" />

      {/* Яблоко — по центру */}
      <div className="relative z-10 flex items-center justify-center pointer-events-none py-4">
        <Apple
          skin={activeSkin}
          bananaBoostActive={boostUntil != null && boostUntil > Date.now()}
          onTap={() => {}}
        />
      </div>

      {/* Нижний спейсер */}
      <div className="flex-1 min-h-0" />

      <div className="pb-6 px-3 flex justify-between items-end gap-2 relative z-50">
        <button
          onClick={() => setGamesOpen(true)}
          className="h-14 px-3 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white text-sm font-black shadow-[0_8px_24px_rgba(120,40,200,0.5)] active:scale-95 transition flex items-center gap-1"
        >
          🎲 ИГРЫ
        </button>
        <button
          onClick={() => setGensOpen(true)}
          className="h-14 px-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white text-sm font-black shadow-[0_8px_24px_rgba(20,180,150,0.5)] active:scale-95 transition flex items-center gap-1"
        >
          🏭 ДОХОД
        </button>

        <button
          onClick={() => setShopOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white text-2xl shadow-[0_8px_24px_rgba(255,120,0,0.5)] active:scale-95 transition flex items-center justify-center"
          aria-label="shop"
        >⭐</button>
      </div>

      <BananaBoostButton />

      <ShopSheet open={shopOpen} onClose={() => setShopOpen(false)} />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenPromo={() => { setSettingsOpen(false); setPromoOpen(true); }}
        onOpenReferral={() => { setSettingsOpen(false); setRefOpen(true); }}
      />
      <WalletSheet open={walletOpen} onClose={() => setWalletOpen(false)} />
      <MinigamesSheet open={gamesOpen} onClose={() => setGamesOpen(false)} />
      <GeneratorsSheet open={gensOpen} onClose={() => setGensOpen(false)} />
      <PromoSheet open={promoOpen} onClose={() => setPromoOpen(false)} />
      <ReferralSheet open={refOpen} onClose={() => setRefOpen(false)} />
      <DailyStreakSheet open={dailyOpen} onClose={() => setDailyOpen(false)} />
      <SubscriptionInfoSheet open={subscriptionInfoOpen} onClose={() => setSubscriptionInfoOpen(false)} />
    </div>
  );
}