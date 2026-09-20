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
  { id: 'dice',      emoji: '🎲', title: 'Кубик',            labelA: 'Чётное',  labelB: 'Нечётное' },
  { id: 'coin',      emoji: '🪙', title: 'Монетка',          labelA: 'Орёл',    labelB: 'Решка' },
  { id: 'cards',     emoji: '🃏', title: 'Карта',            labelA: 'Красная', labelB: 'Чёрная' },
  { id: 'dart',      emoji: '🎯', title: 'Дротик',           labelA: 'Попадёт', labelB: 'Промах' },
  { id: 'number',    emoji: '🔢', title: 'Число',            labelA: '1-5',     labelB: '6-10' },
  { id: 'rainbow',   emoji: '🌈', title: 'Радуга',           labelA: 'Тёплый',  labelB: 'Холодный' },
  { id: 'snail',     emoji: '🐢', title: 'Улитка',           labelA: 'Левая',   labelB: 'Правая' },
  { id: 'lightning', emoji: '⚡', title: 'Молния',           labelA: 'Ударит',  labelB: 'Мимо' },
  { id: 'clover',    emoji: '🍀', title: 'Клевер',           labelA: 'Найдёшь', labelB: 'Нет' },
  { id: 'star',      emoji: '⭐', title: 'Звезда',           labelA: 'Вверх',   labelB: 'Вниз' },
  { id: 'word',      emoji: '📝', title: 'Угадай слово',     labelA: '',        labelB: '' },
  { id: 'tictactoe', emoji: '⭕', title: 'Крестики-нолики',  labelA: '',        labelB: '' },
];

const BETS = [10, 50, 100, 500, 5000];
const CHIP_PACKS = [10, 100, 1000];
const TAPS_PER_CHIP = 500;

type Result = { won: boolean; detail: string; roll: string; visual?: string; bet: number; choice: string };

