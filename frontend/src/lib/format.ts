export function fmt(n: number | string, opts: { short?: boolean } = {}): string {
  const num = typeof n === 'string' ? Number(n) : n;
  if (!isFinite(num)) return '0';
  if (opts.short && num >= 1_000_000) {
    const units = ['', 'K', 'M', 'B', 'T'];
    let u = 0; let v = num;
    while (v >= 1000 && u < units.length - 1) { v /= 1000; u++; }
    return v.toFixed(v < 10 ? 2 : 1).replace(/\.0+$/, '') + units[u];
  }
  return num.toLocaleString('ru-RU');
}

export function fmtTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}