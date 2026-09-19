import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const minigamesRouter = Router();

const CHIPS_PER_TAP = 100n;
const MIN_BET = 10;
const MAX_BET = 1_000_000;

// 🎲 Шансы
const WIN_CHANCE = 0.40;   // 40% выигрыш
const LOSE_CHANCE = 0.70;  // 70% проигрыш

const BuyChipsSchema = z.object({
  taps: z.number().int().positive().max(100_000_000),
});

minigamesRouter.post('/minigames/buy-chips', async (req, res) => {
  const parsed = BuyChipsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const tapsCost = BigInt(parsed.data.taps);
  if (tapsCost % CHIPS_PER_TAP !== 0n) {
    return res.status(400).json({ error: 'must_be_multiple_of_100' });
  }
  const chipsToGive = tapsCost / CHIPS_PER_TAP;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.balance < tapsCost) return res.status(400).json({ error: 'insufficient_funds' });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: { decrement: tapsCost },
      chips: { increment: chipsToGive },
    },
  });
  res.json({ ok: true, balance: updated.balance.toString(), chips: updated.chips.toString() });
});

const SellChipsSchema = z.object({
  chips: z.number().int().positive().max(1_000_000),
});

minigamesRouter.post('/minigames/sell-chips', async (req, res) => {
  const parsed = SellChipsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const chipsCost = BigInt(parsed.data.chips);
  const tapsToGive = chipsCost * CHIPS_PER_TAP;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.chips < chipsCost) return res.status(400).json({ error: 'insufficient_chips' });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { chips: { decrement: chipsCost }, balance: { increment: tapsToGive } },
  });
  res.json({ ok: true, balance: updated.balance.toString(), chips: updated.chips.toString() });
});

minigamesRouter.post('/minigames/sell-all-chips', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.chips <= 0n) return res.status(400).json({ error: 'nothing_to_sell' });

  const sold = user.chips;
  const tapsToGive = sold * CHIPS_PER_TAP;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { chips: 0n, balance: { increment: tapsToGive } },
  });

  res.json({
    ok: true,
    sold: sold.toString(),
    balance: updated.balance.toString(),
    chips: updated.chips.toString(),
  });
});

function pickVisual(gameId: string, isA: boolean): string {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const num = (n: number) => String.fromCodePoint(0x30 + n) + '\uFE0F\u20E3';
  switch (gameId) {
    case 'dice': {
      const v = isA ? pick([2, 4, 6]) : pick([1, 3, 5]);
      return num(v);
    }
    case 'coin':      return isA ? '\uD83E\uDD85' : '\uD83C\uDF1D';
    case 'cards':     return isA ? '\uD83D\uDFE5' : '\u2B1B';
    case 'dart':      return isA ? '\uD83C\uDFAF' : '\uD83D\uDCA8';
    case 'number': {
      const v = isA ? pick([1,2,3,4,5]) : pick([6,7,8,9,10]);
      return v === 10 ? '\uD83D\uDD1F' : num(v);
    }
    case 'rainbow':   return isA
      ? pick(['\u2764\uFE0F','\uD83E\uDDE1','\uD83D\uDC9B'])
      : pick(['\uD83D\uDC9C','\uD83D\uDC99','\uD83D\uDC9A','\uD83E\uDE75']);
    case 'snail':     return isA ? '\uD83D\uDC22' : '\uD83D\uDC0C';
    case 'lightning': return isA ? '\u26A1' : '\u2601\uFE0F';
    case 'clover':    return isA ? '\uD83C\uDF40' : '\uD83C\uDF3F';
    case 'star':      return isA ? '\u2B50' : '\uD83C\uDF20';
    default:          return isA ? '\uD83C\uDD70\uFE0F' : '\uD83C\uDD71\uFE0F';
  }
}

const PlaySchema = z.object({
  gameId: z.string(),
  bet: z.number().int().min(MIN_BET).max(MAX_BET),
  choice: z.string(),
});

