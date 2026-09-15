/**
 * Software-arithmetic verification for the digital full-scale contract.
 * Synthetic signal tests prove SOFTWARE ARITHMETIC ONLY — not acoustic
 * hardware accuracy (see docs/ENGINE-TESTS.md).
 */
import { describe, expect, it } from 'vitest';
import {
  analyzeBlock,
  dcFixture,
  designWeightingSos,
  digitalRmsDbfs,
  FILTER_VERIFY_TOL_DB,
  formatDb,
  hasDcBias,
  IEC_NOMINAL_A,
  IEC_NOMINAL_C,
  meanSquare,
  sampledPeakDbfs,
  silenceFixture,
  sineFixture,
  SosFilter,
  sosMagnitudeDb,
} from './dsp.js';

const TIGHT = 0.01; // max tolerance for pure arithmetic fixtures (dB)

function steadyStateGainDb(kind: 'A' | 'C' | 'Z', freqHz: number, sampleRate: number): number {
  const design = designWeightingSos(kind, sampleRate);
  const filter = new SosFilter(design.sos);
  const input = sineFixture(freqHz, sampleRate, 2, 0.5);
  const out = filter.process(input);
  // Discard the first second (filter settling), measure the second.
  const start = sampleRate;
  let sumIn = 0;
  let sumOut = 0;
  for (let i = start; i < input.length; i++) {
    sumIn += (input[i] as number) ** 2;
    sumOut += (out[i] as number) ** 2;
  }
  const n = input.length - start;
  return 10 * Math.log10(sumOut / n) - 10 * Math.log10(sumIn / n) + 20 * Math.log10(design.gain);
}

