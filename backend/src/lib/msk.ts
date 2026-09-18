const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

export function mskDate(d: Date = new Date()): string {
  const msk = new Date(d.getTime() + MSK_OFFSET_MS);
  return msk.toISOString().slice(0, 10);
}

export function sameMskDay(a: Date, b: Date): boolean {
  return mskDate(a) === mskDate(b);
}