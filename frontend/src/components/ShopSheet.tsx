import { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useGame, type SkinId } from '../store/useGameStore';
import { useSettings } from '../store/useSettingsStore';
import { STRINGS } from '../lib/i18n';
import { fmt } from '../lib/format';
import { useHaptics } from '../hooks/useHaptics';

const UPGRADES = [
  { id: 'multitap_1', level: 1, title: 'Деревянный палец',   desc: '×1.25 к тапу', price: 500 },
  { id: 'multitap_2', level: 2, title: 'Стальной палец',     desc: '×1.5 к тапу',  price: 2_500 },
  { id: 'multitap_3', level: 3, title: 'Золотой палец',      desc: '×2 к тапу',    price: 10_000 },
  { id: 'multitap_4', level: 4, title: 'Алмазный палец',     desc: '×2.5 к тапу',  price: 50_000 },
  { id: 'multitap_5', level: 5, title: 'Платиновый палец',   desc: '×3 к тапу',    price: 250_000 },
  { id: 'multitap_6', level: 6, title: 'Легендарный палец',  desc: '×4 к тапу',    price: 1_000_000 },
  { id: 'multitap_7', level: 7, title: 'Космический палец',  desc: '×5 к тапу',    price: 5_000_000 },
  { id: 'multitap_8', level: 8, title: 'Квантовый палец',    desc: '×6 к тапу',    price: 20_000_000 },
  { id: 'multitap_9', level: 9, title: 'Божественный палец', desc: '×10 к тапу',   price: 100_000_000 },
];

const SKINS: { id: SkinId; emoji: string; title: string; desc: string; price: number }[] = [
  { id: 'orange',      emoji: '🍊', title: 'Апельсин',       desc: '+3% к тапу, +100/день',                   price: 500 },
  { id: 'pear',        emoji: '🍐', title: 'Груша',          desc: 'Крит 7% ×3',                              price: 2_000 },
  { id: 'banana',      emoji: '🍌', title: 'Банан',          desc: 'Активный ×2 буст (30с, кд 5м)',           price: 5_000 },
  { id: 'grape',       emoji: '🍇', title: 'Виноград',       desc: '+7% тап, +5% пассив',                     price: 15_000 },
  { id: 'strawberry',  emoji: '🍓', title: 'Клубника',       desc: 'Крит 12% ×5',                             price: 40_000 },
  { id: 'cherry',      emoji: '🍒', title: 'Вишня',          desc: '+15% тап, офлайн ×2',                     price: 100_000 },
  { id: 'kiwi',        emoji: '🥝', title: 'Киви',           desc: '+25% к тапу',                             price: 250_000 },
  { id: 'peach',       emoji: '🍑', title: 'Персик',         desc: '+40% пассив',                             price: 750_000 },
  { id: 'pineapple',   emoji: '🍍', title: 'Ананас',         desc: 'Крит 18% ×7',                             price: 2_000_000 },
  { id: 'mango',       emoji: '🥭', title: 'Манго',          desc: '+100% пассив, +10% тап',                  price: 10_000_000 },
  { id: 'lemon',       emoji: '🍋', title: 'Лимон',          desc: '+100% пассив, +15% тап, −20% на генераторы', price: 25_000_000 },
  { id: 'avocado',     emoji: '🥑', title: 'Авокадо',        desc: '+150% пассив, +20% тап, +50% при сборе',  price: 50_000_000 },
  { id: 'blueberry',   emoji: '🫐', title: 'Голубика',       desc: 'Крит 25% ×10, крит-цепочка 30%',         price: 100_000_000 },
  { id: 'coconut',     emoji: '🥥', title: 'Кокос',          desc: '+300% пассив, офлайн-кап 24ч',            price: 250_000_000 },
  { id: 'dragonfruit', emoji: '🐉', title: 'Драконий фрукт', desc: '+400% пассив, крит 35% ×25',              price: 1_000_000_000 },
];

