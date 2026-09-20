import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useGame } from '../store/useGameStore';
import { fmt } from '../lib/format';

type CheckersState = {
  sessionId: string;
  board: string[];
  status: 'playing' | 'won' | 'lost';
  selected: number | null;
  chainFrom: number | null;
};

export function SecretGamesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chips = useGame(s => s.chips);
  const setChips = useGame(s => s.setChips);

  const [tab, setTab] = useState<'menu' | 'checkers'>('menu');
  const [betInput, setBetInput] = useState('10');
  const [ck, setCk] = useState<CheckersState | null>(null);

  const close = () => {
    setTab('menu');
    setCk(null);
    onClose();
  };

  const startCheckers = async () => {
    const b = Number(betInput) || 0;
    if (b < 1 || b > chips) return;
    try {
      const r = await api.checkersStart(b);
      setChips(Number(r.chips));
      setCk({
        sessionId: r.sessionId,
        board: r.board,
        status: 'playing',
        selected: null,
        chainFrom: null,
      });
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const isWhite = (p: string) => p === 'w' || p === 'W';
  const isBlack = (p: string) => p === 'b' || p === 'B';

  const ckTapCell = async (i: number) => {
    if (!ck || ck.status !== 'playing') return;
    const piece = ck.board[i];

    // если цепочка идёт — можно только этой шашкой
    if (ck.chainFrom !== null) {
      if (i === ck.chainFrom) return; // уже выбрана
      if (isWhite(piece)) return; // нельзя выбрать другую
      // пробуем ход
      try {
        const r = await api.checkersMove(ck.sessionId, ck.chainFrom, i);
        if (r.chips) setChips(Number(r.chips));
        setCk({
          sessionId: ck.sessionId,
          board: r.board,
          status: r.status,
          selected: null,
          chainFrom: r.chainFrom ?? null,
        });
      } catch (e: any) { alert(e?.body?.error || 'Error'); }
      return;
    }

    // выбор своей шашки
    if (isWhite(piece)) {
      setCk({ ...ck, selected: ck.selected === i ? null : i });
      return;
    }

    if (ck.selected === null) return;

    try {
      const r = await api.checkersMove(ck.sessionId, ck.selected, i);
      if (r.chips) setChips(Number(r.chips));
      setCk({
        sessionId: ck.sessionId,
        board: r.board,
        status: r.status,
        selected: null,
        chainFrom: r.chainFrom ?? null,
      });
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  return (
    <Modal open={open} onClose={close} title="🕹 Секретные игры">
      <div className="mb-4 p-3 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
        <div className="text-xs opacity-70 mb-1">Фишки</div>
        <div className="text-2xl font-black tabular-nums">🪙 {fmt(chips)}</div>
      </div>

      {tab === 'menu' && (
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setTab('checkers')}
            className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-[var(--tg-card)] active:scale-95 transition"
          >
            <span className="text-5xl">⚫</span>
            <span className="font-bold">Шашки</span>
            <span className="text-xs text-[var(--tg-hint)]">+100% / −100%</span>
          </button>
        </div>
      )}

      {tab === 'checkers' && !ck && (
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
            onClick={startCheckers}
            disabled={(Number(betInput) || 0) < 1 || (Number(betInput) || 0) > chips}
            className={`w-full py-6 rounded-2xl font-black text-lg transition ${(Number(betInput) || 0) > 0 && (Number(betInput) || 0) <= chips ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white active:scale-95' : 'bg-gray-300 text-gray-500'}`}
          >⚫ Начать игру</button>
          <button
            onClick={() => setTab('menu')}
            className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95"
          >← Назад</button>
        </div>
      )}

      {tab === 'checkers' && ck && (
        <div className="space-y-3">
          <div className="text-center text-xs text-[var(--tg-hint)]">
            Ты — ○ (белые), бот — ● (чёрные). Дамка — ✪
          </div>

          <div className="grid grid-cols-8 gap-0 mx-auto rounded-xl overflow-hidden" style={{ width: 'min(100%, 320px)' }}>
            {ck.board.map((cell, i) => {
              const r = Math.floor(i / 8), c = i % 8;
              const dark = (r + c) % 2 === 1;
              const isSel = ck.selected === i;
              const isChain = ck.chainFrom === i;
              const highlight = isSel || isChain;

              let glyph: string | null = null;
              let cls = '';
              if (cell === 'w') { glyph = '○'; cls = 'text-white'; }
              else if (cell === 'W') { glyph = '✪'; cls = 'text-yellow-300'; }
              else if (cell === 'b') { glyph = '●'; cls = 'text-slate-900'; }
              else if (cell === 'B') { glyph = '✪'; cls = 'text-rose-500'; }

              return (
                <button
                  key={i}
                  onClick={() => ckTapCell(i)}
                  disabled={ck.status !== 'playing'}
                  className={`aspect-square flex items-center justify-center text-2xl transition-colors duration-150 ${
                    dark ? 'bg-slate-700' : 'bg-slate-300'
                  } ${highlight ? 'ring-2 ring-yellow-400 ring-inset' : ''}`}
                >
                  {glyph && (
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.18 }}
                      className={`drop-shadow ${cls}`}
                    >{glyph}</motion.span>
                  )}
                </button>
              );
            })}
          </div>

          {ck.status === 'playing' && (
            <div className="text-center text-xs text-[var(--tg-hint)]">
              {ck.chainFrom !== null
                ? 'Продолжай бить этой же шашкой'
                : ck.selected === null
                  ? 'Тапни свою шашку'
                  : 'Тапни клетку для хода'}
            </div>
          )}

          {(ck.status === 'won' || ck.status === 'lost') && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-center py-4 rounded-2xl font-black ${ck.status === 'won' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
            >
              <div className="text-2xl mb-1">
                {ck.status === 'won' ? '🎉 ПОБЕДА! +100%' : '😢 Проиграл'}
              </div>
            </motion.div>
          )}

          <button
            onClick={() => { setCk(null); setTab('menu'); }}
            className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95"
          >← К секретным играм</button>
        </div>
      )}
    </Modal>
  );
}
