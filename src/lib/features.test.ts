import { describe, expect, it } from 'vitest';
import {
  allowableHours,
  computeExposure,
  dosePercent,
  exposureWarningsFor,
  projected8hDosePercent,
} from './exposure.js';
import { evaluateVerification, validateVerificationInput } from './calibration.js';
import { bandRange, formatBandRange, summarizeSpectrum } from './spectrum.js';
import { buildReportRows, REPORT_NOTICE, sanitizeReportField, sanitizeReportFields } from './report.js';
import { buildExportSession } from './export-format.js';
import { compareSessions } from './history.js';
import type { ExportSession } from './export-format.js';

function sampleSession(over: Record<string, unknown> = {}): ExportSession {
  const base = {
    stats: { current: -20, min: -40, leq: -25, max: -6, peakDb: -3, gapMs: 0, recordedSec: 60, durationSec: 60 },
    gaps: [],
    segments: [],
    unit: 'dBA',
    mode: 'calibrated',
    weighting: 'A',
    response: 'slow',
    deviceLabel: 'USB Mic',
    deviceId: 'dev-1',
    sampleRate: 48000,
    channelCount: 1,
    processing: { echoCancellation: 'disabled', noiseSuppression: 'disabled', autoGainControl: 'disabled' },
    relaxedConstraints: [],
    calibration: { id: 'c1', label: 'Lab', offsetDb: 100, isCalibrated: true },
    calibrationMethod: 'reference-meter',
    calibrationDateIso: '2026-01-01T00:00:00.000Z',
    startedAtIso: '2026-01-01T00:00:00.000Z',
    invalidSamples: 0,
  };
  return buildExportSession({ ...base, ...over } as Parameters<typeof buildExportSession>[0]);
}

describe('exposure (NIOSH 3 dB exchange)', () => {
  it('85 dBA allows 8 hours; +3 dB halves, −3 dB doubles', () => {
    expect(allowableHours(85)).toBeCloseTo(8, 9);
    expect(allowableHours(88)).toBeCloseTo(4, 9);
    expect(allowableHours(91)).toBeCloseTo(2, 9);
    expect(allowableHours(82)).toBeCloseTo(16, 9);
  });

  it('dose uses the energy average over active duration', () => {
    // 85 dBA for 4 h = 50% dose.
    expect(dosePercent(85, 4 * 3600)).toBeCloseTo(50, 6);
    expect(projected8hDosePercent(85)).toBeCloseTo(100, 6);
    expect(projected8hDosePercent(88)).toBeCloseTo(200, 6);
  });

  it('C/Z weighting is ineligible for dose', () => {
    const r = computeExposure({
      laeqDb: 90, durationSec: 60, weighting: 'C', calibrated: true,
      clipping: false, gapCount: 0, gapMs: 0, calibrationStale: false, unstable: false,
    });
    expect(r.eligible).toBe(false);
    expect(r.ineligibleReason).toBe('needs-a');
  });

  it('status avoids absolute safety claims (codes only)', () => {
    const low = computeExposure({
      laeqDb: 65, durationSec: 60, weighting: 'A', calibrated: false,
      clipping: false, gapCount: 0, gapMs: 0, calibrationStale: false, unstable: false,
    });
    expect(low.status).toBe('low');
    const over = computeExposure({
      laeqDb: 95, durationSec: 4 * 3600, weighting: 'A', calibrated: true,
      clipping: false, gapCount: 0, gapMs: 0, calibrationStale: false, unstable: false,
    });
    expect(over.status).toBe('over');
  });

  it('reliability warnings surface clipping, gaps, stale profiles and instability', () => {
    expect(
      exposureWarningsFor({ clipping: true, gapCount: 0, gapMs: 0, calibrationStale: false, unstable: false }),
    ).toContain('clipping');
    expect(
      exposureWarningsFor({ clipping: false, gapCount: 2, gapMs: 500, calibrationStale: false, unstable: false }),
    ).toContain('gaps');
    expect(
      exposureWarningsFor({ clipping: false, gapCount: 0, gapMs: 0, calibrationStale: true, unstable: true }),
    ).toEqual(expect.arrayContaining(['stale-calibration', 'unstable-signal']));
  });
});

