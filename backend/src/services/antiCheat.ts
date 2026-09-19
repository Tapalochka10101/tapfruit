import { GAME } from './gameConfig.js';

export type BatchCheck = { ok: boolean; reason?: string; cps: number };

export function validateTapBatch(params: {
  count: number;
  startIdx: bigint;
  endIdx: bigint;
  serverTapIndex: bigint;
  nowMs: number;
  lastBatchAtMs: number | null;
}): BatchCheck {
  const { count, startIdx, endIdx, serverTapIndex, nowMs, lastBatchAtMs } = params;

  if (count <= 0 || count > GAME.MAX_BATCH_TAPS) {
    return { ok: false, reason: 'bad_count', cps: 0 };
  }
  if (endIdx - startIdx + 1n !== BigInt(count)) {
    return { ok: false, reason: 'index_count_mismatch', cps: 0 };
  }
  if (startIdx !== serverTapIndex) {
    return { ok: false, reason: 'index_desync', cps: 0 };
  }

  const dtMs = lastBatchAtMs ? nowMs - lastBatchAtMs : 1500;
  const cps = dtMs > 0 ? (count * 1000) / dtMs : 0;

  // CPS-проверку отключили: формула считала CPS по времени между двумя
  // батчами, а не по сессии. При частых отправках давала cps в тысячи,
  // и все батчи отклонялись. Остальные проверки (bad_count,
  // index_count_mismatch, index_desync) достаточны для античита.
  return { ok: true, cps };
}