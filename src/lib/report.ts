/**
 * Local PDF report formatting (pure, testable, no jsPDF import here).
 *
 * The actual blob generation lives in export-format.ts and lazy-loads jsPDF
 * only on user request. This module owns:
 * - the prominent reference-only notice,
 * - sanitization of user-entered report fields (location, source, notes…),
 * - pure row/model builders so unit tests cover formatting without a DOM.
 *
 * Privacy: raw microphone audio is never included; only numeric summaries
 * and user-entered labels are rendered. CSV-injection prefixes (= + - @)
 * are neutralized the same way as CSV exports (single-quote prefix).
 */

import type { ExportSession } from './export-format.js';

export const REPORT_NOTICE =
  'Reference-only browser measurement. This report is not a certified occupational, legal, medical or regulatory measurement.';

export const REPORT_MAX_FIELD = 120;

export interface ReportUserFields {
  title: string;
  location: string;
  distance: string;
  source: string;
  position: string;
  notes: string;
  includeComparison: boolean;
}

/** Neutralize spreadsheet-formula prefixes and strip control characters. */
export function sanitizeReportField(input: string, max = REPORT_MAX_FIELD): string {
  let v = String(input ?? '');
  // Strip control characters (keep printable text + basic unicode).
  v = v.replace(/[\0-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  v = v.trim().slice(0, max);
  if (/^[=+\-@]/.test(v) && !/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(v)) v = `'${v}`;
  return v;
}

export function sanitizeReportFields(fields: Partial<ReportUserFields>): ReportUserFields {
  return {
    title: sanitizeReportField(fields.title ?? ''),
    location: sanitizeReportField(fields.location ?? ''),
    distance: sanitizeReportField(fields.distance ?? ''),
    source: sanitizeReportField(fields.source ?? ''),
    position: sanitizeReportField(fields.position ?? ''),
    notes: sanitizeReportField(fields.notes ?? '', 300),
    includeComparison: fields.includeComparison === true,
  };
}

export function emptyReportFields(): ReportUserFields {
  return { title: '', location: '', distance: '', source: '', position: '', notes: '', includeComparison: false };
}

function fmtDb(v: number | null, unit: string): string {
  return v == null || !Number.isFinite(v) ? '--' : `${v.toFixed(1)} ${unit}`;
}

function fmtDur(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}`;
}

export interface ReportRow {
  key: string;
  value: string;
}

/** Pure row builder: same engine values feed CSV, JSON and PDF. */
export function buildReportRows(s: ExportSession, fields: ReportUserFields): ReportRow[] {
  const proc = `${s.processing.echoCancellation ?? 'unknown'}/${s.processing.noiseSuppression ?? 'unknown'}/${s.processing.autoGainControl ?? 'unknown'}`;
  const finishedAt = new Date().toISOString();
  return [
    { key: 'Session title', value: fields.title || '--' },
    { key: 'Report date (local)', value: new Date().toString() },
    { key: 'Measurement start', value: s.startedAtIso },
    { key: 'Report generated', value: finishedAt },
    { key: 'Active duration', value: `${fmtDur(s.activeSec)} (${s.activeSec.toFixed(1)} s)` },
    { key: 'Recorded duration', value: `${s.recordedSec.toFixed(1)} s` },
    { key: 'Current level', value: fmtDb(s.currentDb, s.unit) },
    { key: 'Minimum', value: fmtDb(s.minDb, s.unit) },
    { key: 'Energy average (LAeq from energy)', value: fmtDb(s.leqDb, s.unit) },
    { key: 'Maximum', value: fmtDb(s.maxDb, s.unit) },
    { key: 'L10 (peak 10% level)', value: fmtDb(s.l10Db ?? null, s.unit) },
    { key: 'L50 (median level)', value: fmtDb(s.l50Db ?? null, s.unit) },
    { key: 'L90 (ambient noise floor)', value: fmtDb(s.l90Db ?? null, s.unit) },
    { key: 'Weighting / response', value: `${s.weighting} / ${s.response}` },
    {
      key: 'Reading class',
      value:
        s.calibrationStatus === 'calibrated-estimate'
          ? 'calibrated device-specific estimate'
          : 'uncalibrated browser estimate',
    },
    { key: 'Calibration state', value: `${s.calibrationStatus} · ${s.calibrationMethod}` },
    {
      key: 'Calibration offset / date',
      value:
        s.calibrationOffsetDb != null
          ? `${s.calibrationOffsetDb >= 0 ? '+' : ''}${s.calibrationOffsetDb.toFixed(2)} dB · ${s.calibrationDateIso ?? '--'}`
          : '--',
    },
    { key: 'Microphone / device', value: s.deviceLabel || 'unknown microphone' },
    { key: 'Sample rate / channels', value: `${s.sampleRate} Hz · ${s.channelCount} ch` },
    { key: 'Browser audio processing (EC/NS/AGC)', value: proc },
    { key: 'Clipping status', value: s.peakDb != null && s.peakDb >= -0.5 ? 'clipping detected in session' : 'no clipping detected' },
    { key: 'Processing gaps', value: `${s.gaps.length} gap(s), ${(s.gapMs / 1000).toFixed(1)} s total` },
    {
      key: 'Raw digital diagnostics (dBFS)',
      value: `sampled peak ${s.peakDb != null ? `${s.peakDb.toFixed(1)} dBFS` : '--'} · invalid samples ${s.invalidSamples}`,
    },
    { key: 'Location', value: fields.location || '--' },
    { key: 'Distance from source', value: fields.distance || '--' },
    { key: 'Source / activity', value: fields.source || '--' },
    { key: 'Device position / orientation', value: fields.position || '--' },
    { key: 'Environmental notes', value: fields.notes || '--' },
    { key: 'Software version', value: `v${s.softwareVersion}` },
  ];
}
