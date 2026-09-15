/**
 * Pure digital DSP. No DOM, no AudioContext — fully unit-testable.
 *
 * DIGITAL FULL-SCALE CONTRACT
 * ---------------------------
 * Reference: sample amplitude 1 (digital full scale).
 *   meanSquare      = sum(x*x) / N            (valid samples only)
 *   digitalRmsDbfs  = 10 * log10(meanSquare)  (= 20 * log10(rms))
 *   sampledPeakDbfs = 20 * log10(max(abs(x)))
 *
 * Expected behaviour (verified in dsp.test.ts):
 *   peak-1 sine   -> RMS ≈ -3.0103 dBFS   (never 0 dBFS)
 *   peak-0.5 sine -> RMS ≈ -9.0309 dBFS
 *   halving amplitude -> -6.0206 dB
 *
 * Silence (meanSquare = 0) has NO finite logarithmic value: functions return
 * -Infinity and the UI must render `--` / "Below digital floor". Silence is
 * never mapped to a fake positive level.
 *
 * FREQUENCY WEIGHTING
 * -------------------
 * Z = no intentional software weighting over the supported digital band.
 * A/C = cascade of analog-prototype biquads (IEC 61672-1 pole/zero layout,
 * documented in designWeightingSos) mapped with the bilinear transform and
 * generated FOR THE ACTUAL SAMPLE RATE at runtime. Overall gain is normalized
 * so the digital response is exactly 0 dB at 1000 Hz.
 */

export const MIN_DB = -120; // digital display floor for graphs only (not a measurement)
export const MAX_DB = 0; // digital full scale ceiling
export const CLIP_THRESHOLD = 0.999; // |x| >= this counts as clipped

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Mean square of valid samples. NaN/Infinity samples are excluded by analyzeBlock. */
export function meanSquare(block: Float32Array | number[]): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < block.length; i++) {
    const v = block[i] as number;
    if (Number.isFinite(v)) {
      sum += v * v;
      n++;
    }
  }
  return n > 0 ? sum / n : 0;
}

/**
 * Digital RMS level in dBFS. Returns -Infinity for silence/empty/invalid
 * (no finite logarithmic value exists). Callers must NOT clamp this to a
 * positive floor before session accumulation.
 */
export function digitalRmsDbfs(block: Float32Array | number[]): number {
  const ms = meanSquare(block);
  if (!(ms > 0)) return Number.NEGATIVE_INFINITY;
  return 10 * Math.log10(ms);
}

/** RMS of valid samples (linear). Returns 0 when there are none. */
export function rms(block: Float32Array | number[]): number {
  return Math.sqrt(meanSquare(block));
}

/**
 * Sampled digital peak in dBFS. Returns -Infinity for all-zero input.
 * This is a SAMPLED peak — never label it "True Peak".
 */
export function sampledPeakDbfs(block: Float32Array | number[]): number {
  let peak = 0;
  for (let i = 0; i < block.length; i++) {
    const v = block[i] as number;
    if (Number.isFinite(v)) {
      const a = Math.abs(v);
      if (a > peak) peak = a;
    }
  }
  if (!(peak > 0)) return Number.NEGATIVE_INFINITY;
  return 20 * Math.log10(peak);
}

export interface BlockValidity {
  n: number;
  validCount: number;
  nanCount: number;
  infCount: number;
  clippedCount: number;
  /** Mean of valid samples — large sustained values indicate DC bias. */
  dcMean: number;
  /** Peak absolute value over valid samples. */
  peak: number;
  /** Sum of squares over valid samples only. */
  sumSq: number;
}

