import { formatDb, formatDuration } from './dsp.js';
import type { EngineSnapshot, MeasurementState } from './types.js';

/**
 * Authoritative two-mode public presentation model.
 * - "estimated-spl": no compatible calibration — a clearly disclosed nominal
 *   estimate derived from digital dBFS + 100 dB.
 * - "calibrated-spl": compatible profile active — device-specific estimated
 *   dBA/dBC/dBZ.
 * Determined centrally here; components must not guess the mode themselves.
 */
export type PublicMeasurementMode =
  | 'estimated-spl'
  | 'calibrated-spl';

export const DIGITAL_FLOOR_DBFS = -100;
/**
 * Consumer browser meters commonly use a nominal +100 dB bridge from dBFS to
 * a familiar environmental scale. It makes −34.1 dBFS display as 65.9 dBA.
 * This is a convenience estimate, not a device calibration; a compatible
 * calibration profile always replaces it.
 */
export const DEFAULT_ESTIMATE_OFFSET_DB = 100;

function estimateUnit(weighting: EngineSnapshot['weighting']): 'dBA' | 'dBC' | 'dBZ' {
  if (weighting === 'C') return 'dBC';
  if (weighting === 'Z') return 'dBZ';
  return 'dBA';
}

export function nominalSoundEstimate(valueDbfs: number | null): number | null {
  return valueDbfs == null || !Number.isFinite(valueDbfs)
    ? null
    : valueDbfs + DEFAULT_ESTIMATE_OFFSET_DB;
}

export function publicMeasurementMode(
  s: Pick<EngineSnapshot, 'calibrationValid' | 'result'>,
): PublicMeasurementMode {
  return s.calibrationValid && s.result.kind === 'calibrated'
    ? 'calibrated-spl'
    : 'estimated-spl';
}

export type PublicGauge = {
  calibrated: boolean;
  value: number | null;
  unit: 'dBA' | 'dBC' | 'dBZ';
  lo: number;
  hi: number;
  label: string;
  status: string;
};

export type PublicStat = { label: string; value: string };

export interface PresentationLabels {
  current: string;
  minimum: string;
  digitalAverage: string;
  maximum: string;
  digitalPeak: string;
  currentEstimated: string;
  inputStrength: string;
  calibrationRequired: string;
  calibratedEstimate: string;
  currentSound: string;
  energyAverage: string;
  duration: string;
  currentStrength: string;
  averageStrength: string;
  peakStrength: string;
  estimatedSound: string;
  inputStrengthGraph: string;
}

const EN: PresentationLabels = {
  current: 'Current', minimum: 'Minimum', digitalAverage: 'Digital energy average', maximum: 'Maximum', digitalPeak: 'Digital peak',
  currentEstimated: 'Current estimated sound level', inputStrength: 'Microphone Input Strength', calibrationRequired: 'Estimated dBA — calibrate for better accuracy', calibratedEstimate: 'Calibrated estimate',
  currentSound: 'Current sound level', energyAverage: 'Energy average', duration: 'Duration', currentStrength: 'Current Strength', averageStrength: 'Average Strength', peakStrength: 'Peak Strength',
  estimatedSound: 'Estimated sound level', inputStrengthGraph: 'Input strength',
};

export function digitalDiagnostics(s: EngineSnapshot, labels: PresentationLabels = EN): PublicStat[] {
  const dbfs = (value: number | null) => value == null ? '--' : `${formatDb(value)} dBFS`;
  return [
    { label: labels.current, value: dbfs(s.stats.current) },
    { label: labels.minimum, value: dbfs(s.stats.min) },
    { label: labels.digitalAverage, value: dbfs(s.stats.leq) },
    { label: labels.maximum, value: dbfs(s.stats.max) },
    { label: labels.digitalPeak, value: dbfs(Number.isFinite(s.stats.peakDb) ? s.stats.peakDb : null) },
  ];
}

export function publicGauge(s: EngineSnapshot, labels: PresentationLabels = EN): PublicGauge {
  if (s.calibrationValid && s.result.kind === 'calibrated') {
    return {
      calibrated: true,
      value: s.result.spl,
      unit: s.result.unit,
      lo: 20,
      hi: 120,
      label: labels.currentEstimated,
      status: labels.calibratedEstimate,
    };
  }
  return {
    calibrated: false,
    value: nominalSoundEstimate(s.stats.current),
    unit: estimateUnit(s.weighting),
    lo: 20,
    hi: 120,
    label: labels.estimatedSound,
    status: labels.calibrationRequired,
  };
}

export function publicStats(s: EngineSnapshot, labels: PresentationLabels = EN): PublicStat[] {
  if (s.calibrationValid && s.result.kind === 'calibrated') {
    const unit = s.result.unit;
    const level = (value: number | null) => value == null ? '--' : `${formatDb(value)} ${unit}`;
    return [
      { label: labels.currentSound, value: level(s.display.current) },
      { label: labels.minimum, value: level(s.display.min) },
      { label: labels.energyAverage, value: level(s.display.leq) },
      { label: labels.maximum, value: level(s.display.max) },
      { label: labels.duration, value: formatDuration(s.stats.durationSec) },
    ];
  }
  const unit = estimateUnit(s.weighting);
  const level = (value: number | null) => {
    const estimate = nominalSoundEstimate(value);
    return estimate == null ? '--' : `${formatDb(estimate)} ${unit}`;
  };
  return [
    { label: labels.currentEstimated, value: level(s.stats.current) },
    { label: labels.minimum, value: level(s.stats.min) },
    { label: labels.energyAverage, value: level(s.stats.leq) },
    { label: labels.maximum, value: level(s.stats.max) },
    { label: labels.duration, value: formatDuration(s.stats.durationSec) },
  ];
}

export function publicGraph(
  rawSeries: (number | null)[],
  s: Pick<EngineSnapshot, 'calibrationValid' | 'result' | 'weighting'>,
  labels: PresentationLabels = EN,
): { series: (number | null)[]; lo: number; hi: number; label: string; unit: 'dBA' | 'dBC' | 'dBZ' } {
  if (s.calibrationValid && s.result.kind === 'calibrated') {
    const result = s.result;
    return {
      series: rawSeries.map((value) => value == null ? null : value + result.offsetDb),
      lo: 20,
      hi: 120,
      label: `${labels.estimatedSound} (${result.unit})`,
      unit: result.unit,
    };
  }
  const unit = estimateUnit(s.weighting);
  return {
    series: rawSeries.map(nominalSoundEstimate),
    lo: 20,
    hi: 120,
    label: `${labels.estimatedSound} (${unit})`,
    unit,
  };
}

export function transportControls(state: MeasurementState): string[] {
  switch (state) {
    case 'idle': return ['start', 'customize'];
    case 'requesting-permission': return ['requesting', 'cancel'];
    case 'stabilizing': return ['stabilizing', 'stop', 'customize'];
    case 'running': return ['pause', 'stop', 'customize'];
    case 'paused': return ['resume', 'stop', 'customize'];
    case 'stopped': return ['start-new', 'save', 'reset'];
    case 'error': return ['retry', 'dismiss', 'customize'];
  }
}
