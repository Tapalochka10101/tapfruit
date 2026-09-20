import { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useGame } from '../store/useGameStore';
import { fmt } from '../lib/format';

type SecretGame = 'durak' | 'checkers';

type DurakCard = { suit: string; rank: number };

function rankLabel(r: number): string {
  if (r <= 10) return String(r);
  if (r === 11) return 'В';
  if (r === 12) return 'Д';
  if (r === 13) return 'К';
  return 'Т';
}

function isRed(suit: string): boolean {
  return suit === '♥' || suit === '♦';
}

type DurakState = {
  sessionId: string;
  playerHand: DurakCard[];
  botHandSize: number;
  trumpSuit: string;
  trumpCard: DurakCard;
  table: { attack: DurakCard; defend?: DurakCard }[];
  turn: 'player' | 'bot';
  status: 'playing' | 'defend_required' | 'won' | 'lost';
};

export function SecretGamesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chips = useGame(s => s.chips);
  const setChips = useGame(s => s.setChips);

  const [selected, setSelected] = useState<SecretGame | null>(null);
  const [betInput, setBetInput] = useState('10');
  const [durak, setDurak] = useState<DurakState | null>(null);

  const [checkersBet, setCheckersBet] = useState('10');
  const [checkers, setCheckers] = useState<{
    sessionId: string;
    board: string[];
    status: 'playing' | 'won' | 'lost';
    selected: number | null;
  } | null>(null);

  const close = () => {
    setSelected(null);
    setDurak(null);
    setCheckers(null);
    onClose();
  };

  const startCheckers = async () => {
    const b = Number(checkersBet) || 0;
    if (b < 1 || b > chips) return;
    try {
      const r = await api.checkersStart(b);
      setChips(Number(r.chips));
      setCheckers({
        sessionId: r.sessionId,
        board: r.board,
        status: 'playing',
        selected: null,
      });
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const ckTapCell = async (i: number) => {
    if (!checkers || checkers.status !== 'playing') return;
    const piece = checkers.board[i];

    // тап на свою шашку — выделить/снять
    if (piece === 'w') {
      setCheckers({ ...checkers, selected: checkers.selected === i ? null : i });
      return;
    }
    // тап на пустую или чужую — пытаемся ходить
    if (checkers.selected === null) return;

    try {
      const r = await api.checkersMove(checkers.sessionId, checkers.selected, i);
      if (r.chips) setChips(Number(r.chips));
      setCheckers({
        sessionId: checkers.sessionId,
        board: r.board,
        status: r.status,
        selected: null,
      });
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const startDurak = async () => {
    const b = Number(betInput) || 0;
    if (b < 1 || b > chips) return;
    try {
      const r = await api.durakStart(b);
      setChips(Number(r.chips));
      setDurak({
        sessionId: r.sessionId,
        playerHand: r.playerHand,
        botHandSize: r.botHandSize,
        trumpSuit: r.trumpSuit,
        trumpCard: r.trumpCard,
        table: r.table ?? [],
        turn: r.turn,
        status: 'playing',
      });
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const attack = async (cardIndex: number) => {
    if (!durak || durak.status === 'won' || durak.status === 'lost') return;
    try {
      const r = await api.durakAttack(durak.sessionId, cardIndex);
      if (r.chips) setChips(Number(r.chips));
      setDurak(prev => prev ? {
        ...prev,
        playerHand: r.playerHand,
        botHandSize: r.botHandSize,
        table: r.table,
        turn: r.turn,
        status: r.status,
      } : null);
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const defend = async (cardIndex: number | null) => {
    if (!durak) return;
    try {
      const r = await api.durakDefend(durak.sessionId, cardIndex);
      if (r.chips) setChips(Number(r.chips));
      setDurak(prev => prev ? {
        ...prev,
        playerHand: r.playerHand,
        botHandSize: r.botHandSize,
        table: r.table,
        turn: r.turn,
        status: r.status,
      } : null);
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const Card = ({ c, onClick, disabled }: { c: DurakCard; onClick?: () => void; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-16 rounded-lg bg-white border-2 border-slate-300 flex flex-col items-center justify-center font-black text-sm ${isRed(c.suit) ? 'text-red-600' : 'text-slate-900'} ${disabled ? 'opacity-60' : 'active:scale-95'} shadow-sm`}
    >
      <div>{rankLabel(c.rank)}</div>
      <div className="text-lg leading-none">{c.suit}</div>
    </button>
  );

  const MiniCard = ({ c }: { c: DurakCard }) => (
    <div className={`w-9 h-12 rounded bg-white border border-slate-300 flex flex-col items-center justify-center font-bold text-xs ${isRed(c.suit) ? 'text-red-600' : 'text-slate-900'}`}>
      <div>{rankLabel(c.rank)}</div>
      <div className="leading-none">{c.suit}</div>
    </div>
  );

  return (
    <Modal open={open} onClose={close} title="🕹 Секретные игры">
      <div className="mb-4 p-3 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
        <div className="text-xs opacity-70 mb-1">Фишки</div>
        <div className="text-2xl font-black tabular-nums">🪙 {fmt(chips)}</div>
      </div>

      {!selected && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelected('durak')}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-[var(--tg-card)] active:scale-95 transition"
          >
            <span className="text-4xl">🃏</span>
            <span className="font-bold text-sm">Дурак</span>
            <span className="text-[10px] text-[var(--tg-hint)]">+100% / −100%</span>
          </button>
          <button
            onClick={() => setSelected('checkers')}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-[var(--tg-card)] active:scale-95 transition"
          >
            <span className="text-4xl">⚫</span>
            <span className="font-bold text-sm">Шашки</span>
            <span className="text-[10px] text-[var(--tg-hint)]">+100% / −100%</span>
          </button>
        </div>
      )}

      {selected === 'durak' && !durak && (
        <div className="space-y-3">
          <div className="text-xs text-[var(--tg-hint)] text-center">Количество</div>
          <input
            type="text"
            inputMode="numeric"
            value={betInput}
            onChange={e => setBetInput(e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="0"
            className="w-full py-4 rounded-2xl bg-[var(--tg-card)] text-center font-black text-2xl tabular-nums"
          />
          <div className="text-[10px] text-[var(--tg-hint)] text-center">доступно: {fmt(chips)} 🪙</div>
          <button
            onClick={startDurak}
            disabled={(Number(betInput) || 0) < 1 || (Number(betInput) || 0) > chips}
            className={`w-full py-6 rounded-2xl font-black text-lg transition ${(Number(betInput) || 0) > 0 && (Number(betInput) || 0) <= chips ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white active:scale-95' : 'bg-gray-300 text-gray-500'}`}
          >🃏 Начать игру</button>
          <button
            onClick={() => setSelected(null)}
            className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95"
          >← Назад</button>
        </div>
      )}

      {selected === 'durak' && durak && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[var(--tg-hint)]">Козырь:</span>
              <MiniCard c={durak.trumpCard} />
            </div>
            <span className="text-[var(--tg-hint)]">Бот: {durak.botHandSize} карт</span>
          </div>

          <div className="min-h-[80px] p-3 rounded-2xl bg-[var(--tg-card)] flex flex-wrap gap-2 items-center justify-center">
            {durak.table.length === 0 ? (
              <span className="text-[var(--tg-hint)] text-xs">Стол пуст — ходи</span>
            ) : (
              durak.table.map((row, i) => (
                <div key={i} className="flex gap-1">
                  <MiniCard c={row.attack} />
                  {row.defend && <MiniCard c={row.defend} />}
                </div>
              ))
            )}
          </div>

          {durak.status === 'playing' && (
            <div className="text-center text-xs text-[var(--tg-hint)]">Твой ход — выбери карту</div>
          )}
          {durak.status === 'defend_required' && (
            <div className="text-center text-xs text-[var(--tg-hint)]">Отбивайся или бери</div>
          )}

          <div className="flex flex-wrap gap-1.5 justify-center min-h-[70px] p-2 rounded-2xl bg-[var(--tg-card)]">
            {durak.playerHand.map((c, i) => (
              <Card
                key={i}
                c={c}
                onClick={() => durak.status === 'defend_required' ? defend(i) : attack(i)}
                disabled={durak.status === 'won' || durak.status === 'lost'}
              />
            ))}
          </div>

          {durak.status === 'defend_required' && (
            <button
              onClick={() => defend(null)}
              className="w-full py-4 rounded-2xl bg-rose-500 text-white font-black active:scale-95"
            >Беру</button>
          )}

          {(durak.status === 'won' || durak.status === 'lost') && (
            <div className={`text-center py-4 rounded-2xl font-black ${durak.status === 'won' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              <div className="text-2xl mb-1">
                {durak.status === 'won' ? '🎉 ПОБЕДА! +100%' : '😢 Проиграл'}
              </div>
            </div>
          )}

          <button
            onClick={() => { setDurak(null); setSelected(null); }}
            className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95"
          >← К секретным играм</button>
        </div>
      )}

      {selected === 'checkers' && !checkers && (
        <div className="space-y-3">
          <div className="text-xs text-[var(--tg-hint)] text-center">Количество</div>
          <input
            type="text"
            inputMode="numeric"
            value={checkersBet}
            onChange={e => setCheckersBet(e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="0"
            className="w-full py-4 rounded-2xl bg-[var(--tg-card)] text-center font-black text-2xl tabular-nums"
          />
          <div className="text-[10px] text-[var(--tg-hint)] text-center">доступно: {fmt(chips)} 🪙</div>
          <button
            onClick={startCheckers}
            disabled={(Number(checkersBet) || 0) < 1 || (Number(checkersBet) || 0) > chips}
            className={`w-full py-6 rounded-2xl font-black text-lg transition ${(Number(checkersBet) || 0) > 0 && (Number(checkersBet) || 0) <= chips ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white active:scale-95' : 'bg-gray-300 text-gray-500'}`}
          >⚫ Начать игру</button>
          <button
            onClick={() => setSelected(null)}
            className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95"
          >← Назад</button>
        </div>
      )}

      {selected === 'checkers' && checkers && (
        <div className="space-y-3">
          <div className="text-center text-xs text-[var(--tg-hint)]">
            Ты — ○ (белые), бот — ● (чёрные)
          </div>
          <div className="grid grid-cols-8 gap-0 mx-auto" style={{ width: 'min(100%, 320px)' }}>
            {checkers.board.map((cell, i) => {
              const r = Math.floor(i / 8), c = i % 8;
              const dark = (r + c) % 2 === 1;
              const isSel = checkers.selected === i;
              return (
                <button
                  key={i}
                  onClick={() => ckTapCell(i)}
                  disabled={checkers.status !== 'playing'}
                  className={`aspect-square flex items-center justify-center text-2xl ${
                    dark ? 'bg-slate-700' : 'bg-slate-300'
                  } ${isSel ? 'ring-2 ring-yellow-400 ring-inset' : ''}`}
                >
                  {cell === 'w' && <span className="text-white drop-shadow">○</span>}
                  {cell === 'b' && <span className="text-slate-900 drop-shadow">●</span>}
                </button>
              );
            })}
          </div>

          {checkers.status === 'playing' && (
            <div className="text-center text-xs text-[var(--tg-hint)]">
              {checkers.selected === null ? 'Тапни свою шашку' : 'Тапни клетку для хода'}
            </div>
          )}

          {(checkers.status === 'won' || checkers.status === 'lost') && (
            <div className={`text-center py-4 rounded-2xl font-black ${checkers.status === 'won' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              <div className="text-2xl mb-1">
                {checkers.status === 'won' ? '🎉 ПОБЕДА! +100%' : '😢 Проиграл'}
              </div>
            </div>
          )}

          <button
            onClick={() => { setCheckers(null); setSelected(null); }}
            className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95"
          >← К секретным играм</button>
        </div>
      )}
    </Modal>
  );
}