/** 🎲 40% выигрыш ×2, 60% проигрыш −bet */
minigamesRouter.post('/minigames/play', async (req, res) => {
  const parsed = PlaySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });

  const { gameId, bet, choice } = parsed.data;
  if (choice !== 'A' && choice !== 'B') {
    return res.status(400).json({ error: 'choice_must_be_A_or_B' });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.chips < BigInt(bet)) return res.status(400).json({ error: 'insufficient_chips' });

  const roll = Math.random();
  const won = roll < WIN_CHANCE;

  const serverResult: 'A' | 'B' = won
    ? (choice as 'A' | 'B')
    : (choice === 'A' ? 'B' : 'A');

  let detail = '';
  const isA = serverResult === 'A';
  switch (gameId) {
    case 'dice':      detail = isA ? 'Выпало чётное' : 'Выпало нечётное'; break;
    case 'coin':      detail = isA ? '🪙 Орёл' : '🪙 Решка'; break;
    case 'cards':     detail = isA ? '🟥 Красная карта' : '⬛ Чёрная карта'; break;
    case 'dart':      detail = isA ? '🎯 Попал в цель!' : '💨 Промах'; break;
    case 'number':    detail = isA ? 'Выпало 1-5' : 'Выпало 6-10'; break;
    case 'rainbow':   detail = isA ? '🔥 Тёплый оттенок' : '❄️ Холодный оттенок'; break;
    case 'snail':     detail = isA ? '🐢 Левая быстрее' : '🐢 Правая быстрее'; break;
    case 'lightning': detail = isA ? '⚡ Молния ударила!' : '☁️ Молния ушла в сторону'; break;
    case 'clover':    detail = isA ? '🍀 Нашёл клевер!' : '🌿 Обычная трава'; break;
    case 'star':      detail = isA ? '⭐ Упала звезда' : '🌠 Звезда улетела'; break;
    default:          detail = isA ? 'A' : 'B';
  }

  const chipsDelta = won ? BigInt(bet * 2) : -BigInt(bet);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { chips: { increment: chipsDelta } },
  });

  const visual = pickVisual(gameId, serverResult === 'A');

  res.json({
    ok: true,
    won,
    result: serverResult,
    detail,
    visual,
    roll: roll.toFixed(4),
    chips: updated.chips.toString(),
    delta: Number(chipsDelta),
  });
});

minigamesRouter.get('/minigames/me', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  res.json({
    chips: user.chips.toString(),
    balance: user.balance.toString(),
    rate: CHIPS_PER_TAP.toString(),
  });
});

// ===================== УГАДАЙ СЛОВО =====================

const WORDS_3 = [
  'дом', 'кот', 'лук', 'сон', 'лес', 'мёд', 'час', 'год', 'бег', 'дым',
  'шум', 'газ', 'пар', 'сок', 'суп', 'чай', 'рот', 'нос', 'зуб', 'глаз',
  'куб', 'шар', 'мяч', 'рак', 'жук', 'меч', 'щит', 'ключ', 'меч', 'таз',
  'холм', 'дуб', 'бак', 'бык', 'вол', 'воз', 'гад', 'гип', 'горн', 'гул',
  'жал', 'жел', 'жир', 'зал', 'зов', 'кол', 'кот', 'кум', 'лак', 'лещ',
];

const WORDS_4 = [
  'окно', 'стол', 'вода', 'гора', 'река', 'луна', 'небо', 'свет', 'тень', 'снег',
  'поле', 'море', 'село', 'порт', 'метр', 'флаг', 'краб', 'слон', 'ключ', 'игра',
  'друг', 'брат', 'стул', 'шкаф', 'нота', 'пила', 'рука', 'нога', 'тело', 'душа',
  'лист', 'куст', 'мост', 'хлеб', 'торт', 'соль', 'пруд', 'гром', 'роса', 'иней',
  'зной', 'танк', 'скот', 'стон', 'степ', 'дуга', 'медь', 'цинк', 'нить', 'кожа',
];

const WORDS_5 = [
  'книга', 'время', 'земля', 'птица', 'рыбак', 'сахар', 'слово', 'точка', 'ветер', 'птица',
  'школа', 'доска', 'ручка', 'стена', 'океан', 'берег', 'закат', 'цветок', 'трава', 'лимон',
  'банан', 'карто', 'кирпи', 'пчела', 'сапог', 'шапка', 'сумка', 'футбо', 'хокке', 'театр',
  'актер', 'артис', 'лодка', 'флот', 'погон', 'знамя', 'копьё', 'мечет', 'врата', 'герой',
  'пират', 'рой', 'рояль', 'сцена', 'сюжет', 'талант', 'финал', 'фишка', 'фокус', 'юмор',
];

