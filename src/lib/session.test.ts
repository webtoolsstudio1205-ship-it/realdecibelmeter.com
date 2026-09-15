/**
 * Session energy-average verification. Proves the Leq is a true energy mean
 * over processed samples — never an arithmetic mean of dB readings.
 */
import { describe, expect, it } from 'vitest';
import { SessionAccumulator } from './session.js';

const dbToEnergy = (db: number) => Math.pow(10, db / 10);

function feed(acc: SessionAccumulator, db: number, seconds: number, atMs: number, fs = 48000): number {
  // Feed 100 ms quanta of constant-level energy.
  let t = atMs;
  const step = 100;
  for (let s = 0; s < seconds * 1000; s += step) {
    acc.ingest({ sumSq: dbToEnergy(db) * fs * (step / 1000), n: Math.round(fs * (step / 1000)), peak: Math.pow(10, db / 20), weightedDb: db, atMs: t });
    t += step;
  }
  return t;
}

describe('session energy average', () => {
  it('10. equal 40 dB + 60 dB blocks give ≈ 57.0329 dB, not 50 dB', () => {
    const acc = new SessionAccumulator();
    acc.begin(0, { weighting: 'Z', calibrationId: null, sampleRate: 48000 });
    let t = feed(acc, 40, 10, 0);
    t = feed(acc, 60, 10, t);
    const s = acc.snapshot(t);
    expect(s.leq).not.toBeNull();
    expect(Math.abs((s.leq as number) - 57.0329)).toBeLessThanOrEqual(0.01);
    expect(Math.abs((s.leq as number) - 50)).toBeGreaterThan(5);
  });

  it('11. pause and resume exclude paused samples and time', () => {
    const acc = new SessionAccumulator();
    acc.begin(1000, { weighting: 'Z', calibrationId: null, sampleRate: 48000 });
    let t = feed(acc, 50, 5, 1000);
    acc.pause(t);
    const samplesBefore = acc.snapshot(t).samples;
    // Quanta arriving while paused must be ignored.
    acc.ingest({ sumSq: dbToEnergy(90) * 4800, n: 4800, peak: 1, weightedDb: 90, atMs: t + 1000 });
    t += 10_000; // 10 s paused
    acc.resume(t);
    const mid = acc.snapshot(t);
    expect(mid.samples).toBe(samplesBefore);
    expect(mid.max).toBeLessThan(60); // the 90 dB paused quantum never landed
    t = feed(acc, 50, 5, t);
    const s = acc.snapshot(t);
    expect(s.durationSec).toBeCloseTo(10, 0); // 5 + 5 s, pause excluded
    expect(Math.abs((s.leq as number) - 50)).toBeLessThanOrEqual(0.01);
  });

  it('12. capture gaps appear in session metadata (pause is not a gap)', () => {
    const acc = new SessionAccumulator();
    acc.begin(0, { weighting: 'Z', calibrationId: null, sampleRate: 48000 });
    acc.pause(1000);
    acc.resume(2000);
    expect(acc.snapshot(2000).gapCount).toBe(0);
    acc.markGap(1500, 'missing-quanta', 3000);
    acc.markGap(500, 'visibility', 4000);
    const s = acc.snapshot(4000);
    expect(s.gapCount).toBe(2);
    expect(s.gapMs).toBe(2000);
    expect(s.gaps[0]).toMatchObject({ durationMs: 1500, reason: 'missing-quanta' });
  });

  it('keeps current/min/max/peak distinct; silence yields null current, not 0', () => {
    const acc = new SessionAccumulator();
    acc.begin(0, { weighting: 'Z', calibrationId: null, sampleRate: 48000 });
    feed(acc, -20, 2, 0);
    feed(acc, -10, 2, 2000);
    const s = acc.snapshot(4000);
    expect(s.min).toBeCloseTo(-20, 6);
    expect(s.max).toBeCloseTo(-10, 6);
    expect(s.peakDb).toBeCloseTo(-10, 6);
    expect(s.recordedSec).toBeCloseTo(4, 6);
    // Silence quantum: energy 0 is valid data, but no finite display level.
    acc.ingest({ sumSq: 0, n: 4800, peak: 0, weightedDb: null, atMs: 4000 });
    const s2 = acc.snapshot(4000);
    expect(s2.current).toBeCloseTo(-10, 6); // last finite reading retained
    expect(s2.leq as number).toBeLessThan(s.leq as number); // silence dilutes energy
  });

  it('reconfigure() segments the session so configs never mix', () => {
    const acc = new SessionAccumulator();
    acc.begin(0, { weighting: 'A', calibrationId: null, sampleRate: 48000 });
    feed(acc, -20, 2, 0);
    acc.reconfigure({ weighting: 'C', calibrationId: null, sampleRate: 48000 }, 2000);
    feed(acc, -20, 2, 2000);
    const s = acc.snapshot(4000);
    expect(s.segments.length).toBe(1);
    expect(s.segments[0]).toMatchObject({ weighting: 'A', sampleCount: 96000 });
  });
});