describe('calibration verification', () => {
  it('residual bands: ≤2 consistent, ≤5 caution, else inconsistent', () => {
    expect(evaluateVerification(0)).toBe('consistent');
    expect(evaluateVerification(2)).toBe('consistent');
    expect(evaluateVerification(2.1)).toBe('caution');
    expect(evaluateVerification(-5)).toBe('caution');
    expect(evaluateVerification(5.1)).toBe('inconsistent');
  });

  it('verification input requires a captured average and 30/60 s', () => {
    expect(validateVerificationInput({ verificationReferenceDb: 80, verificationBrowserDigitalDb: null, durationSec: 30 }).ok).toBe(false);
    expect(validateVerificationInput({ verificationReferenceDb: 80, verificationBrowserDigitalDb: -20, durationSec: 10 }).ok).toBe(false);
    expect(validateVerificationInput({ verificationReferenceDb: 80, verificationBrowserDigitalDb: -20, durationSec: 60 }).ok).toBe(true);
  });
});

describe('spectrum summaries', () => {
  it('band ranges tile 60 Hz–12 kHz log-spaced', () => {
    const [f0] = bandRange(0);
    const [, f1] = bandRange(9);
    expect(f0).toBeCloseTo(60, 6);
    expect(f1).toBeCloseTo(12000, 0);
    expect(formatBandRange([60, 120])).toContain('Hz');
  });

  it('low/mid/high averages and dominant region are derived, never measured', () => {
    const bands = [-80, -79, -78, -60, -59, -58, -57, -70, -71, -72];
    const s = summarizeSpectrum(bands);
    expect(s.midDb).not.toBeNull();
    expect(s.dominantBand).toBe(6);
    expect(s.dominantRegion).toBe('mid');
    expect(summarizeSpectrum(new Array(10).fill(null)).dominantBand).toBeNull();
  });
});

describe('report formatting', () => {
  it('notice is the required reference-only wording', () => {
    expect(REPORT_NOTICE).toMatch(/Reference-only browser measurement/);
    expect(REPORT_NOTICE).toMatch(/not a certified/);
  });

  it('user fields are sanitized (controls stripped, length capped, formulas neutralized)', () => {
    expect(sanitizeReportField('=CMD|evil')).toBe(`'=CMD|evil`);
    expect(sanitizeReportField('  hello\0world  ')).toBe('helloworld');
    expect(sanitizeReportField('x'.repeat(500)).length).toBeLessThanOrEqual(120);
    const f = sanitizeReportFields({ location: '@home', notes: 'ok' });
    expect(f.location.startsWith(`'`)).toBe(true);
  });

  it('report rows distinguish calibrated vs uncalibrated and raw dBFS diagnostics', () => {
    const rows = buildReportRows(sampleSession(), { title: 'T', location: 'L', distance: 'D', source: 'S', position: 'P', notes: 'N', includeComparison: false });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    expect(byKey['Reading class']).toMatch(/calibrated device-specific estimate/);
    expect(byKey['Raw digital diagnostics (dBFS)']).toMatch(/dBFS/);
    const uncal = buildReportRows(sampleSession({ calibration: { id: 'uncalibrated', label: 'Digital dBFS (uncalibrated)', offsetDb: 0, isCalibrated: false } }), { title: '', location: '', distance: '', source: '', position: '', notes: '', includeComparison: false });
    expect(Object.fromEntries(uncal.map((r) => [r.key, r.value]))['Reading class']).toMatch(/uncalibrated browser estimate/);
  });
});

describe('comparison compatibility', () => {
  it('response mismatch blocks comparison with an explanation', () => {
    const a = { id: 'a', label: 'A', savedAtIso: new Date().toISOString(), session: sampleSession({ response: 'fast' }) };
    const b = { id: 'b', label: 'B', savedAtIso: new Date().toISOString(), session: sampleSession({ response: 'slow' }) };
    const r = compareSessions(a, b);
    expect(r.compatible).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/response/i);
  });

  it('identical setups compare with an energy-average delta', () => {
    const a = { id: 'a', label: 'A', savedAtIso: new Date().toISOString(), session: sampleSession({}) };
    const b = { id: 'b', label: 'B', savedAtIso: new Date().toISOString(), session: { ...sampleSession({}), leqDb: -20 } };
    const r = compareSessions(a, b);
    expect(r.compatible).toBe(true);
    expect(r.deltaLeqDb).toBeCloseTo(-5, 9);
  });
});