export function ShopSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'upgrades' | 'skins'>('upgrades');
  const lang = useSettings(s => s.lang);
  const t = STRINGS[lang];
  const haptics = useHaptics();

  const balance = useGame(s => s.balance);
  const upgradeLevel = useGame(s => s.upgradeLevel);
  const maxUpgradeLevel = useGame(s => s.maxUpgradeLevel);
  const activeSkin = useGame(s => s.activeSkin);
  const ownedSkins = useGame(s => s.ownedSkins);
  const setBalance = useGame(s => s.setBalance);
  const setUpgrade = useGame(s => s.setUpgrade);
  const setMaxUpgrade = useGame(s => s.setMaxUpgrade);
  const setSkin = useGame(s => s.setSkin);

  const ownedSet = new Set(ownedSkins);

  const buy = async (type: 'upgrade' | 'skin', id: string) => {
    try {
      const r = await api.buy(type, id);
      if (r.balance) setBalance(Number(r.balance));
      if (type === 'upgrade') {
        if (r.upgradeLevel !== undefined) setUpgrade(r.upgradeLevel);
        if (r.maxUpgradeLevel !== undefined) setMaxUpgrade(r.maxUpgradeLevel);
      }
      if (type === 'skin' && r.activeSkin) {
        setSkin(r.activeSkin as SkinId);
        useGame.setState(s => ({ ownedSkins: [...new Set([...s.ownedSkins, id as SkinId])] }));
      }
      haptics.success();
    } catch (e) {
      haptics.error();
      alert((e as any)?.body?.error || 'Error');
    }
  };

  const equip = async (id: SkinId | null) => {
    try {
      const r = await api.equip(id);
      setSkin((r.activeSkin as SkinId) ?? null);
      haptics.tap();
    } catch (e) {
      haptics.error();
      alert((e as any)?.body?.error || 'Error');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t.shop}>
      <div className="flex gap-2 mb-5 bg-[var(--tg-card)] p-1.5 rounded-2xl">
        {(['upgrades', 'skins'] as const).map(x => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className={`flex-1 py-3 rounded-xl text-base font-bold transition ${
              tab === x ? 'bg-[var(--tg-bg)] shadow-md' : 'text-[var(--tg-hint)]'
            }`}
          >{t[x]}</button>
        ))}
      </div>

      {tab === 'upgrades' && (
        <div className="space-y-2">
          {UPGRADES.map(u => {
            const owned = maxUpgradeLevel >= u.level;
            const active = upgradeLevel === u.level;
            const affordable = balance >= u.price;
            return (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--tg-card)]">
                <div className="w-12 h-12 rounded-xl bg-[var(--tg-bg)] flex items-center justify-center text-xl shrink-0">
                  {active ? '⭐' : owned ? '✓' : '🔒'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{u.title}</div>
                  <div className="text-xs text-[var(--tg-hint)]">{u.desc}</div>
                </div>
                {active ? (
                  <div className="px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold shrink-0">
                    {t.equipped}
                  </div>
                ) : owned ? (
                  <button
                    onClick={() => buy('upgrade', u.id)}
                    className="px-3 py-2 rounded-xl bg-brand text-white text-xs font-bold active:scale-95 transition shrink-0"
                  >{t.equip}</button>
                ) : (
                  <button
                    disabled={!affordable}
                    onClick={() => buy('upgrade', u.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                      affordable ? 'bg-brand text-white active:scale-95' : 'bg-gray-300 text-gray-500'
                    }`}
                  >{fmt(u.price)}</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'skins' && (
        <div className="space-y-2">
          {SKINS.map(s => {
            const owned = ownedSet.has(s.id);
            const equipped = activeSkin === s.id;
            const affordable = balance >= s.price;
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--tg-card)]">
                <div className="w-12 h-12 rounded-xl bg-[var(--tg-bg)] flex items-center justify-center text-2xl shrink-0">
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{s.title}</div>
                  <div className="text-xs text-[var(--tg-hint)]">{s.desc}</div>
                </div>
                {equipped ? (
                  <button
                    onClick={() => equip(null)}
                    className="px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold active:scale-95 transition shrink-0"
                  >{t.equipped}</button>
                ) : owned ? (
                  <button
                    onClick={() => equip(s.id)}
                    className="px-3 py-2 rounded-xl bg-brand text-white text-xs font-bold active:scale-95 transition shrink-0"
                  >{t.equip}</button>
                ) : (
                  <button
                    disabled={!affordable}
                    onClick={() => buy('skin', s.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                      affordable ? 'bg-brand text-white active:scale-95' : 'bg-gray-300 text-gray-500'
                    }`}
                  >{fmt(s.price)}</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}