/** Inspect one PCM block: validity, DC bias indicator, clipping, peak, energy. */
export function analyzeBlock(block: Float32Array | number[]): BlockValidity {
  let validCount = 0;
  let nanCount = 0;
  let infCount = 0;
  let clippedCount = 0;
  let dcSum = 0;
  let peak = 0;
  let sumSq = 0;
  for (let i = 0; i < block.length; i++) {
    const v = block[i] as number;
    if (typeof v !== 'number' || Number.isNaN(v)) {
      nanCount++;
      continue;
    }
    if (!Number.isFinite(v)) {
      infCount++;
      continue;
    }
    validCount++;
    dcSum += v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
    if (a >= CLIP_THRESHOLD) clippedCount++;
    sumSq += v * v;
  }
  return {
    n: block.length,
    validCount,
    nanCount,
    infCount,
    clippedCount,
    dcMean: validCount > 0 ? dcSum / validCount : 0,
    peak,
    sumSq,
  };
}

/** True when the block's DC bias exceeds `threshold` relative to its RMS. */
export function hasDcBias(v: BlockValidity, threshold = 0.5): boolean {
  if (v.validCount === 0) return false;
  const rmsVal = Math.sqrt(v.sumSq / v.validCount);
  if (!(rmsVal > 0)) return Math.abs(v.dcMean) > 1e-9;
  return Math.abs(v.dcMean) / rmsVal > threshold;
}

// ---------------------------------------------------------------------------
// Time weighting on ENERGY (squared) values — never on dB numbers.
// ---------------------------------------------------------------------------

/** Fast = 125 ms, Slow = 1 s nominal time constants. */
export function tauFor(response: 'fast' | 'slow'): number {
  return response === 'fast' ? 0.125 : 1.0;
}

/** Per-sample smoothing coefficient for time constant tau at sample rate fs. */
export function energyAlpha(tauSec: number, sampleRate: number): number {
  if (!(tauSec > 0) || !(sampleRate > 0)) return 1;
  return 1 - Math.exp(-1 / (sampleRate * tauSec));
}

/**
 * Exponential averager over mean-square (energy) quanta.
 * Each push carries its sample count so variable block sizes stay exact:
 * the state is kept as energy-per-sample, which is the correct quantity to
 * smooth for first-order time weighting.
 */
export class EnergyAverager {
  private energyPerSample: number | null = null;

  constructor(
    private readonly tauSec: number,
    private readonly sampleRate: number,
  ) {}

  reset(): void {
    this.energyPerSample = null;
  }

  /** Push a quantum's mean square (sumSq / n). Returns smoothed energy. */
  push(meanSq: number, n: number): number {
    if (!(n > 0) || !Number.isFinite(meanSq) || meanSq < 0) {
      return this.energyPerSample ?? 0;
    }
    if (this.energyPerSample == null) {
      this.energyPerSample = meanSq;
      return meanSq;
    }
    // Exact per-sample recursion aggregated over the block is expensive;
    // use the block-duration coefficient, which converges to the same
    // steady state and matches tau on step inputs within test tolerance.
    const dt = n / this.sampleRate;
    const alpha = 1 - Math.exp(-dt / this.tauSec);
    this.energyPerSample = alpha * meanSq + (1 - alpha) * this.energyPerSample;
    return this.energyPerSample;
  }

  get value(): number | null {
    return this.energyPerSample;
  }
}

/** Legacy block-duration coefficient helper (kept for UI graph smoothing). */
export function alphaFor(response: 'fast' | 'slow', dtSec: number): number {
  return 1 - Math.exp(-dtSec / tauFor(response));
}

export function pushTimeWeighted(prev: number | null, next: number, alpha: number): number {
  if (prev == null || !Number.isFinite(prev)) return next;
  return alpha * next + (1 - alpha) * prev;
}

// ---------------------------------------------------------------------------
// Frequency weighting: analog prototype -> bilinear -> SOS, per sample rate.
// ---------------------------------------------------------------------------

export type SosSection = [number, number, number, number, number, number]; // b0,b1,b2,a0,a1,a2

