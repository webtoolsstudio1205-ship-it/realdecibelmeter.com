/** Export metadata completeness, value identity and CSV safety tests. */
import { describe, expect, it } from 'vitest';
import {
  buildExportSession,
  csvCell,
  MEASUREMENT_LIMITATIONS,
  sessionToCsv,
  sessionToJson,
} from './export-format.js';
import type { ExportSession } from './export-format.js';

function sample(over: Partial<ExportSession> = {}): ExportSession {
  return buildExportSession({
    stats: { current: -20.123456, min: -40, leq: -25.5, max: -6.0206, peakDb: -3.0103, gapMs: 1200, recordedSec: 60, durationSec: 62 },
    gaps: [{ atIso: '2026-09-15T00:01:00.000Z', durationMs: 1200, reason: 'visibility' }],
    segments: [],
    unit: 'dBFS',
    mode: 'digital',
    weighting: 'A',
    response: 'fast',
    deviceLabel: '=CMD|malicious',
    deviceId: 'dev-1',
    sampleRate: 48000,
    channelCount: 1,
    processing: { echoCancellation: 'disabled', noiseSuppression: 'disabled', autoGainControl: 'unknown' },
    relaxedConstraints: ['+note', '-x', '@y'],
    calibration: { id: 'uncalibrated', label: 'Digital dBFS (uncalibrated)', offsetDb: 0, isCalibrated: false },
    calibrationMethod: 'none',
    calibrationDateIso: null,
    startedAtIso: '2026-09-15T00:00:00.000Z',
    invalidSamples: 3,
    ...over,
  });
}

const REQUIRED_FIELDS = [
  'started_at', 'timezone', 'recorded_sec', 'gap_ms', 'unit', 'weighting', 'response',
  'device_label', 'sample_rate_hz', 'calibration_status', 'calibration_method',
  'current_db', 'min_db', 'leq_db', 'max_db', 'sampled_peak_dbfs',
  'software_version', 'limitations',
];

describe('exports', () => {
  it('CSV and JSON carry every required export field', () => {
    const s = sample();
    const csv = sessionToCsv(s);
    for (const f of REQUIRED_FIELDS) expect(csv, f).toContain(f);
    const json = JSON.parse(sessionToJson(s)) as { session: ExportSession };
    for (const f of ['startedAtIso', 'timezone', 'unit', 'weighting', 'leqDb', 'peakDb', 'softwareVersion', 'limitations']) {
      expect(json.session, f).toHaveProperty(f);
    }
  });

  it('CSV, JSON (and PDF source) use the same unrounded engine values', () => {
    const s = sample();
    const csv = sessionToCsv(s);
    const json = JSON.parse(sessionToJson(s)) as { session: ExportSession };
    const csvLeq = csv.split('\n').find((l) => l.startsWith('leq_db,'))?.split(',')[1];
    expect(csvLeq).toBe(String(s.leqDb));
    expect(json.session.leqDb).toBe(s.leqDb);
    expect(json.session.currentDb).toBe(s.currentDb);
  });

  it('CSV cells starting with = + - @ are neutralized (no formula execution)', () => {
    expect(csvCell('=CMD|test')).toBe("'=CMD|test");
    expect(csvCell('+123abc')).toBe("'+123abc");
    expect(csvCell('-x')).toBe("'-x");
    expect(csvCell('@x')).toBe("'@x");
    // Pure numbers (including negatives) survive untouched for round-trips.
    expect(csvCell('-25.5')).toBe('-25.5');
    expect(csvCell('48000')).toBe('48000');
    const csv = sessionToCsv(sample());
    const deviceLine = csv.split('\n').find((l) => l.startsWith('device_label,')) as string;
    expect(deviceLine).toContain("'=CMD|malicious");
    expect(deviceLine).not.toMatch(/,=CMD/);
  });

  it('limitations disclose the non-certified nature honestly', () => {
    expect(MEASUREMENT_LIMITATIONS).toMatch(/not certified/i);
    expect(MEASUREMENT_LIMITATIONS).toMatch(/not dB SPL|digital dBFS/);
  });
});
