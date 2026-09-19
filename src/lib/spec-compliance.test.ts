/**
 * Spec-compliance suite for the two-mode (nominal estimate vs calibrated-SPL)
 * presentation model. Uses deterministic fixtures — no microphone required.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  analyzeBlock,
  digitalRmsDbfs,
  digitalToInputStrength,
  formatDb,
  silenceFixture,
  sineFixture,
} from './dsp.js';
import { applyOffset } from './calibration.js';
import { DecibelEngine } from './engine.js';
import type { CaptureCallbacks, CaptureController, CaptureStartInfo } from './microphone.js';
import { analyzeBlock as analyze, SosFilter, type SosSection } from './dsp.js';
import {
  DIGITAL_FLOOR_DBFS,
  DEFAULT_ESTIMATE_OFFSET_DB,
  digitalDiagnostics,
  nominalSoundEstimate,
  publicGauge,
  publicGraph,
  publicMeasurementMode,
  publicStats,
  transportControls,
} from './presentation.js';
import type { EngineSnapshot } from './types.js';
import { SessionAccumulator } from './session.js';

const panelSource = () =>
  readFileSync(fileURLToPath(new URL('../components/MeterPanel.astro', import.meta.url)), 'utf8');

function snapshot(overrides: Partial<EngineSnapshot> = {}): EngineSnapshot {
  return {
    state: 'running', error: 'none', errorDetail: '', weighting: 'A', response: 'fast',
    mode: 'digital', unit: 'dBFS',
    result: { kind: 'digital', valueDbfs: -53.2, unit: 'dBFS' },
    inputStrengthPct: 46.8, calibrationValid: false,
    display: { current: -53.2, min: -60, leq: -53.2, max: -42, peakDb: -19.2 },
    calibration: { id: 'uncalibrated', label: 'Uncalibrated', offsetDb: 0, isCalibrated: false },
    activeProfile: null, baseline: null, calibrationStale: false, calibrationStaleReasons: [],
    stats: { current: -53.2, min: -60, max: -42, leq: -53.2, durationSec: 12, samples: 100, peakDb: -19.2, gapMs: 0, gapCount: 0, recordedSec: 12 },
    permission: 'granted', deviceLabel: 'Fixture mic', deviceId: 'fixture', sampleRate: 48000,
    channelCount: 1, processing: { echoCancellation: 'disabled', noiseSuppression: 'disabled', autoGainControl: 'disabled' },
    relaxedConstraints: [], secureContext: true, lastUpdateAt: 0, spectrumDb: [], gaps: [], gapMs: 0,
    segments: [], referenceCapture: null, verificationCapture: null, meterRange: [-100, 0], storageOk: true, appVersion: 'test',
    ...overrides,
  };
}

class FakeCapture implements CaptureController {
  disposeCalls = 0;
  cb: CaptureCallbacks | null = null;
  private seq = 0;
  private filter = new SosFilter([]);
  private gain = 1;
  private on = false;
  get active(): boolean { return this.on; }
  async start(_d: string, sos: number[][], gain: number, cb: CaptureCallbacks): Promise<CaptureStartInfo> {
    this.on = true;
    this.cb = cb;
    this.filter = new SosFilter(sos as SosSection[]);
    this.gain = gain;
    return {
      sampleRate: 48000, label: 'Fake Mic', channelCount: 1,
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
  dispose(): void { this.disposeCalls++; this.on = false; this.cb = null; }
  feed(pcm: Float32Array): void {
    if (!this.cb) throw new Error('capture not started');
    for (let i = 0; i < pcm.length; i += 128) {
      const block = pcm.slice(i, i + 128);
      const filtered = this.filter.process(block);
      const scaled = Float32Array.from(filtered, (v) => v * this.gain);
      const a = analyze(filtered.length ? scaled : scaled);
      this.cb.onQuantum({
        seq: this.seq++, frames: block.length, sumSq: a.sumSq, n: a.validCount,
        peak: a.peak, clipped: a.clippedCount, dcSum: a.dcMean * a.validCount,
        nan: a.nanCount, inf: a.infCount, framesTotal: (this.seq + 1) * 128,
      });
    }
  }
}

function stabilizingHarness() {
  let t = 5_000_000;
  const fakes: FakeCapture[] = [];
  const engine = new DecibelEngine({
    now: () => t, uiThrottleMs: 0, stabilizeMs: 1500,
    createCapture: () => { const f = new FakeCapture(); fakes.push(f); return f; },
  });
  return { engine, fakes, advance: (ms: number) => { t += ms; } };
}

describe('spec fixtures', () => {
  it('1. −53.2 dBFS becomes a 46.8 dBA nominal estimate', () => {
    expect(DIGITAL_FLOOR_DBFS).toBe(-100);
    expect(DEFAULT_ESTIMATE_OFFSET_DB).toBe(100);
    expect(nominalSoundEstimate(-53.2)).toBeCloseTo(46.8, 9);
    expect(digitalToInputStrength(-53.2)).toBeCloseTo(46.8, 9);
  });

  it('2–3. uncalibrated public stats show estimated dBA and no raw dBFS', () => {
    const rendered = JSON.stringify(publicStats(snapshot()));
    expect(rendered).not.toMatch(/-\d+\.\d/);
    expect(rendered).not.toMatch(/dBFS/i);
    for (const banned of ['Digital Energy Average', 'Digital Peak', 'Raw Current', 'Current Digital Level', 'Minimum Digital Level']) {
      expect(rendered).not.toContain(banned);
    }
    expect(publicStats(snapshot()).map((s) => s.label)).toEqual(
      ['Current estimated sound level', 'Minimum', 'Energy average', 'Maximum', 'Duration'],
    );
    expect(publicStats(snapshot())[0]?.value).toBe('46.8 dBA');
  });

  it('4. Digital Diagnostics keeps the original negative dBFS', () => {
    expect(digitalDiagnostics(snapshot())[0]).toEqual({ label: 'Current', value: '-53.2 dBFS' });
  });

  it('5. −53.2 + 113.2 renders 60.0 dBA', () => {
    expect(applyOffset(-53.2, 113.2)).toBeCloseTo(60, 9);
    expect(`${formatDb(applyOffset(-53.2, 113.2))} dBA`).toBe('60.0 dBA');
    const s = snapshot({
      mode: 'calibrated', unit: 'dBA', calibrationValid: true,
      result: { kind: 'calibrated', spl: 60, unit: 'dBA', profileId: 'p', offsetDb: 113.2 },
      display: { current: 60, min: 53.2, leq: 60, max: 71.2, peakDb: 94 },
    });
    expect(publicStats(s)[0]?.value).toBe('60.0 dBA');
  });

  it('6. mismatched calibration returns to nominal-estimate mode', () => {
    expect(publicMeasurementMode(snapshot())).toBe('estimated-spl');
    const cal = snapshot({
      mode: 'calibrated', calibrationValid: true,
      result: { kind: 'calibrated', spl: 60, unit: 'dBA', profileId: 'p', offsetDb: 113.2 },
    });
    expect(publicMeasurementMode(cal)).toBe('calibrated-spl');
    const stale = snapshot({
      mode: 'digital', calibrationValid: false,
      result: { kind: 'uncalibrated', reason: 'calibration-required', unit: 'dBA' },
      calibrationStale: true, calibrationStaleReasons: ['Microphone device changed.'],
    });
    expect(publicMeasurementMode(stale)).toBe('estimated-spl');
    expect(publicGauge(stale)).toMatchObject({ unit: 'dBA', lo: 20, hi: 120, calibrated: false });
  });

  it('7–8. uncalibrated gauge and graph use nominal dBA estimates', () => {
    expect(publicGauge(snapshot())).toMatchObject({ unit: 'dBA', lo: 20, hi: 120, value: 46.8 });
    expect(publicGraph([-100, -53.2, 0], snapshot())).toEqual({
      series: [0, 46.8, 100], lo: 20, hi: 120, label: 'Estimated sound level (dBA)', unit: 'dBA',
    });
  });

  it('9. calibrated gauge and graph use the selected dBA/dBC/dBZ unit', () => {
    for (const unit of ['dBA', 'dBC', 'dBZ'] as const) {
      const s = snapshot({
        mode: 'calibrated', unit, calibrationValid: true,
        result: { kind: 'calibrated', spl: 60, unit, profileId: 'p', offsetDb: 113.2 },
        display: { current: 60, min: 53.2, leq: 60, max: 71.2, peakDb: 94 },
      });
      expect(publicGauge(s)).toMatchObject({ value: 60, unit, lo: 20, hi: 120 });
      expect(publicGraph([-53.2], s)).toMatchObject({ series: [60], lo: 20, hi: 120, unit });
    }
  });

  it('10. nominal estimate carries the selected weighting and disclosure', () => {
    const g = publicGauge(snapshot());
    expect(g.unit).toBe('dBA');
    expect(g.calibrated).toBe(false);
    expect(g.status).toMatch(/calibrat/i);
    const src = panelSource();
    expect(src).not.toMatch(/rdm-weight-badge|weight-badge|A-badge/);
  });

  it('11–13. Start never opens a popup; Customize and calibration CTA open settings', () => {
    const src = panelSource();
    expect(src).toMatch(/els\.start\?\.addEventListener[\s\S]{0,180}engine\.start\(\)/);
    expect(src).not.toMatch(/els\.start\?\.addEventListener[\s\S]{0,180}openModal/);
    expect(src).not.toMatch(/Choose how you want to measure sound/);
    expect(src).toContain("els.customize?.addEventListener('click', openModal)");
    expect(src).toMatch(/els\.ctaCal\?\.addEventListener\('click', \(\) => openModal\(\)\)/);
  });

  it('14. state-based controls incl. stabilizing; no Pause+Resume together', () => {
    expect(transportControls('idle')).toEqual(['start', 'customize']);
    expect(transportControls('requesting-permission')).toEqual(['requesting', 'cancel']);
    expect(transportControls('stabilizing')).toEqual(['stabilizing', 'stop', 'customize']);
    expect(transportControls('running')).toEqual(['pause', 'stop', 'customize']);
    expect(transportControls('paused')).toEqual(['resume', 'stop', 'customize']);
    expect(transportControls('stopped')).toEqual(['start-new', 'save', 'reset']);
    for (const st of ['idle', 'requesting-permission', 'stabilizing', 'running', 'paused', 'stopped', 'error'] as const) {
      const c = transportControls(st);
      expect(c.includes('pause') && c.includes('resume')).toBe(false);
    }
  });

  it('15. Stop releases the microphone', async () => {
    let t = 0;
    const fakes: FakeCapture[] = [];
    const engine = new DecibelEngine({
      now: () => t, uiThrottleMs: 0, stabilizeMs: 0,
      createCapture: () => { const f = new FakeCapture(); fakes.push(f); return f; },
    });
    await engine.start();
    engine.stop();
    expect(fakes[0]?.disposeCalls).toBe(1);
    expect(fakes[0]?.active).toBe(false);
    expect(engine.snapshot().state).toBe('stopped');
  });

  it('16. no skeleton placeholders survive in the panel', () => {
    expect(panelSource().toLowerCase()).not.toContain('skeleton');
  });

  it('16b. no dead data attributes leak digital labels into public markup', () => {
    const src = panelSource();
    expect(src).not.toMatch(/data-s-/);
    // Public markup is everything before Digital Diagnostics; diagnostic
    // labels live only inside Customize → Advanced → Digital Diagnostics.
    const publicPart = src.split('id="rdm-diagnostics"')[0] as string;
    expect(publicPart).not.toMatch(/Digital energy average|Digital peak|Digital Input|Raw Current|Current Digital Level|Minimum Digital Level/i);
  });

  it('17. stabilization samples are excluded from public statistics', async () => {
    const { engine, fakes, advance } = stabilizingHarness();
    await engine.start();
    expect(engine.snapshot().state).toBe('stabilizing');
    fakes[0]?.feed(sineFixture(1000, 48000, 0.5, 0.5));
    advance(500);
    fakes[0]?.feed(sineFixture(1000, 48000, 0.5, 0.5));
    const mid = engine.snapshot();
    expect(mid.state).toBe('stabilizing');
    expect(mid.stats.samples).toBe(0);
    expect(mid.stats.current).toBeNull();
    advance(1200);
    fakes[0]?.feed(sineFixture(1000, 48000, 0.5, 0.5));
    const after = engine.snapshot();
    expect(after.state).toBe('running');
    expect(after.stats.samples).toBe(24000);
    expect(after.stats.current).not.toBeNull();
  });

  it('18. silence never produces NaN or Infinity in public outputs', () => {
    expect(digitalRmsDbfs(silenceFixture(4096))).toBe(Number.NEGATIVE_INFINITY);
    expect(formatDb(Number.NEGATIVE_INFINITY)).toBe('--');
    const acc = new SessionAccumulator();
    acc.begin(0, { weighting: 'A', calibrationId: null, sampleRate: 48000 });
    acc.ingest({ sumSq: 0, n: 4800, peak: 0, weightedDb: null, atMs: 100 });
    const s = acc.snapshot(200);
    expect(s.leq == null || s.leq === Number.NEGATIVE_INFINITY).toBe(true);
    expect(s.leq == null || Number.isNaN(s.leq as number)).toBe(false);
  });

  it('19. clipping and processing gaps are detected', async () => {
    expect(analyzeBlock([0.1, -0.2, 0.999, 1.0, -1.5, 0.3]).clippedCount).toBe(3);
    let t = 0;
    const fakes: FakeCapture[] = [];
    const engine = new DecibelEngine({
      now: () => t, uiThrottleMs: 0, stabilizeMs: 0,
      createCapture: () => { const f = new FakeCapture(); fakes.push(f); return f; },
    });
    await engine.start();
    fakes[0]?.feed(sineFixture(1000, 48000, 0.1, 0.5));
    (fakes[0] as unknown as { seq: number }).seq += 10;
    fakes[0]?.feed(sineFixture(1000, 48000, 128 / 48000, 0.5));
    const s = engine.snapshot();
    expect(s.gapMs).toBeGreaterThan(0);
    expect(s.gaps[s.gaps.length - 1]?.reason).toBe('missing-quanta');
  });

  it('20. energy averaging: equal-duration 40 dB + 60 dB ≈ 57.0329 dB', () => {
    const acc = new SessionAccumulator();
    acc.begin(0, { weighting: 'A', calibrationId: null, sampleRate: 48000 });
    acc.push(40);
    acc.push(60);
    expect(acc.snapshot(1000).leq).toBeCloseTo(57.0329, 3);
  });

  it('21–22. animation loops are cleaned up; reduced motion disables effects', () => {
    const src = panelSource();
    expect(src).toContain('cancelAnimationFrame');
    expect(src).toContain('cancelRaf()');
    expect(src).toContain("window.addEventListener('pagehide', cleanup");
    const css = readFileSync(fileURLToPath(new URL('../styles/global.css', import.meta.url)), 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
