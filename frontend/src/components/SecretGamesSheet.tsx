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
  legal: { from: number; to: number }[];
};

export function SecretGamesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chips = useGame(s => s.chips);
  const setChips = useGame(s => s.setChips);

  const [tab, setTab] = useState<'menu' | 'checkers'>('menu');
  const [betInput, setBetInput] = useState('10');
  const [ck, setCk] = useState<CheckersState | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => { setTab('menu'); setCk(null); onClose(); };

  const startCheckers = async () => {
    const b = Number(betInput) || 0;
    if (b < 1 || b > chips) return;
    try {
      const r = await api.checkersStart(b);
      setChips(Number(r.chips));
      setCk({
        sessionId: r.sessionId, board: r.board, status: 'playing',
        selected: null, chainFrom: null, legal: r.legal ?? [],
      });
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const isWhite = (p: string) => p === 'w' || p === 'W';

  const sendMove = async (from: number, to: number) => {
    if (!ck || busy) return;
    setBusy(true);
    try {
      const r = await api.checkersMove(ck.sessionId, from, to);
      if (r.chips) setChips(Number(r.chips));
      setCk({
        sessionId: ck.sessionId,
        board: r.board,
        status: r.status,
        selected: null,
        chainFrom: r.chainFrom ?? null,
        legal: r.legal ?? [],
      });
      // плавность: показываем промежуточный, потом финал
      if (r.boardAfterPlayer && r.status === 'playing') {
        setCk(prev => prev ? { ...prev, board: r.boardAfterPlayer } : null);
        setTimeout(() => {
          setCk(prev => prev ? { ...prev, board: r.board, legal: r.legal ?? [] } : null);
        }, 500);
      }
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
    finally { setTimeout(() => setBusy(false), 200); }
  };

  const ckTapCell = (i: number) => {
    if (!ck || ck.status !== 'playing' || busy) return;

    // цепочка — можно бить только этой шашкой
    if (ck.chainFrom !== null) {
      if (i === ck.chainFrom) return;
      if (ck.legal.some(m => m.from === ck.chainFrom && m.to === i)) {
        sendMove(ck.chainFrom, i);
      }
      return;
    }

    // если выбрана шашка — проверяем что тап по legal to
    if (ck.selected !== null) {
      if (ck.legal.some(m => m.from === ck.selected && m.to === i)) {
        sendMove(ck.selected, i);
        return;
      }
    }

    // выбираем свою шашку (только если для неё есть ходы)
    const piece = ck.board[i];
    if (isWhite(piece) && ck.legal.some(m => m.from === i)) {
      setCk({ ...ck, selected: ck.selected === i ? null : i });
    } else if (isWhite(piece)) {
      // нет ходов у этой шашки — не выделяем
      setCk({ ...ck, selected: null });
    } else {
      setCk({ ...ck, selected: null });
    }
  };

  // множество подсвечиваемых клеток
  const targets: number[] = (() => {
    if (!ck) return [];
    if (ck.chainFrom !== null) return ck.legal.filter(m => m.from === ck.chainFrom).map(m => m.to);
    if (ck.selected !== null) return ck.legal.filter(m => m.from === ck.selected).map(m => m.to);
    return [];
  })();

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
            type="text" inputMode="numeric" value={betInput}
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
          <button onClick={() => setTab('menu')} className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95">← Назад</button>
        </div>
      )}

      {tab === 'checkers' && ck && (
        <div className="space-y-3">
          <div className="text-center text-xs text-[var(--tg-hint)]">
            Ты — ○ (белые), бот — ●. Дамка — ✪
          </div>

          <div className="grid grid-cols-8 gap-0 mx-auto rounded-xl overflow-hidden" style={{ width: 'min(100%, 320px)' }}>
            {ck.board.map((cell, i) => {
              const r = Math.floor(i / 8), c = i % 8;
              const dark = (r + c) % 2 === 1;
              const isSel = ck.selected === i;
              const isChain = ck.chainFrom === i;
              const isTarget = targets.includes(i);
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
                  className={`relative aspect-square flex items-center justify-center text-2xl transition-colors duration-200 ${
                    dark ? 'bg-slate-700' : 'bg-slate-300'
                  } ${highlight ? 'ring-2 ring-yellow-400 ring-inset' : ''}`}
                >
                  {isTarget && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3 h-3 rounded-full bg-emerald-400/70 animate-pulse" />
                    </div>
                  )}
                  {glyph && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.22, type: 'spring', stiffness: 220 }}
                      className={`drop-shadow ${cls}`}
                    >{glyph}</motion.span>
                  )}
                </button>
              );
            })}
          </div>

          {ck.status === 'playing' && (
            <div className="text-center text-xs text-[var(--tg-hint)]">
              {ck.chainFrom !== null ? 'Продолжай бить этой же шашкой'
                : ck.selected === null ? 'Тапни свою шашку'
                : 'Тапни зелёную точку'}
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
