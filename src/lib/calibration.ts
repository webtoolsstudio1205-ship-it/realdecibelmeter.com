import type { CalibrationProfile } from './types.js';

/**
 * CALIBRATION MODES
 * 1. `digital`     — uncalibrated digital dBFS. Never called "dB SPL".
 * 2. `relative`    — change (dB) from a user-captured baseline. Not calibration.
 * 3. `calibrated`  — device-specific offset from a real reference comparison.
 *                     Labelled "Calibrated estimate" / "Estimated dB SPL".
 *
 * A quiet-room preset is NOT calibration. Another browser website is NOT a
 * reference. A phone app is NOT automatically a reference. A downloadable tone
 * through an ordinary speaker does NOT produce known sound pressure.
 */

export type CalibrationMode = 'digital' | 'relative' | 'calibrated';
export type TriState = 'enabled' | 'disabled' | 'unknown';
export type ReferenceMethod = 'reference-meter' | 'acoustic-calibrator' | 'other-documented';

export interface CaptureSettings {
  echoCancellation: TriState;
  noiseSuppression: TriState;
  autoGainControl: TriState;
}

export interface CaptureConfig {
  sampleRate: number;
  weighting: string;
  deviceId: string;
  deviceLabel: string;
  channelCount: number;
  processing: CaptureSettings;
  /** Constraints the browser could not honor (relayed to the user). */
  relaxed: string[];
}

export interface CalibrationProfileFull extends CalibrationProfile {
  mode: 'calibrated';
  referenceReadingDb: number;
  referenceMethod: ReferenceMethod;
  referenceNote: string;
  calibrationDateIso: string;
  measuredDigitalLeqDb: number;
  referenceDurationSec: number;
  config: CaptureConfig;
  appVersion: string;
  /** Optional second-point consistency check (never a certification). */
  verification?: VerificationRecord;
}

export interface RelativeBaseline {
  energyDb: number;
  capturedAtIso: string;
  weighting: string;
  sampleRate: number;
  deviceLabel: string;
}

/**
 * Second-point consistency check for an existing calibration offset.
 * Product guidance only — never a certification. The verification run must
 * use a DIFFERENT level or distance than the anchor capture so gain/AGC
 * issues cannot hide behind a single-point fit.
 */
export type VerificationOutcome = 'consistent' | 'caution' | 'inconsistent';

export interface VerificationRecord {
  /** Original anchor: trusted reference level from the calibration capture. */
  anchorReferenceDb: number;
  /** Original anchor: browser digital average during the calibration capture. */
  anchorBrowserDigitalDb: number;
  appliedOffsetDb: number;
  /** Second-point trusted reference level. */
  verificationReferenceDb: number;
  /** Second-point browser digital average (raw dBFS energy average). */
  verificationBrowserDigitalDb: number;
  /** Second-point browser estimate after the offset (= digital + offset). */
  verificationBrowserEstimateDb: number;
  /** Remaining error (= estimate − reference) at the verification point. */
  residualDb: number;
  verificationDateIso: string;
  durationSec: 30 | 60;
  outcome: VerificationOutcome;
}

/** Absolute residual ≤2 dB consistent, ≤5 dB caution, else inconsistent. */
export function evaluateVerification(residualDb: number): VerificationOutcome {
  const a = Math.abs(residualDb);
  if (!Number.isFinite(a)) return 'inconsistent';
  if (a <= 2) return 'consistent';
  if (a <= 5) return 'caution';
  return 'inconsistent';
}

export function validateVerificationInput(inp: {
  verificationReferenceDb: number;
  verificationBrowserDigitalDb: number | null;
  durationSec: number;
}): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!Number.isFinite(inp.verificationReferenceDb) || inp.verificationReferenceDb < -20 || inp.verificationReferenceDb > 160) {
    reasons.push('Verification reference must be a number between −20 and 160 dB.');
  }
  if (inp.verificationBrowserDigitalDb == null || !Number.isFinite(inp.verificationBrowserDigitalDb)) {
    reasons.push('No valid verification capture was recorded. Run the 30–60 s verification capture first.');
  }
  if (inp.durationSec !== 30 && inp.durationSec !== 60) {
    reasons.push('Verification capture must last 30 or 60 seconds.');
  }
  return { ok: reasons.length === 0, reasons };
}

export const UNCALIBRATED: CalibrationProfile = {
  id: 'uncalibrated',
  label: 'Digital dBFS (uncalibrated)',
  offsetDb: 0,
  isCalibrated: false,
};

export const CALIBRATION_SCHEMA = 1;
const PROFILE_KEY = 'rdm.calibration-profiles.v1';
const ACTIVE_KEY = 'rdm.calibration-active.v1';