const WORDS_BY_LEN: Record<number, string[]> = { 3: WORDS_3, 4: WORDS_4, 5: WORDS_5 };

type WordSession = {
  userId: string;
  word: string;
  bet: number;
  attemptsLeft: number;
  guessed: Set<string>;
  revealed: boolean[];
  startedAt: number;
};

const wordSessions = new Map<string, WordSession>();
type TttSession = {
  userId: string;
  bet: number;
  board: string[];
  turn: 'player' | 'bot';
  startedAt: number;
  finished: boolean;
};

const tttSessions = new Map<string, TttSession>();

function newSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, s] of wordSessions) if (now - s.startedAt > 30 * 60_000) wordSessions.delete(id);
  for (const [id, s] of tttSessions) if (now - s.startedAt > 30 * 60_000) tttSessions.delete(id);
}, 60_000);
if (typeof (cleanupTimer as any).unref === 'function') (cleanupTimer as any).unref();

const WordStartSchema = z.object({
  bet: z.number().int().min(MIN_BET).max(MAX_BET),
  wordLength: z.union([z.literal(3), z.literal(4), z.literal(5)]),
});

minigamesRouter.post('/minigames/word/start', async (req, res) => {
  const parsed = WordStartSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });
  const { bet, wordLength } = parsed.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.chips < BigInt(bet)) return res.status(400).json({ error: 'insufficient_chips' });

  const pool = WORDS_BY_LEN[wordLength];
  const word = pool[Math.floor(Math.random() * pool.length)];
  const sessionId = newSessionId();

  wordSessions.set(sessionId, {
    userId: req.userId!,
    word,
    bet,
    attemptsLeft: wordLength + 3,
    guessed: new Set(),
    revealed: new Array(wordLength).fill(false),
    startedAt: Date.now(),
  });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { chips: { decrement: BigInt(bet) } },
  });

  res.json({
    ok: true,
    sessionId,
    wordLength,
    masked: new Array(wordLength).fill('_'),
    attemptsLeft: wordLength + 3,
    chips: updated.chips.toString(),
  });
});

const WordGuessSchema = z.object({
  sessionId: z.string(),
  letter: z.string().min(1).max(2),
});

minigamesRouter.post('/minigames/word/guess', async (req, res) => {
  const parsed = WordGuessSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });
  const { sessionId, letter } = parsed.data;
  const session = wordSessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'session_not_found' });
  if (session.userId !== req.userId!) return res.status(403).json({ error: 'forbidden' });

  const L = letter.toUpperCase();
  const wordLen = session.word.length;
  if (session.guessed.has(L)) {
    return res.json({
      ok: true,
      correct: true,
      already: true,
      masked: session.word.split('').map((c, i) => (session.revealed[i] ? c.toUpperCase() : '_')),
      attemptsLeft: session.attemptsLeft,
    });
  }
  session.guessed.add(L);

  const wordUp = session.word.toUpperCase();
  let correct = false;
  for (let i = 0; i < wordLen; i++) {
    if (wordUp[i] === L && !session.revealed[i]) {
      session.revealed[i] = true;
      correct = true;
    }
  }
  if (!correct) session.attemptsLeft -= 1;

  const masked = session.word.split('').map((c, i) => (session.revealed[i] ? c.toUpperCase() : '_'));
  const won = session.revealed.every(Boolean);
  const lost = !won && session.attemptsLeft <= 0;

  let chips: string | null = null;
  if (won) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
    const reward = BigInt(session.bet * 2);
    const upd = await prisma.user.update({
      where: { id: user.id },
      data: { chips: { increment: reward } },
    });
    chips = upd.chips.toString();
    wordSessions.delete(sessionId);
  } else if (lost) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
    chips = user.chips.toString();
    wordSessions.delete(sessionId);
  }

  res.json({
    ok: true,
    correct,
    letter: L,
    masked,
    attemptsLeft: session.attemptsLeft,
    won,
    lost,
    word: (won || lost) ? session.word.toUpperCase() : undefined,
    chips,
  });
});

// ===================== КРЕСТИКИ-НОЛИКИ =====================

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function tttWinner(b: string[]): 'X' | 'O' | null {
  for (const [a, c, d] of LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a] as 'X' | 'O';
  }
  return null;
}

function tttFull(b: string[]): boolean {
  return b.every(c => c !== '');
}

