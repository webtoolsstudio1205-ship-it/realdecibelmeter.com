/**
 * NIOSH 3 dB exchange-rate noise-exposure screening model.
 *
 * Pure, dependency-free and fully unit-tested (see exposure.test.ts).
 *
 * Model (NIOSH REL):
 *   85 dBA = 8 hours allowable.
 *   Every +3 dB halves the allowable duration.
 *   Every −3 dB doubles it.
 *
 * Formula:
 *   T_allow_hours(L) = 8 × 2^((85 − L) / 3)
 *
 * Safety-sensitive rules enforced here:
 * - The ONLY valid input level is the session ENERGY average (LAeq),
 *   never the instantaneous reading or the maximum.
 * - Hearing-exposure dose is computed ONLY for A weighting. Callers must
 *   check `eligibility` first; C/Z weightings are not valid for dose.
 * - This is a SCREENING estimate, never a certified occupational reading.
 *   Language codes returned here map to careful UI copy (no "safe",
 *   "no risk" or "immediate damage" claims).
 */

export type ExposureStatus =
  | 'no-data'
  | 'low' // unlikely to cause hearing damage at this average
  | 'moderate' // below REL but deserves attention on duration/repetition
  | 'elevated' // increased hearing-risk zone
  | 'over'; // daily allowance consumed at this average

export interface ExposureInput {
  /** Session energy-average level in dBA (already offset-applied or nominal). */
  laeqDb: number | null;
  /** Active measurement duration in seconds. */
  durationSec: number;
  weighting: 'A' | 'C' | 'Z';
  calibrated: boolean;
  /** Reliability signals from the engine snapshot. */
  clipping: boolean;
  gapCount: number;
  gapMs: number;
  calibrationStale: boolean;
  unstable: boolean;
}

export interface ExposureResult {
  eligible: boolean;
  /** Machine-readable reason when ineligible: 'needs-a' | 'no-data'. */
  ineligibleReason: '' | 'needs-a' | 'no-data';
  laeqDb: number | null;
  durationSec: number;
  allowableSec: number | null;
  dosePct: number | null;
  projected8hDosePct: number | null;
  status: ExposureStatus;
  warnings: ExposureWarning[];
}

export type ExposureWarning =
  | 'clipping'
  | 'gaps'
  | 'stale-calibration'
  | 'unstable-signal';

/** Allowable duration in HOURS at energy-average level L (NIOSH REL). */
export function allowableHours(laeqDb: number): number {
  if (!Number.isFinite(laeqDb)) return Number.NaN;
  // 8 × 2^((85 − L)/3). Very quiet levels yield very long (but finite) times.
  return 8 * Math.pow(2, (85 - laeqDb) / 3);
}

/** Allowable duration in seconds (convenience for dose math). */
export function allowableSec(laeqDb: number): number {
  const h = allowableHours(laeqDb);
  return Number.isFinite(h) ? h * 3600 : Number.NaN;
}

/**
 * Consumed daily noise-dose percentage for `durationSec` at level L:
 *   dose% = 100 × duration / T_allow
 */
export function dosePercent(laeqDb: number, durationSec: number): number {
  const allow = allowableSec(laeqDb);
  if (!Number.isFinite(allow) || allow <= 0) return Number.NaN;
  if (!Number.isFinite(durationSec) || durationSec < 0) return Number.NaN;
  return (durationSec / allow) * 100;
}

/**
 * Projected 8-hour dose if the current average continued for a full 8 h:
 *   projected% = 100 × 8h / T_allow
 */
export function projected8hDosePercent(laeqDb: number): number {
  const allow = allowableSec(laeqDb);
  if (!Number.isFinite(allow) || allow <= 0) return Number.NaN;
  return ((8 * 3600) / allow) * 100;
}

export function exposureStatusFor(laeqDb: number | null, dosePct: number | null): ExposureStatus {
  if (laeqDb == null || !Number.isFinite(laeqDb) || dosePct == null || !Number.isFinite(dosePct)) {
    return 'no-data';
  }
  if (dosePct >= 100) return 'over';
  if (laeqDb >= 85) return 'elevated';
  if (laeqDb >= 70) return 'moderate';
  return 'low';
}

export function exposureWarningsFor(inp: Pick<
  ExposureInput,
  'clipping' | 'gapCount' | 'gapMs' | 'calibrationStale' | 'unstable'
>): ExposureWarning[] {
  const out: ExposureWarning[] = [];
  if (inp.clipping) out.push('clipping');
  if (inp.gapCount > 0 || inp.gapMs > 0) out.push('gaps');
  if (inp.calibrationStale) out.push('stale-calibration');
  if (inp.unstable) out.push('unstable-signal');
  return out;
}

/**
 * Main entry: compute the screening exposure estimate from the A-weighted
 * ENERGY average. Returns `eligible:false` for C/Z weighting or missing data
 * so the UI can prompt for A weighting instead of showing a dose.
 */
export function computeExposure(inp: ExposureInput): ExposureResult {
  if (inp.weighting !== 'A') {
    return {
      eligible: false,
      ineligibleReason: 'needs-a',
      laeqDb: inp.laeqDb,
      durationSec: Math.max(0, inp.durationSec),
      allowableSec: null,
      dosePct: null,
      projected8hDosePct: null,
      status: 'no-data',
      warnings: exposureWarningsFor(inp),
    };
  }
  const L = inp.laeqDb;
  if (L == null || !Number.isFinite(L)) {
    return {
      eligible: false,
      ineligibleReason: 'no-data',
      laeqDb: L,
      durationSec: Math.max(0, inp.durationSec),
      allowableSec: null,
      dosePct: null,
      projected8hDosePct: null,
      status: 'no-data',
      warnings: exposureWarningsFor(inp),
    };
  }
  const allow = allowableSec(L);
  const dose = dosePercent(L, Math.max(0, inp.durationSec));
  const proj = projected8hDosePercent(L);
  return {
    eligible: true,
    ineligibleReason: '',
    laeqDb: L,
    durationSec: Math.max(0, inp.durationSec),
    allowableSec: Number.isFinite(allow) ? allow : null,
    dosePct: Number.isFinite(dose) ? dose : null,
    projected8hDosePct: Number.isFinite(proj) ? proj : null,
    status: exposureStatusFor(L, dose),
    warnings: exposureWarningsFor(inp),
  };
}