/** offset = referenceLeq − measuredDigitalEnergyLevel (both same weighting). */
export function computeOffset(referenceLeqDb: number, measuredDigitalLeqDb: number): number {
  return referenceLeqDb - measuredDigitalLeqDb;
}

/** estimatedLevel = measuredDigitalLevel + calibrationOffset. */
export function applyOffset(measuredDigitalDb: number, offsetDb: number): number {
  return measuredDigitalDb + offsetDb;
}

export function validateCalibration(offsetDb: number): { ok: boolean; reason: string } {
  if (!Number.isFinite(offsetDb)) return { ok: false, reason: 'Offset must be a number.' };
  // Realistic range: digital −100…0 dBFS mapped to environmental 20…120 dB
  // SPL needs offsets roughly +20…+120 dB (e.g. −30 dBFS + 100 dB = 70 dBA).
  // ±120 keeps fantasy values out while accepting genuine USB/phone mics.
  if (Math.abs(offsetDb) > 120) {
    return { ok: false, reason: 'Offset is outside the plausible ±120 dB range. Check the reference value.' };
  }
  return { ok: true, reason: '' };
}

export interface ReferenceInput {
  referenceReadingDb: number;
  measuredDigitalLeqDb: number;
  method: ReferenceMethod | '';
  durationSec: number;
  note: string;
}

export function validateReferenceInput(inp: ReferenceInput): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!Number.isFinite(inp.referenceReadingDb) || inp.referenceReadingDb < -20 || inp.referenceReadingDb > 160) {
    reasons.push('Reference reading must be a number between −20 and 160 dB.');
  }
  if (!Number.isFinite(inp.measuredDigitalLeqDb)) {
    reasons.push('No valid measured digital level was captured. Run the 30–60 s reference capture first.');
  }
  if (inp.method !== 'reference-meter' && inp.method !== 'acoustic-calibrator' && inp.method !== 'other-documented') {
    reasons.push('Choose how the reference was obtained.');
  }
  if (inp.durationSec !== 30 && inp.durationSec !== 60) {
    reasons.push('Reference capture must last 30 or 60 seconds.');
  }
  if (inp.note.trim().length > 200) reasons.push('Reference note must be 200 characters or fewer.');
  return { ok: reasons.length === 0, reasons };
}

export function createProfile(
  label: string,
  offsetDb: number,
  isCalibrated: boolean,
): CalibrationProfile {
  const check = validateCalibration(offsetDb);
  if (!check.ok) throw new Error(check.reason);
  return {
    id: `custom-${Date.now().toString(36)}`,
    label: label.trim() || 'Custom reference',
    offsetDb,
    isCalibrated,
  };
}

export function applyCalibration(rawDb: number, profile: CalibrationProfile): number {
  return rawDb + profile.offsetDb;
}

export function calibrationStatusText(p: CalibrationProfile): string {
  if (!p.isCalibrated) return 'Digital dBFS — uncalibrated, not dB SPL';
  return `Calibrated estimate (${p.offsetDb >= 0 ? '+' : ''}${p.offsetDb.toFixed(1)} dB): ${p.label}`;
}

export function fingerprintConfig(c: CaptureConfig): string {
  return [c.sampleRate, c.weighting, c.deviceId || c.deviceLabel, c.channelCount,
    c.processing.echoCancellation, c.processing.noiseSuppression, c.processing.autoGainControl].join('|');
}

/**
 * Never silently apply a profile to an incompatible configuration.
 * Any mismatch invalidates the profile for the current setup.
 */
export function checkProfileCompatibility(
  profile: CalibrationProfileFull,
  current: CaptureConfig,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (profile.config.sampleRate !== current.sampleRate) {
    reasons.push(`Sample rate changed (${profile.config.sampleRate} Hz → ${current.sampleRate} Hz).`);
  }
  const oldId = profile.config.deviceId || profile.config.deviceLabel;
  const newId = current.deviceId || current.deviceLabel;
  if (oldId !== newId) reasons.push('Microphone device changed.');
  if (profile.config.weighting !== current.weighting) {
    reasons.push(`Frequency weighting changed (${profile.config.weighting} → ${current.weighting}).`);
  }
  if (profile.config.channelCount !== current.channelCount) reasons.push('Input channel count changed.');
  for (const k of ['echoCancellation', 'noiseSuppression', 'autoGainControl'] as const) {
    if (profile.config.processing[k] !== current.processing[k]) {
      reasons.push(`Browser processing changed (${k}: ${profile.config.processing[k]} → ${current.processing[k]}).`);
    }
  }
  if (profile.appVersion !== APP_VERSION) {
    reasons.push(`App version changed (${profile.appVersion} → ${APP_VERSION}); revalidate the offset.`);
  }
  return { ok: reasons.length === 0, reasons };
}

