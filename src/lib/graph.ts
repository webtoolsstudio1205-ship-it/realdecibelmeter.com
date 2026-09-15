/** Fixed-capacity ring buffer feeding the real-time graph. */

export class GraphData {
  private buf: number[];
  private head = 0;
  private len = 0;

  constructor(public capacity = 240) {
    this.buf = new Array<number>(capacity).fill(Number.NaN);
  }

  push(v: number | null): void {
    this.buf[this.head] = v == null || !Number.isFinite(v) ? Number.NaN : v;
    this.head = (this.head + 1) % this.capacity;
    this.len = Math.min(this.len + 1, this.capacity);
  }

  clear(): void {
    this.buf.fill(Number.NaN);
    this.head = 0;
    this.len = 0;
  }

  series(): (number | null)[] {
    const out: (number | null)[] = [];
    for (let i = 0; i < this.len; i++) {
      const idx = (this.head - this.len + i + this.capacity * 2) % this.capacity;
      const v = this.buf[idx];
      out.push(v == null || Number.isNaN(v as number) ? null : (v as number));
    }
    return out;
  }

  get size(): number {
    return this.len;
  }
}

/** Render helper: map dB range to SVG y coordinates. Pure function. */
export function dbToY(db: number, height: number, lo = 30, hi = 120): number {
  const t = Math.min(1, Math.max(0, (db - lo) / (hi - lo)));
  return height - t * height;
}

export function seriesToPath(series: (number | null)[], width: number, height: number): string {
  if (series.length === 0) return '';
  const step = series.length > 1 ? width / (series.length - 1) : 0;
  let d = '';
  let started = false;
  for (let i = 0; i < series.length; i++) {
    const v = series[i];
    if (v == null) {
      started = false;
      continue;
    }
    const x = i * step;
    const y = dbToY(v, height);
    d += started ? ` L${x.toFixed(1)},${y.toFixed(1)}` : `M${x.toFixed(1)},${y.toFixed(1)}`;
    started = true;
  }
  return d;
}
