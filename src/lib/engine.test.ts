/**
 * Engine integration tests: transport lifecycle, modes and segmentation,
 * driven through REAL DSP math (fake capture filters PCM with SosFilter).
 * Browser-only paths (getUserMedia, AudioContext) are NOT covered here —
 * see docs/ENGINE-TESTS.md "browser integration tested: pending".
 */
import { describe, expect, it } from 'vitest';
import { DecibelEngine } from './engine.js';
import { analyzeBlock, sineFixture, SosFilter, type SosSection } from './dsp.js';
import type { CaptureCallbacks, CaptureController, CaptureStartInfo } from './microphone.js';

class FakeCapture implements CaptureController {
  startCalls = 0;
  disposeCalls = 0;
  rate = 48000;
  failWith: unknown = null;
  cb: CaptureCallbacks | null = null;
  private seq = 0;
  private filter = new SosFilter([]);
  private gain = 1;
  private activeFlag = false;

  get active(): boolean {
    return this.activeFlag;
  }

  async start(_deviceId: string, sos: number[][], gain: number, cb: CaptureCallbacks): Promise<CaptureStartInfo> {
    this.startCalls++;
    if (this.failWith) throw this.failWith;
    if (this.activeFlag) throw Object.assign(new Error('duplicate stream'), { name: 'InvalidStateError' });
    this.activeFlag = true;
    this.cb = cb;
    this.filter = new SosFilter(sos as SosSection[]);
    this.gain = gain;
    return {
      sampleRate: this.rate,
      label: 'Fake Mic',
      channelCount: 1,
      processing: { echoCancellation: 'disabled', noiseSuppression: 'disabled', autoGainControl: 'disabled' },
      relaxed: [],
    };
  }

  setWeighting(sos: number[][], gain: number): void {
    this.filter = new SosFilter(sos as SosSection[]);
    this.gain = gain;
  }

  async suspend(): Promise<void> {}
  async resume(): Promise<void> {}

  dispose(): void {
    this.disposeCalls++;
    this.activeFlag = false;
    this.cb = null;
  }

  /** Push raw PCM through the real filter+analysis path in 128-frame quanta. */
  feed(pcm: Float32Array): void {
    if (!this.cb) throw new Error('capture not started');
    for (let i = 0; i < pcm.length; i += 128) {
      const block = pcm.slice(i, i + 128);
      const filtered = this.filter.process(block);
      const scaled = Float32Array.from(filtered, (v) => v * this.gain);
      const a = analyzeBlock(scaled);
      this.cb.onQuantum({
        seq: this.seq++,
        frames: block.length,
        sumSq: a.sumSq,
        n: a.validCount,
        peak: a.peak,
        clipped: a.clippedCount,
        dcSum: a.dcMean * a.validCount,
        nan: a.nanCount,
        inf: a.infCount,
        framesTotal: (this.seq + 1) * 128,
      });
    }
  }

  dropNext(nQuanta: number): void {
    this.seq += nQuanta; // simulate dropped audio blocks (seq jump)
  }

  disconnect(): void {
    this.cb?.onEnded('device-lost');
  }
}

function harness() {
  let t = 1_000_000;
  const fakes: FakeCapture[] = [];
  const engine = new DecibelEngine({
    now: () => t,
    uiThrottleMs: 0,
    createCapture: () => {
      const f = new FakeCapture();
      fakes.push(f);
      return f;
    },
  });
  return { engine, fakes, advance: (ms: number) => { t += ms; }, now: () => t };
}

describe('engine transport', () => {
  it('17. Start → Stop → Start works with no duplicate nodes or streams', async () => {
    const { engine, fakes } = harness();
    await engine.start();
    expect(engine.snapshot().state).toBe('running');
    engine.stop();
    expect(engine.snapshot().state).toBe('stopped');
    await engine.start();
    expect(engine.snapshot().state).toBe('running');
    expect(fakes.length).toBe(2);
    expect(fakes[0]?.disposeCalls).toBe(1);
    expect(fakes.filter((f) => f.active).length).toBe(1);
  });

  it('18. repeated Start clicks open exactly one stream', async () => {
    const { engine, fakes } = harness();
    await Promise.all([engine.start(), engine.start(), engine.start()]);
    expect(fakes[0]?.startCalls).toBe(1);
    expect(engine.snapshot().state).toBe('running');
  });

  it('19. permission denial lands in error with recovery, not silence', async () => {
    const denied = Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' });
    const armed = new FakeCapture();
    armed.failWith = denied;
    const engine = new DecibelEngine({ now: () => 0, uiThrottleMs: 0, createCapture: () => armed });
    await engine.start();
    const s = engine.snapshot();
    expect(s.state).toBe('error');
    expect(s.error).toBe('permission-denied');
    expect(s.errorDetail.length).toBeGreaterThan(0);
  });

  it('20. device disconnection fails loudly with device-disconnected', async () => {
    const { engine, fakes } = harness();
    await engine.start();
    fakes[0]?.disconnect();
    const s = engine.snapshot();
    expect(s.state).toBe('error');
    expect(s.error).toBe('device-disconnected');
  });
});