export const APP_VERSION = '1.0.0';

// ---- persistence (profiles + active id, versioned, validated) ----

interface ProfileStore {
  schema: number;
  profiles: CalibrationProfileFull[];
}

function ambientStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* unavailable */ }
  return undefined;
}

function readStore(storage: Pick<Storage, 'getItem'> | undefined): ProfileStore {
  try {
    const raw = storage?.getItem(PROFILE_KEY);
    if (!raw) return { schema: CALIBRATION_SCHEMA, profiles: [] };
    const parsed = JSON.parse(raw) as Partial<ProfileStore>;
    if (parsed.schema !== CALIBRATION_SCHEMA || !Array.isArray(parsed.profiles)) {
      return { schema: CALIBRATION_SCHEMA, profiles: [] };
    }
    const profiles = parsed.profiles.filter(isValidProfile);
    return { schema: CALIBRATION_SCHEMA, profiles };
  } catch {
    return { schema: CALIBRATION_SCHEMA, profiles: [] };
  }
}

function isValidProfile(p: unknown): p is CalibrationProfileFull {
  if (typeof p !== 'object' || p == null) return false;
  const o = p as Record<string, unknown>;
  // LocalStorage is user-controlled: re-validate the offset range, label
  // length and reference bounds so a hand-edited store cannot smuggle a
  // fantasy offset into the measurement path.
  if (typeof o.id !== 'string' || o.id.length === 0 || o.id.length > 64) return false;
  if (typeof o.label !== 'string' || o.label.length > 80) return false;
  if (typeof o.offsetDb !== 'number' || !Number.isFinite(o.offsetDb)) return false;
  if (Math.abs(o.offsetDb) > 120) return false;
  if (typeof o.referenceReadingDb !== 'number' || o.referenceReadingDb < -20 || o.referenceReadingDb > 160) return false;
  if (typeof o.measuredDigitalLeqDb !== 'number' || !Number.isFinite(o.measuredDigitalLeqDb)) return false;
  if (typeof o.config !== 'object' || o.config == null) return false;
  if (typeof (o.config as Record<string, unknown>).sampleRate !== 'number') return false;
  // Verification is optional (older profiles predate it). When present it
  // must be a well-formed record; a malformed block invalidates the profile
  // rather than silently dropping the check.
  if (o.verification !== undefined) {
    const v = o.verification as Record<string, unknown>;
    if (typeof v !== 'object' || v == null) return false;
    for (const k of ['verificationReferenceDb', 'verificationBrowserDigitalDb', 'verificationBrowserEstimateDb', 'residualDb', 'appliedOffsetDb'] as const) {
      if (typeof v[k] !== 'number' || !Number.isFinite(v[k] as number) || Math.abs(v[k] as number) > 200) return false;
    }
    if (v.outcome !== 'consistent' && v.outcome !== 'caution' && v.outcome !== 'inconsistent') return false;
    if (typeof v.verificationDateIso !== 'string' || Number.isNaN(Date.parse(v.verificationDateIso as string))) return false;
  }
  return true;
}

export function loadProfiles(storage: Pick<Storage, 'getItem'> | undefined = ambientStorage()): CalibrationProfileFull[] {
  return readStore(storage).profiles;
}

export function storeProfile(
  profile: CalibrationProfileFull,
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = ambientStorage(),
): void {
  if (!storage) throw new Error('storage unavailable');
  const store = readStore(storage);
  const rest = store.profiles.filter((p) => p.id !== profile.id);
  storage.setItem(PROFILE_KEY, JSON.stringify({ schema: CALIBRATION_SCHEMA, profiles: [profile, ...rest].slice(0, 10) }));
}

export function deleteProfile(id: string, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined = ambientStorage()): CalibrationProfileFull[] {
  const store = readStore(storage);
  const profiles = store.profiles.filter((p) => p.id !== id);
  try {
    storage?.setItem(PROFILE_KEY, JSON.stringify({ schema: CALIBRATION_SCHEMA, profiles }));
  } catch { /* storage errors surface at save time */ }
  if (getActiveProfileId(storage) === id) clearActiveProfileId(storage);
  return profiles;
}

export function getActiveProfileId(storage: Pick<Storage, 'getItem'> | undefined = ambientStorage()): string | null {
  try {
    return storage?.getItem(ACTIVE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function setActiveProfileId(id: string, storage: Pick<Storage, 'setItem'> | undefined = ambientStorage()): void {
  if (!storage) throw new Error('storage unavailable');
  storage.setItem(ACTIVE_KEY, id);
}

export function clearActiveProfileId(storage: Pick<Storage, 'removeItem'> | undefined = ambientStorage()): void {
  try {
    storage?.removeItem(ACTIVE_KEY);
  } catch { /* noop */ }
}
