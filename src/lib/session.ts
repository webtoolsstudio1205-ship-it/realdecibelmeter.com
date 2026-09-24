import type { SessionStats } from './types.js';
import { calculatePercentiles } from './dsp.js';

/**
 * Session energy accumulator.
 *
 * ENERGY RULE (never violated):
 *   sessionEnergyLevel = 10 * log10(sessionEnergySum / sessionSampleCount)
 * where the sum runs over actually processed, unpaused PCM samples
 * (post-weighting-filter energy). dB readings are NEVER arithmetically
 * averaged — equal-duration 40 dB + 60 dB blocks yield ≈ 57.0329 dB.
 *
 * Kept distinct: current time-weighted level, session energy average,
 * lifetime min/max of the time-weighted level, sampled digital peak,
 * recorded (sample-based) duration, wall-clock active duration, gaps.
 */

export interface QuantumIngest {
  /** Filtered energy sum of this quantum (sum of x²). */
  sumSq: number;
  /** Valid sample count behind sumSq. */
  n: number;
  /** Sampled peak (linear amplitude) observed in this quantum. */
  peak: number;
  /** Time-weighted digital level (dBFS) for display/min/max, or null. */
  weightedDb: number | null;
  /** Captured wall time of the quantum (ms). */
  atMs: number;
}

export interface GapRecord {
  atIso: string;
  durationMs: number;
  reason: 'suspend' | 'visibility' | 'missing-quanta' | 'device';
}

export interface SegmentSummary {
  index: number;
  energySum: number;
  sampleCount: number;
  peak: number;
  min: number | null;
  max: number | null;
  startedAtIso: string;
  endedAtIso: string;
  weighting: string;
  calibrationId: string | null;
  sampleRate: number;
}

export interface SessionSnapshot extends SessionStats {
  /** Sampled digital peak (dBFS, -Infinity when nothing captured). */
  peakDb: number;
  /** Total marked capture-gap time. */
  gapMs: number;
  gapCount: number;
  /** Sample-based recorded duration (excludes pause AND gaps). */
  recordedSec: number;
  segments: SegmentSummary[];
  gaps: GapRecord[];
}

export interface SessionConfig {
  weighting: string;
  calibrationId: string | null;
  sampleRate: number;
}

export class SessionAccumulator {
  private energySum = 0;
  private sampleCount = 0;
  private peak = 0;
  private min: number | null = null;
  private max: number | null = null;
  private current: number | null = null;
  private startedAt: number | null = null;
  private pausedTotalMs = 0;
  private pauseBeganAt: number | null = null;
  private gaps: GapRecord[] = [];
  private segments: SegmentSummary[] = [];
  private segEnergy = 0;
  private segSamples = 0;
  private segPeak = 0;
  private segMin: number | null = null;
  private segMax: number | null = null;
  private segBeganIso = '';
  private levelBuffer: number[] = [];
  private config: SessionConfig = { weighting: 'Z', calibrationId: null, sampleRate: 0 };

  begin(nowMs: number, config: SessionConfig): void {
    this.reset();
    this.startedAt = nowMs;
    this.segBeganIso = new Date(nowMs).toISOString();
    this.config = { ...config };
  }

  reset(): void {
    this.energySum = 0;
    this.sampleCount = 0;
    this.peak = 0;
    this.min = null;
    this.max = null;
    this.current = null;
    this.startedAt = null;
    this.pausedTotalMs = 0;
    this.pauseBeganAt = null;
    this.gaps = [];
    this.segments = [];
    this.segEnergy = 0;
    this.segSamples = 0;
    this.segPeak = 0;
    this.segMin = null;
    this.segMax = null;
    this.segBeganIso = '';
    this.levelBuffer = [];
  }

  pause(nowMs: number): void {
    if (this.pauseBeganAt == null) this.pauseBeganAt = nowMs;
  }

  resume(nowMs: number): void {
    if (this.pauseBeganAt != null) {
      this.pausedTotalMs += nowMs - this.pauseBeganAt;
      this.pauseBeganAt = null;
    }
  }

  get paused(): boolean {
    return this.pauseBeganAt != null;
  }

  /** Record an unexpected capture interruption. Paused time is NOT a gap. */
  markGap(durationMs: number, reason: GapRecord['reason'], atMs: number): void {
    if (!(durationMs > 0)) return;
    this.gaps.push({ atIso: new Date(atMs).toISOString(), durationMs: Math.round(durationMs), reason });
  }

