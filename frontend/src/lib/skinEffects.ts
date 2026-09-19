import type { SkinId } from '../store/useGameStore';

export type SkinEffect = { icon: string; text: string; color: string };

export function describeSkinEffects(skin: SkinId | null): SkinEffect[] {
  if (!skin) return [];
  const out: SkinEffect[] = [];
  const add = (icon: string, text: string, color = 'violet') => out.push({ icon, text, color });

  switch (skin) {
    case 'orange':      add('🍊', '+3% к тапу'); add('📅', '+100/день', 'amber'); break;
    case 'pear':        add('🍐', 'Крит 7% ×3', 'lime'); break;
    case 'banana':      add('🍌', 'Актив. ×2 буст', 'yellow'); break;
    case 'grape':       add('🍇', '+7% тап'); add('🏭', '+5% пассив', 'emerald'); break;
    case 'strawberry':  add('🍓', 'Крит 12% ×5', 'rose'); break;
    case 'cherry':      add('🍒', '+15% тап'); add('🌙', 'Офлайн ×2', 'indigo'); break;
    case 'kiwi':        add('🥝', '+25% к тапу'); break;
    case 'peach':       add('🍑', '+40% пассив', 'orange'); break;
    case 'pineapple':   add('🍍', 'Крит 18% ×7', 'amber'); break;
    case 'mango':       add('🥭', '+100% пассив', 'orange'); add('👆', '+10% тап'); break;
    case 'lemon':       add('🍋', '+100% пассив', 'orange'); add('👆', '+15% тап'); add('💸', '−20% на генераторы', 'green'); break;
    case 'avocado':     add('🥑', '+150% пассив', 'orange'); add('👆', '+20% тап'); add('💰', '+50% при сборе', 'green'); break;
    case 'blueberry':   add('🫐', 'Крит 25% ×10', 'blue'); add('🔗', 'Крит-цепочка 30%', 'purple'); break;
    case 'coconut':     add('🥥', '+300% пассив', 'orange'); add('⏰', 'Офлайн-кап 24ч', 'blue'); break;
    case 'dragonfruit': add('🐉', '+400% пассив', 'orange'); add('⚡', 'Крит 35% ×25', 'red'); break;
  }
  return out;
}

export const SKIN_EMOJI: Record<SkinId, string> = {
  orange: '🍊', pear: '🍐', banana: '🍌', grape: '🍇', strawberry: '🍓',
  cherry: '🍒', kiwi: '🥝', peach: '🍑', pineapple: '🍍', mango: '🥭',
  lemon: '🍋', avocado: '🥑', blueberry: '🫐', coconut: '🥥', dragonfruit: '🐉',
};