describe('engine measurement integrity', () => {
  it('1 kHz sine measures ≈ -9.03 dBFS digital (A≈0 at 1 kHz), labelled dBFS', async () => {
    const { engine, fakes, advance } = harness();
    await engine.start();
    const sig = sineFixture(1000, 48000, 3, 0.5);
    for (let i = 0; i < sig.length; i += 4800) {
      fakes[0]?.feed(sig.slice(i, i + 4800));
      advance(100);
    }
    const s = engine.snapshot();
    expect(s.unit).toBe('dBFS');
    expect(s.stats.leq).not.toBeNull();
    expect(Math.abs((s.stats.leq as number) - -9.0309)).toBeLessThan(0.25);
    expect(s.display.leq).toBeCloseTo(s.stats.leq as number, 9);
  });

  it('pause excludes samples; seq jumps become gaps', async () => {
    const { engine, fakes, advance } = harness();
    await engine.start();
    fakes[0]?.feed(sineFixture(1000, 48000, 4800, 0.5));
    const before = engine.snapshot().stats.samples;
    engine.pause();
    fakes[0]?.feed(sineFixture(1000, 48000, 4800, 0.9)); // ignored while paused
    advance(5000);
    engine.resume();
    const mid = engine.snapshot();
    expect(mid.stats.samples).toBe(before);
    fakes[0]?.dropNext(10); // 10 missing quanta
    fakes[0]?.feed(sineFixture(1000, 48000, 128, 0.5));
    const after = engine.snapshot();
    expect(after.gapMs).toBeGreaterThan(0);
    expect(after.gaps[after.gaps.length - 1]?.reason).toBe('missing-quanta');
  });

  it('relative mode shows change from baseline in dB (not calibration)', async () => {
    const { engine, fakes, advance } = harness();
    await engine.start();
    fakes[0]?.feed(sineFixture(1000, 48000, 4800 * 4, 0.5));
    advance(400);
    expect(engine.setBaseline().ok).toBe(true);
    expect(engine.setMode('relative').ok).toBe(true);
    const s = engine.snapshot();
    expect(s.unit).toBe('dB');
    expect(Math.abs(s.display.current as number)).toBeLessThan(1.5);
  });

  it('calibrated mode adds the reference offset and labels Estimated dB SPL', async () => {
    const { engine, fakes, advance } = harness();
    await engine.start();
    expect(engine.startReferenceCapture(30).ok).toBe(true);
    for (let s = 0; s < 30; s++) {
      fakes[0]?.feed(sineFixture(1000, 48000, 4800, 0.5));
      advance(1000);
      engine.snapshot(); // progress ticks
    }
    const measured = engine.getReferenceMeasuredLeq();
    expect(measured).not.toBeNull();
    const res = engine.applyReferenceCalibration(
      { referenceReadingDb: 94, measuredDigitalLeqDb: Number.NaN, method: 'reference-meter', durationSec: 30, note: 'test' },
      'Test comparison',
    );
    expect(res.ok).toBe(true);
    const s = engine.snapshot();
    expect(engine['activeProfile']).not.toBeNull();
    expect(s.mode).toBe('calibrated');
    expect(s.unit).toBe('dB SPL (est.)');
    expect(Math.abs((s.display.leq as number) - ((s.stats.leq as number) + 94 - (measured as number)))).toBeLessThan(1e-9);
  });

  it('weighting switch mid-run segments the session', async () => {
    const { engine, fakes } = harness();
    await engine.start();
    fakes[0]?.feed(sineFixture(1000, 48000, 2400, 0.5));
    engine.setWeighting('C');
    fakes[0]?.feed(sineFixture(1000, 48000, 2400, 0.5));
    expect(engine.snapshot().segments.length).toBe(1);
    expect(engine.snapshot().segments[0]?.weighting).toBe('A');
  });
});
