import { digitalToInputStrength, formatDb, formatDuration } from './dsp.js';
import type { EngineSnapshot, MeasurementState } from './types.js';

/**
 * Authoritative two-mode public presentation model.
 * - "input-strength": no compatible calibration — percentages only, never dB/SPL.
 * - "calibrated-spl": compatible profile active — estimated dBA/dBC/dBZ.
 * Determined centrally here; components must not guess the mode themselves.
 */
export type PublicMeasurementMode =
  | 'input-strength'
  | 'calibrated-spl';

export const DIGITAL_FLOOR_DBFS = -100;

export function publicMeasurementMode(
  s: Pick<EngineSnapshot, 'calibrationValid' | 'result'>,
): PublicMeasurementMode {
  return s.calibrationValid && s.result.kind === 'calibrated'
    ? 'calibrated-spl'
    : 'input-strength';
}

export type PublicGauge = {
  calibrated: boolean;
  value: number | null;
  unit: '%' | 'dBA' | 'dBC' | 'dBZ';
  lo: number;
  hi: number;
  label: string;
  status: string;
};

export type PublicStat = { label: string; value: string };

export function digitalDiagnostics(s: EngineSnapshot): PublicStat[] {
  const dbfs = (value: number | null) => value == null ? '--' : `${formatDb(value)} dBFS`;
  return [
    { label: 'Current', value: dbfs(s.stats.current) },
    { label: 'Minimum', value: dbfs(s.stats.min) },
    { label: 'Digital energy average', value: dbfs(s.stats.leq) },
    { label: 'Maximum', value: dbfs(s.stats.max) },
    { label: 'Digital peak', value: dbfs(Number.isFinite(s.stats.peakDb) ? s.stats.peakDb : null) },
  ];
}

export function publicGauge(s: EngineSnapshot): PublicGauge {
  if (s.calibrationValid && s.result.kind === 'calibrated') {
    return {
      calibrated: true,
      value: s.result.spl,
      unit: s.result.unit,
      lo: 20,
      hi: 120,
      label: 'Current estimated sound level',
      status: 'Calibrated estimate',
    };
  }
  return {
    calibrated: false,
    value: s.inputStrengthPct,
    unit: '%',
    lo: 0,
    hi: 100,
    label: 'Microphone Input Strength',
    status: 'Calibration required for environmental dB',
  };
}

export function publicStats(s: EngineSnapshot): PublicStat[] {
  if (s.calibrationValid && s.result.kind === 'calibrated') {
    const unit = s.result.unit;
    const level = (value: number | null) => value == null ? '--' : `${formatDb(value)} ${unit}`;
    return [
      { label: 'Current sound level', value: level(s.display.current) },
      { label: 'Minimum', value: level(s.display.min) },
      { label: 'Energy average', value: level(s.display.leq) },
      { label: 'Maximum', value: level(s.display.max) },
      { label: 'Duration', value: formatDuration(s.stats.durationSec) },
    ];
  }
  const strength = (value: number | null) => {
    const pct = digitalToInputStrength(value);
    return pct == null ? '--' : `${pct.toFixed(0)}%`;
  };
  return [
    { label: 'Current Strength', value: strength(s.stats.current) },
    { label: 'Average Strength', value: strength(s.stats.leq) },
    { label: 'Peak Strength', value: strength(Number.isFinite(s.stats.peakDb) ? s.stats.peakDb : null) },
    { label: 'Duration', value: formatDuration(s.stats.durationSec) },
  ];
}

export function publicGraph(
  rawSeries: (number | null)[],
  s: Pick<EngineSnapshot, 'calibrationValid' | 'result'>,
): { series: (number | null)[]; lo: number; hi: number; label: string; unit: '%' | 'dBA' | 'dBC' | 'dBZ' } {
  if (s.calibrationValid && s.result.kind === 'calibrated') {
    const result = s.result;
    return {
      series: rawSeries.map((value) => value == null ? null : value + result.offsetDb),
      lo: 20,
      hi: 120,
      label: `Estimated sound level (${result.unit})`,
      unit: result.unit,
    };
  }
  return {
    series: rawSeries.map(digitalToInputStrength),
    lo: 0,
    hi: 100,
    label: 'Input strength (%)',
    unit: '%',
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