function tttBest(b: string[], player: 'X' | 'O'): { score: number; move: number } {
  const w = tttWinner(b);
  if (w === 'X') return { score: 10, move: -1 };
  if (w === 'O') return { score: -10, move: -1 };
  if (tttFull(b)) return { score: 0, move: -1 };

  let best: { score: number; move: number } = { score: player === 'X' ? -Infinity : Infinity, move: -1 };
  for (let i = 0; i < 9; i++) {
    if (b[i] !== '') continue;
    b[i] = player;
    const r = tttBest(b, player === 'X' ? 'O' : 'X');
    b[i] = '';
    if (player === 'X') {
      if (r.score > best.score) best = { score: r.score, move: i };
    } else {
      if (r.score < best.score) best = { score: r.score, move: i };
    }
  }
  return best;
}

function tttBotMove(board: string[]): number {
  // 40% случайный ход, 60% идеальный (минимакс).
  // Иначе победить невозможно.
  const MISTAKE_CHANCE = 0.20;
  const empty = board.map((c, i) => c === '' ? i : -1).filter(i => i >= 0);
  if (empty.length > 0 && Math.random() < MISTAKE_CHANCE) {
    return empty[Math.floor(Math.random() * empty.length)];
  }
  return tttBest(board.slice(), 'X').move;
}

const TttStartSchema = z.object({
  bet: z.number().int().min(MIN_BET).max(MAX_BET),
});

minigamesRouter.post('/minigames/tictactoe/start', async (req, res) => {
  const parsed = TttStartSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });
  const { bet } = parsed.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (user.chips < BigInt(bet)) return res.status(400).json({ error: 'insufficient_chips' });

  const board = ['','','','','','','','',''];
  const playerFirst = Math.random() < 0.5;
  let firstMover: 'player' | 'bot' = 'player';

  if (!playerFirst) {
    const move = tttBotMove(board);
    if (move >= 0) board[move] = 'X';
    firstMover = 'bot';
  }

  const sessionId = newSessionId();
  tttSessions.set(sessionId, {
    userId: req.userId!,
    bet,
    board,
    turn: 'player',
    startedAt: Date.now(),
    finished: false,
  });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { chips: { decrement: BigInt(bet) } },
  });

  res.json({
    ok: true,
    sessionId,
    board,
    firstMover,
    chips: updated.chips.toString(),
  });
});

const TttMoveSchema = z.object({
  sessionId: z.string(),
  cell: z.number().int().min(0).max(8),
});

minigamesRouter.post('/minigames/tictactoe/move', async (req, res) => {
  const parsed = TttMoveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_payload' });
  const { sessionId, cell } = parsed.data;
  const s = tttSessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'session_not_found' });
  if (s.userId !== req.userId!) return res.status(403).json({ error: 'forbidden' });
  if (s.finished) return res.status(400).json({ error: 'session_finished' });
  if (s.board[cell] !== '') return res.status(400).json({ error: 'cell_taken' });

  s.board[cell] = 'O';
  let status: 'playing' | 'won' | 'lost' | 'draw' = 'playing';

  if (tttWinner(s.board) === 'O') {
    status = 'won';
    s.finished = true;
  } else if (tttFull(s.board)) {
    status = 'draw';
    s.finished = true;
  } else {
    const bot = tttBotMove(s.board);
    if (bot >= 0) s.board[bot] = 'X';

    if (tttWinner(s.board) === 'X') {
      status = 'lost';
      s.finished = true;
    } else if (tttFull(s.board)) {
      status = 'draw';
      s.finished = true;
    }
  }

  let chips: string | null = null;
  if (status === 'won') {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
    const reward = BigInt(s.bet * 2);
    const upd = await prisma.user.update({
      where: { id: user.id },
      data: { chips: { increment: reward } },
    });
    chips = upd.chips.toString();
    tttSessions.delete(sessionId);
  } else if (status === 'lost') {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
    chips = user.chips.toString();
    tttSessions.delete(sessionId);
  } else if (status === 'draw') {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
    const upd = await prisma.user.update({
      where: { id: user.id },
      data: { chips: { increment: BigInt(s.bet) } },
    });
    chips = upd.chips.toString();
    tttSessions.delete(sessionId);
  }

  res.json({ ok: true, board: s.board, status, chips });
});
