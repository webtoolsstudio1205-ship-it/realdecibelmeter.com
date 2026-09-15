/** Calibration workflow, persistence and compatibility tests. */
import { describe, expect, it } from 'vitest';
import {
  checkProfileCompatibility,
  computeOffset,
  deleteProfile,
  getActiveProfileId,
  loadProfiles,
  setActiveProfileId,
  storeProfile,
  validateCalibration,
  validateReferenceInput,
  type CalibrationProfileFull,
  type CaptureConfig,
} from './calibration.js';

function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  } as Storage;
}

const baseConfig: CaptureConfig = {
  sampleRate: 48000,
  weighting: 'A',
  deviceId: 'dev-1',
  deviceLabel: 'USB Mic',
  channelCount: 1,
  processing: { echoCancellation: 'disabled', noiseSuppression: 'disabled', autoGainControl: 'disabled' },
  relaxed: [],
};

function profile(over: Partial<CalibrationProfileFull> = {}): CalibrationProfileFull {
  return {
    id: 'cal-test',
    label: 'Lab comparison',
    offsetDb: 100,
    isCalibrated: true,
    mode: 'calibrated',
    referenceReadingDb: 94,
    referenceMethod: 'reference-meter',
    referenceNote: '94 dB @ 1 kHz, same position',
    calibrationDateIso: '2026-09-15T00:00:00.000Z',
    measuredDigitalLeqDb: -6,
    referenceDurationSec: 30,
    config: { ...baseConfig },
    appVersion: '1.0.0',
    ...over,
  };
}

describe('calibration', () => {
  it('13. offset = referenceLeq − measuredDigitalEnergyLevel', () => {
    expect(computeOffset(94, -6)).toBeCloseTo(100, 9);
    expect(computeOffset(70, -30.5)).toBeCloseTo(100.5, 9);
  });

  it('14. profiles persist, reload and reset via the active id', () => {
    const st = memStorage();
    expect(loadProfiles(st)).toEqual([]);
    storeProfile(profile(), st);
    expect(loadProfiles(st).length).toBe(1);
    expect(loadProfiles(st)[0]?.offsetDb).toBe(100);
    setActiveProfileId('cal-test', st);
    expect(getActiveProfileId(st)).toBe('cal-test');
    deleteProfile('cal-test', st);
    expect(loadProfiles(st)).toEqual([]);
    expect(getActiveProfileId(st)).toBeNull();
  });

  it('14b. corrupt or foreign-schema stores load as empty, never throw', () => {
    const st = memStorage();
    st.setItem('rdm.calibration-profiles.v1', '{not json');
    expect(loadProfiles(st)).toEqual([]);
    st.setItem('rdm.calibration-profiles.v1', JSON.stringify({ schema: 999, profiles: [{ id: 'x' }] }));
    expect(loadProfiles(st)).toEqual([]);
  });

  it('15. mismatched profiles are rejected with reasons', () => {
    const p = profile();
    expect(checkProfileCompatibility(p, baseConfig).ok).toBe(true);
    const rate = checkProfileCompatibility(p, { ...baseConfig, sampleRate: 44100 });
    expect(rate.ok).toBe(false);
    expect(rate.reasons.join(' ')).toMatch(/sample rate/i);
    expect(checkProfileCompatibility(p, { ...baseConfig, deviceId: 'dev-2', deviceLabel: 'Other' }).ok).toBe(false);
    expect(checkProfileCompatibility(p, { ...baseConfig, weighting: 'C' }).ok).toBe(false);
    expect(
      checkProfileCompatibility(p, {
        ...baseConfig,
        processing: { ...baseConfig.processing, autoGainControl: 'enabled' },
      }).ok,
    ).toBe(false);
  });

  it('reference input validation rejects fantasy calibration', () => {
    const good = validateReferenceInput({
      referenceReadingDb: 94, measuredDigitalLeqDb: -6, method: 'reference-meter', durationSec: 30, note: 'ok',
    });
    expect(good.ok).toBe(true);
    const bad = validateReferenceInput({
      referenceReadingDb: Number.NaN, measuredDigitalLeqDb: Number.NaN, method: '', durationSec: 10, note: 'x'.repeat(201),
    });
    expect(bad.ok).toBe(false);
    expect(bad.reasons.length).toBeGreaterThanOrEqual(4);
  });

  it('absurd offsets are rejected', () => {
    expect(validateCalibration(Number.NaN).ok).toBe(false);
    expect(validateCalibration(61).ok).toBe(false);
    expect(validateCalibration(-60).ok).toBe(true);
  });
});