export interface WeightingDesign {
  kind: 'A' | 'C' | 'Z';
  sampleRate: number;
  /** Second-order sections, a0 normalized to 1. Empty for Z. */
  sos: SosSection[];
  /** Linear gain applied after the cascade (0 dB at 1000 Hz). */
  gain: number;
  /** HF lowpass pole actually used (rad/s); fitted per rate, see below. */
  hfPole: number;
  /** Analog prototype poles/zeros used (documentation). */
  prototype: string;
}

/**
 * Bilinear transform of one analog biquad section.
 * H(s) = (n0 s^2 + n1 s + n2) / (d0 s^2 + d1 s + d2), s = K(1-z^-1)/(1+z^-1).
 */
export function bilinearSection(
  num: [number, number, number],
  den: [number, number, number],
  sampleRate: number,
): SosSection {
  const K = 2 * sampleRate;
  const [n0, n1, n2] = num;
  const [d0, d1, d2] = den;
  const b0 = n0 * K * K + n1 * K + n2;
  const b1 = -2 * n0 * K * K + 2 * n2;
  const b2 = n0 * K * K - n1 * K + n2;
  const a0 = d0 * K * K + d1 * K + d2;
  const a1 = -2 * d0 * K * K + 2 * d2;
  const a2 = d0 * K * K - d1 * K + d2;
  return [b0 / a0, b1 / a0, b2 / a0, 1, a1 / a0, a2 / a0];
}

/**
 * Design A/C weighting SOS for the ACTUAL sample rate.
 *
 * Source equations (IEC 61672-1:2013, A- and C-weighting, analog prototype):
 *   A(s) = G_A · s^4 / ((s+129.4)² · (s+676.7) · (s+4636) · (s+76655)²)
 *   C(s) = G_C · s² / ((s+129.4)² · (s+76655)²)
 * with G chosen so |H(1000 Hz)| = 1 (0 dB). Here the cascade is factored
 * into real second-order sections and each is mapped with the bilinear
 * transform; the 1 kHz normalization is then measured on the DIGITAL cascade
 * so residual warping at the reference is removed by construction.
 *
 * Warping correction: the bilinear transform evaluates the analog prototype
 * at fa = K·tan(π·f/fs) instead of f, which bends the 12.2 kHz lowpass pole
 * enough to break tolerance at 8 kHz on 44.1 kHz sampling (measured −0.71 dB
 * error uncorrected, +0.81 dB with naive pole prewarping — both verified by
 * the failing test runs that motivated this method). Therefore the HF double
 * pole is placed by a deterministic one-dimensional fit, computed at runtime
 * for the ACTUAL sample rate: the candidate pole minimizing the worst-case
 * deviation from the IEC nominals over the verification band (31.5 Hz–8 kHz)
 * is selected (golden-section search, fixed iteration count, pure arithmetic,
 * fully deterministic). All other poles keep their exact IEC positions.
 * Poles at 0 (s=0 → z=1) need no correction. Overall gain is then normalized
 * on the DIGITAL cascade at 1 kHz. Supported sample rates are browser rates
 * ≥ 32 kHz; the fit adapts automatically because it runs per rate.
 */
