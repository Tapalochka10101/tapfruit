export function xorshift32(state: number): number {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return state >>> 0;
}

export function rollCrit(seed: number, tapIndex: number, chance: number): boolean {
  if (chance <= 0) return false;
  let s = (seed ^ Math.imul(tapIndex + 1, 2654435761)) >>> 0;
  if (s === 0) s = 1;
  const r = xorshift32(s) / 0x1_0000_0000;
  return r < chance;
}