import { useGame } from '../store/useGameStore';
import { describeSkinEffects, SKIN_EMOJI } from '../lib/skinEffects';

const COLOR: Record<string, string> = {
  violet:  'bg-violet-500/15 text-violet-600 border-violet-500/30',
  amber:   'bg-amber-500/15 text-amber-700 border-amber-500/30',
  orange:  'bg-orange-500/15 text-orange-600 border-orange-500/30',
  lime:    'bg-lime-500/15 text-lime-700 border-lime-500/30',
  yellow:  'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  green:   'bg-green-500/15 text-green-600 border-green-500/30',
  rose:    'bg-rose-500/15 text-rose-600 border-rose-500/30',
  red:     'bg-red-500/15 text-red-600 border-red-500/30',
  blue:    'bg-blue-500/15 text-blue-600 border-blue-500/30',
  indigo:  'bg-indigo-500/15 text-indigo-600 border-indigo-500/30',
  purple:  'bg-purple-500/15 text-purple-600 border-purple-500/30',
};

export function SkinBonus() {
  const skin = useGame(s => s.activeSkin);
  if (!skin) return null;
  const effects = describeSkinEffects(skin);
  if (effects.length === 0) return null;

  return (
    <div className="px-4 pb-2 relative z-20">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{SKIN_EMOJI[skin]}</span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--tg-hint)] font-bold">
          Активные бонусы
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {effects.map((e, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold border ${COLOR[e.color] ?? COLOR.violet}`}
          >
            <span>{e.icon}</span>
            <span>{e.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
