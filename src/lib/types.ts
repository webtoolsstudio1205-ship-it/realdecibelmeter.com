/** Shared measurement types. Presentation components must consume this state;
 * no component may compute sound levels independently. */

import type { CalibrationMode, CalibrationProfileFull, CaptureSettings, RelativeBaseline } from './calibration.js';
import type { GapRecord, SegmentSummary } from './session.js';

export type MeasurementState =
  | 'idle'
  | 'requesting-permission'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'error';

export type Weighting = 'A' | 'C' | 'Z';
export type Response = 'fast' | 'slow';

/** Display unit. Uncalibrated digital readings are NEVER labelled dB SPL. */
export type DisplayUnit = 'dBFS' | 'dB' | 'dB SPL (est.)';

export type ErrorCode =
  | 'unsupported-browser'
  | 'permission-denied'
  | 'no-microphone'
  | 'device-disconnected'
  | 'microphone-busy'
  | 'calibration-invalid'
  | 'storage-unavailable'
  | 'processing-error'
  | 'none';

export interface CalibrationProfile {
  id: string;
  label: string;
  /** dB offset added to the digital level. 0 = uncalibrated. */
  offsetDb: number;
  /** True only when the user completed a comparison against a known reference. */
  isCalibrated: boolean;
}

export interface SessionStats {
  /** Current time-weighted DIGITAL level in dBFS (null when below floor). */
  current: number | null;
  min: number | null;
  max: number | null;
  /** Session energy average in dBFS (never a mean of dB readings). */
  leq: number | null;
  durationSec: number;
  samples: number;
  /** Sampled digital peak in dBFS (-Infinity when nothing captured). */
  peakDb: number;
  gapMs: number;
  gapCount: number;
  recordedSec: number;
}

export interface EngineSnapshot {
  state: MeasurementState;
  error: ErrorCode;
  errorDetail: string;
  weighting: Weighting;
  response: Response;
  /** Measurement mode: digital dBFS, relative change, or calibrated estimate. */
  mode: CalibrationMode;
  unit: DisplayUnit;
  /** Display-transformed values (mode applied) for the panel. */
  display: {
    current: number | null;
    min: number | null;
    leq: number | null;
    max: number | null;
    peakDb: number;
  };
  calibration: CalibrationProfile;
  activeProfile: CalibrationProfileFull | null;
  baseline: RelativeBaseline | null;
  /** True when the active profile no longer matches this configuration. */
  calibrationStale: boolean;
  calibrationStaleReasons: string[];
  stats: SessionStats;
  permission: 'unknown' | 'granted' | 'denied' | 'prompt';
  deviceLabel: string;
  deviceId: string;
  sampleRate: number;
  channelCount: number;
  processing: CaptureSettings;
  relaxedConstraints: string[];
  secureContext: boolean;
  lastUpdateAt: number;
  /** Display-only spectrum in digital dBFS (Hann/4096 analyser tap). Empty when idle. */
  spectrumDb: (number | null)[];
  gaps: GapRecord[];
  gapMs: number;
  segments: SegmentSummary[];
  referenceCapture: { active: boolean; durationSec: number; elapsedSec: number } | null;
  /** LED/graph mapping range for the current mode+unit. */
  meterRange: [number, number];
  storageOk: boolean;
  appVersion: string;
}

export interface EngineEvent {
  type: 'snapshot';
  snapshot: EngineSnapshot;
}

export const INITIAL_STATS: SessionStats = {
  current: null,
  min: null,
  max: null,
  leq: null,
  durationSec: 0,
  samples: 0,
  peakDb: Number.NEGATIVE_INFINITY,
  gapMs: 0,
  gapCount: 0,
  recordedSec: 0,
};