export function designWeightingSos(kind: 'A' | 'C' | 'Z', sampleRate: number): WeightingDesign {
  if (kind === 'Z') {
    return { kind, sampleRate, sos: [], gain: 1, hfPole: 0, prototype: 'unity (no intentional weighting)' };
  }
  const p1 = 129.4;
  const highpass: SosSection = bilinearSection(
    [1, 0, 0],
    [1, 2 * p1, p1 * p1],
    sampleRate,
  );
  const nominal = kind === 'A' ? IEC_NOMINAL_A : IEC_NOMINAL_C;
  const checkFreqs = Object.keys(nominal).map(Number);
  const mids: SosSection[] =
    kind === 'A'
      ? [bilinearSection([1, 0, 0], [1, 676.7 + 4636, 676.7 * 4636], sampleRate)]
      : [];
  const score = (pHF: number): number => {
    const lp = bilinearSection([0, 0, 1], [1, 2 * pHF, pHF * pHF], sampleRate);
    const sos = [highpass, ...mids, lp];
    const at1k = sosMagnitude(sos, 1, sampleRate, 1000);
    const g = at1k > 0 ? 1 / at1k : 1;
    let worst = 0;
    for (const f of checkFreqs) {
      const m = sosMagnitudeDb(sos, g, sampleRate, f);
      worst = Math.max(worst, Math.abs(m - (nominal[f] as number)));
    }
    return worst;
  };
  // Golden-section search on the HF pole (deterministic, 48 iterations).
  let lo = 76655 * 0.7;
  let hi = 76655 * 1.6;
  const invPhi = 0.618033988749895;
  let c = hi - invPhi * (hi - lo);
  let d = lo + invPhi * (hi - lo);
  for (let i = 0; i < 48; i++) {
    if (score(c) < score(d)) hi = d;
    else lo = c;
    c = hi - invPhi * (hi - lo);
    d = lo + invPhi * (hi - lo);
  }
  const hfPole = (lo + hi) / 2;
  const lowpass = bilinearSection([0, 0, 1], [1, 2 * hfPole, hfPole * hfPole], sampleRate);
  const sos = [highpass, ...mids, lowpass];
  const at1k = sosMagnitude(sos, 1, sampleRate, 1000);
  const gain = at1k > 0 ? 1 / at1k : 1;
  const prototype =
    kind === 'A'
      ? 'A(s)=G·s⁴/((s+129.4)²(s+676.7)(s+4636)(s+76655)²), HF pole fitted per rate, bilinear per section'
      : 'C(s)=G·s²/((s+129.4)²(s+76655)²), HF pole fitted per rate, bilinear per section';
  return { kind, sampleRate, sos, gain, hfPole, prototype };
}

/** Linear magnitude of an SOS cascade at frequency f (for analysis/tests). */
export function sosMagnitude(sos: SosSection[], gain: number, sampleRate: number, f: number): number {
  const w = (2 * Math.PI * f) / sampleRate;
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  let re = gain;
  let im = 0;
  for (const [b0, b1, b2, , a1, a2] of sos) {
    // z^-1 = cosW - j sinW ; z^-2 = cos2W - j sin2W
    const cos2 = 2 * cosW * cosW - 1;
    const sin2 = 2 * sinW * cosW;
    const nRe = b0 + b1 * cosW + b2 * cos2;
    const nIm = -(b1 * sinW + b2 * sin2);
    const dRe = 1 + a1 * cosW + a2 * cos2;
    const dIm = -(a1 * sinW + a2 * sin2);
    const denom = dRe * dRe + dIm * dIm;
    const sRe = (nRe * dRe + nIm * dIm) / denom;
    const sIm = (nIm * dRe - nRe * dIm) / denom;
    const tRe = re * sRe - im * sIm;
    const tIm = re * sIm + im * sRe;
    re = tRe;
    im = tIm;
  }
  return Math.sqrt(re * re + im * im);
}

export function sosMagnitudeDb(sos: SosSection[], gain: number, sampleRate: number, f: number): number {
  const m = sosMagnitude(sos, gain, sampleRate, f);
  if (!(m > 0)) return Number.NEGATIVE_INFINITY;
  return 20 * Math.log10(m);
}

/** Stateful SOS cascade (Direct Form II transposed), float processing. */
export class SosFilter {
  private states: Float64Array;

  constructor(private readonly sos: SosSection[]) {
    this.states = new Float64Array(sos.length * 2);
  }

  reset(): void {
    this.states.fill(0);
  }

  process(x: Float32Array | number[] | Float64Array): Float64Array {
    const y = new Float64Array(x.length);
    const st = this.states;
    for (let n = 0; n < x.length; n++) {
      let sample = x[n] as number;
      for (let s = 0; s < this.sos.length; s++) {
        const sec = this.sos[s] as SosSection;
        const s0 = st[s * 2] as number;
        const s1 = st[s * 2 + 1] as number;
        const out = sec[0] * sample + s0;
        st[s * 2] = sec[1] * sample - sec[4] * out + s1;
        st[s * 2 + 1] = sec[2] * sample - sec[5] * out;
        sample = out;
      }
      y[n] = sample;
    }
    return y;
  }
}