export function MinigamesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [bet, setBet] = useState(10);
  const [betInput, setBetInput] = useState('10');
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);

  const [wordLength, setWordLength] = useState<3 | 4 | 5>(4);
  const [wordState, setWordState] = useState<{
    sessionId: string;
    masked: string[];
    attemptsLeft: number;
    input: string;
    history: { letter: string; correct: boolean }[];
    finished: 'won' | 'lost' | null;
    word?: string;
  } | null>(null);

  const [tttState, setTttState] = useState<{
    sessionId: string;
    board: string[];
    status: 'playing' | 'won' | 'lost' | 'draw';
  } | null>(null);

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
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const sellChips = async (chipsAmount: number) => {
    try {
      const r = await api.sellChips(chipsAmount);
      setBalance(Number(r.balance));
      setChips(Number(r.chips));
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const sellAllChips = async () => {
    if (chips <= 0) return;
    try {
      const r = await api.sellAllChips();
      setBalance(Number(r.balance));
      setChips(Number(r.chips));
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const startWord = async () => {
    try {
      const r = await api.wordStart(bet, wordLength);
      setChips(Number(r.chips));
      setWordState({
        sessionId: r.sessionId,
        masked: r.masked,
        attemptsLeft: r.attemptsLeft,
        input: '',
        history: [],
        finished: null,
      });
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const guessWord = async () => {
    if (!wordState || wordState.input.length !== 1 || wordState.finished) return;
    try {
      const r = await api.wordGuess(wordState.sessionId, wordState.input);
      if (r.chips) setChips(Number(r.chips));
      setWordState(prev => prev ? {
        ...prev,
        masked: r.masked,
        attemptsLeft: r.attemptsLeft,
        input: '',
        history: r.already ? prev.history : [...prev.history, { letter: r.letter, correct: r.correct }],
        finished: r.won ? 'won' : r.lost ? 'lost' : null,
        word: r.word,
      } : null);
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const startTtt = async () => {
    try {
      const r = await api.tttStart(bet);
      setChips(Number(r.chips));
      setTttState({ sessionId: r.sessionId, board: r.board, status: 'playing' });
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const tttMove = async (cell: number) => {
    if (!tttState || tttState.status !== 'playing') return;
    if (tttState.board[cell] !== '') return;
    try {
      const r = await api.tttMove(tttState.sessionId, cell);
      if (r.chips) setChips(Number(r.chips));
      setTttState(prev => prev ? { ...prev, board: r.board, status: r.status } : null);
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
  };

  const play = async (choice: 'A' | 'B') => {
    if (!selectedGame || playing) return;
    setPlaying(true);
    setLastResult(null);
    try {
      const r = await api.playMinigame(selectedGame.id, bet, choice);
      setChips(Number(r.chips));
      const res: Result = { won: r.won, detail: r.detail, roll: r.roll, visual: r.visual, bet, choice };
      setLastResult(res);
      setHistory(h => [res, ...h].slice(0, 10));
    } catch (e: any) { alert(e?.body?.error || 'Error'); }
    finally { setTimeout(() => setPlaying(false), 600); }
  };

  const backToLobby = () => {
    setSelectedGame(null);
    setLastResult(null);
    setWordState(null);
    setTttState(null);
  };

  return (
    <Modal open={open} onClose={() => { backToLobby(); onClose(); }} title="🎲 Мини-игры">
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
        <div className="mb-4 space-y-3">
          <div>
            <div className="text-xs text-[var(--tg-hint)] mb-1 font-bold">💰 Купить фишки</div>
            <div className="grid grid-cols-3 gap-1.5">
              {CHIP_PACKS.map(n => {
                const taps = n * TAPS_PER_CHIP;
                const can = balance >= taps;
                return (
                  <button
                    key={'buy' + n}
                    onClick={() => buyChips(taps)}
                    disabled={!can}
                    className={`py-2 rounded-xl font-bold text-xs transition flex flex-col items-center ${
                      can ? 'bg-green-500 text-white active:scale-95' : 'bg-gray-300 text-gray-500'
                    }`}
                  >
                    <span className="text-base leading-tight">+{n}</span>
                    <span className="opacity-80 text-[9px] leading-tight">{fmt(taps)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--tg-hint)] mb-1 font-bold">💵 Продать фишки</div>
            <div className="grid grid-cols-3 gap-1.5">
              {CHIP_PACKS.map(n => {
                const can = chips >= n;
                return (
                  <button
                    key={'sell' + n}
                    onClick={() => sellChips(n)}
                    disabled={!can}
                    className={`py-2 rounded-xl font-bold text-xs transition flex flex-col items-center ${
                      can ? 'bg-orange-500 text-white active:scale-95' : 'bg-gray-300 text-gray-500'
                    }`}
                  >
                    <span className="text-base leading-tight">−{n}</span>
                    <span className="opacity-80 text-[9px] leading-tight">{fmt(n * TAPS_PER_CHIP)}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={sellAllChips}
              disabled={chips <= 0}
              className={`mt-2 w-full py-3 rounded-2xl font-black text-sm transition ${
                chips > 0
                  ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white active:scale-95'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              💰 Продать ВСЁ ({fmt(chips)} 🪙 → {fmt(chips * TAPS_PER_CHIP)} тапов)
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              <input
                type="text"
                inputMode="numeric"
                value={betInput}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setBetInput(raw);
                  const v = Number(raw) || 0;
                  setBet(Math.min(v, chips));
                }}
                placeholder="0"
                className="w-full py-4 rounded-2xl bg-[var(--tg-card)] text-center font-black text-2xl tabular-nums"
              />
              <div className="text-[10px] text-[var(--tg-hint)] text-center mt-1">
                доступно: {fmt(chips)} 🪙
              </div>
            </div>

            {selectedGame.id === 'word' && (
              <div className="space-y-3">
                {!wordState ? (
                  <>
                    <div className="text-xs text-[var(--tg-hint)] text-center">Длина слова</div>
                    <div className="grid grid-cols-3 gap-2">
                      {([3, 4, 5] as const).map(n => (
                        <button
                          key={n}
                          onClick={() => setWordLength(n)}
                          className={`py-3 rounded-xl font-black transition ${
                            wordLength === n ? 'bg-brand text-white' : 'bg-[var(--tg-card)]'
                          }`}
                        >{n} букв</button>
                      ))}
                    </div>
                    <button
                      onClick={startWord}
                      disabled={chips < bet}
                      className={`w-full py-6 rounded-2xl font-black text-lg transition ${
                        chips >= bet
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white active:scale-95'
                          : 'bg-gray-300 text-gray-500'
                      }`}
                    >📝 Начать ({wordLength} букв, ставка {bet})</button>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-4xl font-black tracking-[0.3em] mb-2 tabular-nums">
                        {wordState.masked.join(' ')}
                      </div>
                      <div className="text-sm text-[var(--tg-hint)]">
                        Осталось попыток: {wordState.attemptsLeft}
                      </div>
                    </div>
                    {wordState.history.length > 0 && (
                      <div className="p-3 rounded-2xl bg-[var(--tg-card)] space-y-1 max-h-32 overflow-y-auto">
                        {wordState.history.slice(-8).map((h, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="font-bold">{h.letter}</span>
                            <span className={h.correct ? 'text-green-500' : 'text-red-500'}>
                              {h.correct ? '✓ есть' : '✗ нет'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!wordState.finished ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={wordState.input}
                          onChange={e => {
                            const v = e.target.value.slice(-1);
                            setWordState(prev => prev ? { ...prev, input: v } : null);
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') guessWord(); }}
                          maxLength={1}
                          placeholder="буква"
                          autoFocus
                          className="flex-1 py-4 rounded-2xl text-center text-2xl font-black bg-[var(--tg-card)] uppercase"
                        />
                        <button
                          onClick={guessWord}
                          disabled={wordState.input.length !== 1}
                          className={`px-6 rounded-2xl font-black transition ${
                            wordState.input.length === 1
                              ? 'bg-brand text-white active:scale-95'
                              : 'bg-gray-300 text-gray-500'
                          }`}
                        >→</button>
                      </div>
                    ) : (
                      <div className={`text-center py-4 rounded-2xl font-black ${
                        wordState.finished === 'won' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        <div className="text-2xl mb-1">
                          {wordState.finished === 'won' ? '🎉 ПОБЕДА! +100%' : '😢 Проиграл'}
                        </div>
                        <div className="text-sm opacity-90">Слово: {wordState.word}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {selectedGame.id === 'tictactoe' && (
              <div className="space-y-3">
                {!tttState ? (
                  <button
                    onClick={startTtt}
                    disabled={chips < bet}
                    className={`w-full py-6 rounded-2xl font-black text-lg transition ${
                      chips >= bet
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white active:scale-95'
                        : 'bg-gray-300 text-gray-500'
                    }`}
                  >⭕ Начать игру (ставка {bet})</button>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                      {tttState.board.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => tttMove(i)}
                          disabled={c !== '' || tttState.status !== 'playing'}
                          className={`aspect-square rounded-xl text-4xl font-black transition ${
                            c === 'O' ? 'bg-blue-500 text-white'
                            : c === 'X' ? 'bg-rose-500 text-white'
                            : tttState.status === 'playing'
                              ? 'bg-[var(--tg-card)] active:scale-95'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >{c === 'O' ? '◯' : c === 'X' ? '✕' : ''}</button>
                      ))}
                    </div>
                    <div className="text-center text-xs text-[var(--tg-hint)]">
                      Ты — ◯, машина — ✕
                    </div>
                    {tttState.status !== 'playing' && (
                      <div className={`text-center py-4 rounded-2xl font-black ${
                        tttState.status === 'won' ? 'bg-green-500 text-white'
                        : tttState.status === 'lost' ? 'bg-red-500 text-white'
                        : 'bg-yellow-500 text-white'
                      }`}>
                        {tttState.status === 'won' ? '🎉 ПОБЕДА! +100%'
                          : tttState.status === 'lost' ? '😢 Проиграл'
                          : '🤝 Ничья — ставка возвращена'}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {selectedGame.id !== 'word' && selectedGame.id !== 'tictactoe' && (
              <>
                <AnimatePresence>
                  {lastResult && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`text-center py-5 rounded-2xl font-black overflow-hidden ${
                        lastResult.won ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {lastResult.visual && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: [0, 1.4, 1], rotate: 0 }}
                          transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                          className="text-7xl mb-2 drop-shadow-lg"
                        >
                          {lastResult.visual}
                        </motion.div>
                      )}
                      <div className="text-2xl mb-1">
                        {lastResult.won
                          ? '🎉 +100% = +' + lastResult.bet
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
              </>
            )}

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