describe('digital full-scale contract', () => {
  it('1. integer-cycle sine amplitude 1 ≈ -3.0103 dBFS RMS (never 0)', () => {
    for (const fs of [44100, 48000]) {
      const x = sineFixture(1000, fs, 1, 1);
      const db = digitalRmsDbfs(x);
      expect(db).toBeCloseTo(-3.0103, 2); // ≈0.005 dB resolution check
      expect(Math.abs(db - -3.0103)).toBeLessThanOrEqual(TIGHT);
      expect(db).not.toBeCloseTo(0, 0);
    }
  });

  it('2. integer-cycle sine amplitude 0.5 ≈ -9.0309 dBFS RMS', () => {
    for (const fs of [44100, 48000]) {
      const db = digitalRmsDbfs(sineFixture(1000, fs, 1, 0.5));
      expect(Math.abs(db - -9.0309)).toBeLessThanOrEqual(TIGHT);
    }
  });

  it('3. halving amplitude changes level by ≈ -6.0206 dB', () => {
    const full = digitalRmsDbfs(sineFixture(440, 48000, 1, 0.8));
    const half = digitalRmsDbfs(sineFixture(440, 48000, 1, 0.4));
    expect(Math.abs(half - full - -6.0206)).toBeLessThanOrEqual(TIGHT);
  });

  it('4. digital silence has no finite level and displays as --', () => {
    const db = digitalRmsDbfs(silenceFixture(4096));
    expect(db).toBe(Number.NEGATIVE_INFINITY);
    expect(formatDb(db)).toBe('--');
    expect(formatDb(null)).toBe('--');
    expect(meanSquare(silenceFixture(0))).toBe(0);
  });

  it('5. DC input is detected via dc bias flag (energy = dc²)', () => {
    const v = analyzeBlock(dcFixture(1024, 0.25));
    expect(v.dcMean).toBeCloseTo(0.25, 6);
    expect(hasDcBias(v)).toBe(true);
    expect(digitalRmsDbfs(dcFixture(1024, 0.5))).toBeCloseTo(-6.0206, 2);
    // AC sine has negligible DC bias.
    expect(hasDcBias(analyzeBlock(sineFixture(1000, 48000, 0.2, 0.7)))).toBe(false);
  });

  it('6. clipped samples are counted', () => {
    const v = analyzeBlock([0.1, -0.2, 0.999, 1.0, -1.5, 0.3]);
    expect(v.clippedCount).toBe(3);
    expect(v.peak).toBe(1.5);
  });

  it('7. NaN and Infinity are excluded from energy, never crash math', () => {
    const clean = [0.5, -0.5, 0.25, -0.25];
    const dirty = [0.5, Number.NaN, -0.5, Number.POSITIVE_INFINITY, 0.25, Number.NEGATIVE_INFINITY, -0.25];
    const c = analyzeBlock(clean);
    const d = analyzeBlock(dirty);
    expect(d.nanCount).toBe(1);
    expect(d.infCount).toBe(2);
    expect(d.validCount).toBe(4);
    expect(d.sumSq).toBeCloseTo(c.sumSq, 12);
    expect(digitalRmsDbfs(dirty)).toBeCloseTo(digitalRmsDbfs(clean), 12);
  });

  it('8. different block sizes give the same level', () => {
    const sig = sineFixture(1000, 48000, 1, 0.6);
    const whole = digitalRmsDbfs(sig);
    for (const size of [128, 512, 4096]) {
      let sum = 0;
      let n = 0;
      for (let i = 0; i < sig.length; i += size) {
        const part = sig.slice(i, i + size);
        const a = analyzeBlock(part);
        sum += a.sumSq;
        n += a.validCount;
      }
      const reassembled = 10 * Math.log10(sum / n);
      expect(Math.abs(reassembled - whole)).toBeLessThanOrEqual(TIGHT);
    }
  });

  it('9. 44.1 kHz and 48 kHz agree on the same acoustic-equivalent tone', () => {
    const a = digitalRmsDbfs(sineFixture(1000, 44100, 1, 0.7));
    const b = digitalRmsDbfs(sineFixture(1000, 48000, 1, 0.7));
    expect(Math.abs(a - b)).toBeLessThanOrEqual(TIGHT);
  });

  it('sampled peak: amplitude-1 sine peaks at 0 dBFS and is not "true peak"', () => {
    expect(sampledPeakDbfs(sineFixture(1000, 48000, 1, 1))).toBeCloseTo(0, 2);
    expect(sampledPeakDbfs(silenceFixture(64))).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe('frequency weighting filters', () => {
  it('digital response is exactly 0 dB at the 1 kHz normalization point', () => {
    for (const fs of [44100, 48000]) {
      for (const kind of ['A', 'C', 'Z'] as const) {
        const d = designWeightingSos(kind, fs);
        expect(Math.abs(sosMagnitudeDb(d.sos, d.gain, fs, 1000))).toBeLessThan(1e-9);
      }
    }
  });

  it('coefficients are generated per sample rate (never one shared array)', () => {
    const a44 = designWeightingSos('A', 44100);
    const a48 = designWeightingSos('A', 48000);
    expect(a44.sos).not.toEqual(a48.sos);
    expect(a44.sampleRate).toBe(44100);
    expect(a48.sampleRate).toBe(48000);
  });

  it.each([44100, 48000])('A-weighting matches IEC nominal at %i Hz sample rate', (fs) => {
    for (const [f, nominal] of Object.entries(IEC_NOMINAL_A)) {
      const measured = steadyStateGainDb('A', Number(f), fs);
      expect(
        Math.abs(measured - nominal),
        `A ${f} Hz @ ${fs} Hz: measured ${measured.toFixed(3)} vs nominal ${nominal}`,
      ).toBeLessThanOrEqual(FILTER_VERIFY_TOL_DB);
    }
  });

  it.each([44100, 48000])('C-weighting matches IEC nominal at %i Hz sample rate', (fs) => {
    for (const [f, nominal] of Object.entries(IEC_NOMINAL_C)) {
      const measured = steadyStateGainDb('C', Number(f), fs);
      expect(
        Math.abs(measured - nominal),
        `C ${f} Hz @ ${fs} Hz: measured ${measured.toFixed(3)} vs nominal ${nominal}`,
      ).toBeLessThanOrEqual(FILTER_VERIFY_TOL_DB);
    }
  });

  it.each([44100, 48000])('Z-weighting is flat (0 dB) across the band at %i Hz', (fs) => {
    for (const f of [63, 125, 250, 500, 1000, 2000, 4000, 8000]) {
      expect(Math.abs(steadyStateGainDb('Z', f, fs))).toBeLessThanOrEqual(0.01);
    }
  });
});