  /**
   * Configuration changed mid-run (weighting / calibration / rate): close the
   * current segment and start a new one so incompatible measurements are
   * never combined into one energy average.
   */
  reconfigure(config: SessionConfig, atMs: number): void {
    this.closeSegment(atMs);
    this.config = { ...config };
    this.segBeganIso = new Date(atMs).toISOString();
  }

  private closeSegment(atMs: number): void {
    if (this.startedAt == null) return;
    this.segments.push({
      index: this.segments.length,
      energySum: this.segEnergy,
      sampleCount: this.segSamples,
      peak: this.segPeak,
      min: this.segMin,
      max: this.segMax,
      startedAtIso: this.segBeganIso,
      endedAtIso: new Date(atMs).toISOString(),
      weighting: this.config.weighting,
      calibrationId: this.config.calibrationId,
      sampleRate: this.config.sampleRate,
    });
    this.segEnergy = 0;
    this.segSamples = 0;
    this.segPeak = 0;
    this.segMin = null;
    this.segMax = null;
  }

  ingest(q: QuantumIngest): void {
    if (this.startedAt == null || this.pauseBeganAt != null) return; // paused: excluded
    if (!(q.n > 0) || !Number.isFinite(q.sumSq) || q.sumSq < 0) return;
    this.energySum += q.sumSq;
    this.sampleCount += q.n;
    this.segEnergy += q.sumSq;
    this.segSamples += q.n;
    if (Number.isFinite(q.peak) && q.peak > this.peak) this.peak = q.peak;
    if (Number.isFinite(q.peak) && q.peak > this.segPeak) this.segPeak = q.peak;
    if (q.weightedDb != null && Number.isFinite(q.weightedDb)) {
      this.current = q.weightedDb;
      this.min = this.min == null ? q.weightedDb : Math.min(this.min, q.weightedDb);
      this.max = this.max == null ? q.weightedDb : Math.max(this.max, q.weightedDb);
      this.segMin = this.segMin == null ? q.weightedDb : Math.min(this.segMin, q.weightedDb);
      this.segMax = this.segMax == null ? q.weightedDb : Math.max(this.segMax, q.weightedDb);
      this.levelBuffer.push(q.weightedDb);
      if (this.levelBuffer.length > 3600) this.levelBuffer.shift();
    }
  }

  /** Legacy dB push (graph/display compat): routes through energy exactly. */
  push(db: number): void {
    if (!Number.isFinite(db)) return;
    this.current = db;
    const e = Math.pow(10, db / 10);
    this.energySum += e;
    this.sampleCount += 1;
    this.segEnergy += e;
    this.segSamples += 1;
    this.min = this.min == null ? db : Math.min(this.min, db);
    this.max = this.max == null ? db : Math.max(this.max, db);
    this.levelBuffer.push(db);
    if (this.levelBuffer.length > 3600) this.levelBuffer.shift();
  }

  snapshot(nowMs: number): SessionSnapshot {
    const leq = this.sampleCount > 0 ? 10 * Math.log10(this.energySum / this.sampleCount) : null;
    let durationSec = 0;
    if (this.startedAt != null) {
      const paused = this.pausedTotalMs + (this.pauseBeganAt != null ? nowMs - this.pauseBeganAt : 0);
      durationSec = Math.max(0, (nowMs - this.startedAt - paused) / 1000);
    }
    const rate = this.config.sampleRate > 0 ? this.config.sampleRate : 48000;
    const percentiles = calculatePercentiles(this.levelBuffer);
    return {
      current: this.current,
      min: this.min,
      max: this.max,
      leq,
      durationSec,
      samples: this.sampleCount,
      peakDb: this.peak > 0 ? 20 * Math.log10(this.peak) : Number.NEGATIVE_INFINITY,
      gapMs: this.gaps.reduce((a, g) => a + g.durationMs, 0),
      gapCount: this.gaps.length,
      recordedSec: this.sampleCount / rate,
      l10: percentiles.l10,
      l50: percentiles.l50,
      l90: percentiles.l90,
      segments: [...this.segments],
      gaps: [...this.gaps],
    };
  }

  /** Serialize lifetime aggregates (numbers + settings only, never audio). */
  serialize(nowMs: number): {
    energySum: number;
    sampleCount: number;
    peak: number;
    min: number | null;
    max: number | null;
    gapMs: number;
    segments: SegmentSummary[];
    gaps: GapRecord[];
    config: SessionConfig;
  } {
    const s = this.snapshot(nowMs);
    return {
      energySum: this.energySum,
      sampleCount: this.sampleCount,
      peak: this.peak,
      min: s.min,
      max: s.max,
      gapMs: s.gapMs,
      segments: s.segments,
      gaps: s.gaps,
      config: { ...this.config },
    };
  }
}
