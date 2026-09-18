import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { api } from '../lib/api';
import { useGame } from '../store/useGameStore';
import { fmt } from '../lib/format';

type Game = {
  id: string;
  emoji: string;
  title: string;
  labelA: string;
  labelB: string;
};

const GAMES: Game[] = [
  { id: 'dice',      emoji: '🎲', title: 'Кубик',   labelA: 'Чётное',  labelB: 'Нечётное' },
  { id: 'coin',      emoji: '🪙', title: 'Монетка', labelA: 'Орёл',    labelB: 'Решка' },
  { id: 'cards',     emoji: '🃏', title: 'Карта',   labelA: 'Красная', labelB: 'Чёрная' },
  { id: 'dart',      emoji: '🎯', title: 'Дротик',  labelA: 'Попадёт', labelB: 'Промах' },
  { id: 'number',    emoji: '🔢', title: 'Число',   labelA: '1-5',     labelB: '6-10' },
  { id: 'rainbow',   emoji: '🌈', title: 'Радуга',  labelA: 'Тёплый',  labelB: 'Холодный' },
  { id: 'snail',     emoji: '🐢', title: 'Улитка',  labelA: 'Левая',   labelB: 'Правая' },
  { id: 'lightning', emoji: '⚡', title: 'Молния',  labelA: 'Ударит',  labelB: 'Мимо' },
  { id: 'clover',    emoji: '🍀', title: 'Клевер',  labelA: 'Найдёшь', labelB: 'Нет' },
  { id: 'star',      emoji: '⭐', title: 'Звезда',  labelA: 'Вверх',   labelB: 'Вниз' },
];

const BETS = [10, 50, 100, 500];
const TAPS_PER_CHIP = 100;

type Result = { won: boolean; detail: string; roll: string; bet: number; choice: string };

export function MinigamesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [bet, setBet] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);

  const balance = useGame(s => s.balance);
  const chips = useGame(s => s.chips);
  const setBalance = useGame(s => s.setBalance);
  const setChips = useGame(s => s.setChips);

  const wins = history.filter(h => h.won).length;
  const losses = history.filter(h => !h.won).length;

  const buyChips = async (tapsAmount: number) => {
    try {
      const r = await api.buyChips(tapsAmount);
      setBalance(Number(r.balance));
      setChips(Number(r.chips));
    } catch (e: any) {
      alert(e?.body?.error || 'Error');
    }
  };

  const sellChips = async (chipsAmount: number) => {
    try {
      const r = await api.sellChips(chipsAmount);
      setBalance(Number(r.balance));
      setChips(Number(r.chips));
    } catch (e: any) {
      alert(e?.body?.error || 'Error');
    }
  };

  const play = async (choice: 'A' | 'B') => {
    if (!selectedGame || playing) return;
    setPlaying(true);
    setLastResult(null);
    try {
      const r = await api.playMinigame(selectedGame.id, bet, choice);
      setChips(Number(r.chips));
      const res: Result = { won: r.won, detail: r.detail, roll: r.roll, bet, choice };
      setLastResult(res);
      setHistory(h => [res, ...h].slice(0, 10));
    } catch (e: any) {
      alert(e?.body?.error || 'Error');
    } finally {
      setTimeout(() => setPlaying(false), 600);
    }
  };

  const backToLobby = () => {
    setSelectedGame(null);
    setLastResult(null);
  };

  return (
    <Modal open={open} onClose={() => { backToLobby(); onClose(); }} title="🎲 Мини-игры">
      {/* Баланс */}
      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <div className="text-xs opacity-80 mb-1">Фишки</div>
        <div className="text-3xl font-black tabular-nums">🪙 {fmt(chips)}</div>
        <div className="text-xs opacity-80 mt-1">1 фишка = {TAPS_PER_CHIP} тапов</div>
      </div>

      {history.length > 0 && (
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-[var(--tg-hint)]">Сессия:</span>
          <span className="font-bold">
            <span className="text-green-500">✓ {wins}</span>
            <span className="mx-2 text-[var(--tg-hint)]">/</span>
            <span className="text-red-500">✗ {losses}</span>
          </span>
        </div>
      )}

      {!selectedGame && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => buyChips(1000)}
            disabled={balance < 1000}
            className={`py-3 rounded-2xl font-bold text-sm transition ${
              balance >= 1000
                ? 'bg-green-500 text-white active:scale-95'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            +10 🪙 (1к тапов)
          </button>
          <button
            onClick={() => sellChips(10)}
            disabled={chips < 10}
            className={`py-3 rounded-2xl font-bold text-sm transition ${
              chips >= 10
                ? 'bg-orange-500 text-white active:scale-95'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            −10 🪙 → 1к тапов
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid grid-cols-2 gap-3 mb-4">
              {GAMES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGame(g)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[var(--tg-card)] active:scale-95 transition"
                >
                  <span className="text-4xl">{g.emoji}</span>
                  <span className="font-bold text-sm text-center">{g.title}</span>
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <div className="p-3 rounded-2xl bg-[var(--tg-card)]">
                <div className="text-xs text-[var(--tg-hint)] mb-2">Последние игры:</div>
                <div className="space-y-1">
                  {history.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{h.detail}</span>
                      <span className={h.won ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                        {h.won ? '+' + h.bet * 2 : '−' + h.bet}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="text-6xl mb-2">{selectedGame.emoji}</div>
              <div className="font-bold text-lg">{selectedGame.title}</div>
            </div>

            <div>
              <div className="text-xs text-[var(--tg-hint)] mb-2 text-center">Количество</div>
              <div className="flex gap-2">
                {BETS.map(b => (
                  <button
                    key={b}
                    onClick={() => setBet(b)}
                    disabled={chips < b}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
                      bet === b
                        ? 'bg-brand text-white'
                        : chips >= b
                          ? 'bg-[var(--tg-card)]'
                          : 'bg-gray-200 text-gray-400'
                    }`}
                  >{b}</button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {lastResult && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`text-center py-4 rounded-2xl font-black ${
                    lastResult.won ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {lastResult.won
                      ? '🎉 ВЫИГРАЛ +' + lastResult.bet * 2
                      : '😢 Проиграл −' + lastResult.bet}
                  </div>
                  <div className="text-sm opacity-90 font-semibold">{lastResult.detail}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => play('A')}
                disabled={playing || chips < bet}
                className={`py-6 rounded-2xl font-black text-lg transition ${
                  !playing && chips >= bet
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white active:scale-95'
                    : 'bg-gray-300 text-gray-500'
                }`}
              >{selectedGame.labelA}</button>
              <button
                onClick={() => play('B')}
                disabled={playing || chips < bet}
                className={`py-6 rounded-2xl font-black text-lg transition ${
                  !playing && chips >= bet
                    ? 'bg-gradient-to-br from-pink-500 to-rose-700 text-white active:scale-95'
                    : 'bg-gray-300 text-gray-500'
                }`}
              >{selectedGame.labelB}</button>
            </div>

            <button
              onClick={backToLobby}
              className="w-full py-3 rounded-2xl bg-[var(--tg-card)] font-bold text-sm active:scale-95 transition"
            >← Назад к играм</button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}