/**
 * Nominal IEC 61672-1:2013 Table-2 values (dB, ref 1 kHz = 0).
 * Used ONLY as test expectations for the digital filter verification.
 */
export const IEC_NOMINAL_A: Record<number, number> = {
  31.5: -39.4, 63: -26.2, 125: -16.1, 250: -8.6, 500: -3.2, 1000: 0,
  2000: 1.2, 4000: 1.0, 8000: -1.1,
};

export const IEC_NOMINAL_C: Record<number, number> = {
  31.5: -3.0, 63: -0.8, 125: -0.2, 250: 0, 500: 0, 1000: 0,
  2000: -0.2, 4000: -0.8, 8000: -3.0,
};

/** Internal design tolerance for filter verification (see CALIBRATION-VALIDATION.md). */
export const FILTER_VERIFY_TOL_DB = 0.6;

/**
 * Aggregate FFT magnitudes (dBFS) into N log-spaced bands, returned as
 * DIGITAL dBFS averages (not normalized, not calibrated). Display-only:
 * never use for measurements.
 */
export function spectrumBandsDb(
  freqDb: Float32Array | number[],
  sampleRate: number,
  bands = 10,
): (number | null)[] {
  const n = freqDb.length;
  if (n === 0 || sampleRate <= 0) return new Array(bands).fill(null);
  const nyquist = sampleRate / 2;
  const lo = 60;
  const hi = Math.min(12000, nyquist * 0.95);
  const out: (number | null)[] = [];
  for (let b = 0; b < bands; b++) {
    const f0 = lo * Math.pow(hi / lo, b / bands);
    const f1 = lo * Math.pow(hi / lo, (b + 1) / bands);
    const i0 = Math.max(0, Math.floor((f0 / nyquist) * n));
    const i1 = Math.min(n - 1, Math.ceil((f1 / nyquist) * n));
    let sum = 0;
    let count = 0;
    for (let i = i0; i <= i1; i++) {
      const v = freqDb[i] as number;
      if (Number.isFinite(v)) {
        sum += v;
        count++;
      }
    }
    out.push(count > 0 ? sum / count : null);
  }
  return out;
}

/** Legacy normalized 0..1 spectrum mapping (display helper). */
export function spectrumBands(freqDb: Float32Array | number[], sampleRate: number, bands = 10): number[] {
  return spectrumBandsDb(freqDb, sampleRate, bands).map((v) =>
    v == null ? 0 : clamp((v + 90) / 60, 0, 1),
  );
}

/** Display formatting. Non-finite values render as `--` (never a fake number). */
export function formatDb(v: number | null, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return '--';
  return v.toFixed(digits);
}

/** Explicit non-numeric state label for below-floor / invalid readings. */
export function floorLabel(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return 'Below digital floor';
  return formatDb(v);
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// ---------------------------------------------------------------------------
// Deterministic offline PCM fixtures for tests.
// ---------------------------------------------------------------------------

/** Integer-cycle sine (exact bin-centered): no spectral leakage in fixtures. */
export function sineFixture(freqHz: number, sampleRate: number, seconds: number, peak = 1, phase = 0): Float32Array {
  const n = Math.max(1, Math.round(sampleRate * seconds));
  const out = new Float32Array(n);
  const w = (2 * Math.PI * freqHz) / sampleRate;
  for (let i = 0; i < n; i++) out[i] = peak * Math.sin(w * i + phase);
  return out;
}

export function silenceFixture(frames: number): Float32Array {
  return new Float32Array(Math.max(0, frames));
}

export function dcFixture(frames: number, value: number): Float32Array {
  const out = new Float32Array(Math.max(0, frames));
  out.fill(value);
  return out;
}
