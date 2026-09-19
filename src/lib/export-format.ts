import type {
  CalibrationProfile,
  DisplayUnit,
  Response,
  Weighting,
} from './types.js';
import type { CalibrationMode } from './calibration.js';
import type { GapRecord, SegmentSummary } from './session.js';
import { formatDb } from './dsp.js';
import { APP_VERSION } from './calibration.js';
import { sanitizeExportFilename } from './security.js';

export interface ExportSession {
  startedAtIso: string;
  timezone: string;
  timezoneOffsetMin: number;
  recordedSec: number;
  activeSec: number;
  gapMs: number;
  gaps: GapRecord[];
  unit: DisplayUnit;
  mode: CalibrationMode;
  weighting: Weighting;
  response: Response;
  deviceLabel: string;
  deviceId: string;
  sampleRate: number;
  channelCount: number;
  processing: Record<string, string>;
  relaxedConstraints: string[];
  calibrationStatus: string;
  calibrationMethod: string;
  calibrationOffsetDb: number | null;
  calibrationDateIso: string | null;
  currentDb: number | null;
  minDb: number | null;
  leqDb: number | null;
  maxDb: number | null;
  peakDb: number | null;
  invalidSamples: number;
  segments: SegmentSummary[];
  softwareVersion: string;
  limitations: string;
}

export const MEASUREMENT_LIMITATIONS =
  'Browser microphone readings are not certified measurements. Uncalibrated values are digital dBFS, ' +
  'not dB SPL. Calibrated values are device-specific estimates, not IEC-compliant or regulatory readings. ' +
  'A single offset cannot correct nonlinear gain, frequency response, AGC, noise suppression or clipping.';

/** Build one metadata object; CSV, JSON and PDF all render from THE SAME values. */
export function buildExportSession(args: {
  stats: { current: number | null; min: number | null; leq: number | null; max: number | null; peakDb: number; gapMs: number; recordedSec: number; durationSec: number };
  gaps: GapRecord[];
  segments: SegmentSummary[];
  unit: DisplayUnit;
  mode: CalibrationMode;
  weighting: Weighting;
  response: Response;
  deviceLabel: string;
  deviceId: string;
  sampleRate: number;
  channelCount: number;
  processing: Record<string, string>;
  relaxedConstraints: string[];
  calibration: CalibrationProfile;
  calibrationMethod: string;
  calibrationDateIso: string | null;
  startedAtIso: string;
  invalidSamples: number;
}): ExportSession {
  const started = new Date(args.startedAtIso);
  return {
    startedAtIso: args.startedAtIso,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'unknown',
    timezoneOffsetMin: Number.isFinite(started.getTime()) ? -started.getTimezoneOffset() : 0,
    recordedSec: args.stats.recordedSec,
    activeSec: args.stats.durationSec,
    gapMs: args.stats.gapMs,
    gaps: args.gaps,
    unit: args.unit,
    mode: args.mode,
    weighting: args.weighting,
    response: args.response,
    deviceLabel: args.deviceLabel,
    deviceId: args.deviceId,
    sampleRate: args.sampleRate,
    channelCount: args.channelCount,
    processing: args.processing,
    relaxedConstraints: args.relaxedConstraints,
    calibrationStatus: args.calibration.isCalibrated ? 'calibrated-estimate' : 'uncalibrated-digital',
    calibrationMethod: args.calibrationMethod,
    calibrationOffsetDb: args.calibration.isCalibrated ? args.calibration.offsetDb : null,
    calibrationDateIso: args.calibrationDateIso,
    currentDb: args.stats.current,
    minDb: args.stats.min,
    leqDb: args.stats.leq,
    maxDb: args.stats.max,
    peakDb: Number.isFinite(args.stats.peakDb) ? args.stats.peakDb : null,
    invalidSamples: args.invalidSamples,
    segments: args.segments,
    softwareVersion: APP_VERSION,
    limitations: MEASUREMENT_LIMITATIONS,
  };
}

function isNumericCell(cell: string): boolean {
  return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(cell);
}

/**
 * Escape a CSV cell AND neutralize spreadsheet formula execution:
 * TEXT cells beginning with = + - @ are single-quote prefixed. Pure numeric
 * cells are left untouched so values survive round-trips unrounded.
 */
export function csvCell(v: string): string {
  let cell = v;
  if (/^[=+\-@]/.test(cell) && !isNumericCell(cell)) cell = `'${cell}`;
  // Quote AFTER prefixing so a leading apostrophe cannot smuggle an
  // unescaped quote, comma or newline into the CSV structure.
  return /[",\n]/.test(cell) || cell.startsWith("'") ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function sessionToCsv(s: ExportSession): string {
  const F = (v: number | null) => (v == null || !Number.isFinite(v) ? '' : String(v));
  const rows: string[][] = [
    ['field', 'value'],
    ['started_at', s.startedAtIso],
    ['timezone', s.timezone],
    ['timezone_offset_min', String(s.timezoneOffsetMin)],
    ['recorded_sec', String(s.recordedSec)],
    ['active_sec', String(s.activeSec)],
    ['gap_ms', String(s.gapMs)],
    ['gap_count', String(s.gaps.length)],
    ['unit', s.unit],
    ['mode', s.mode],
    ['weighting', s.weighting],
    ['response', s.response],
    ['device_label', s.deviceLabel],
    ['sample_rate_hz', String(s.sampleRate)],
    ['channels', String(s.channelCount)],
    ['processing_echo_cancellation', s.processing.echoCancellation ?? 'unknown'],
    ['processing_noise_suppression', s.processing.noiseSuppression ?? 'unknown'],
    ['processing_auto_gain', s.processing.autoGainControl ?? 'unknown'],
    ['relaxed_constraints', s.relaxedConstraints.join('; ')],
    ['calibration_status', s.calibrationStatus],
    ['calibration_method', s.calibrationMethod],
    ['calibration_offset_db', s.calibrationOffsetDb == null ? '' : String(s.calibrationOffsetDb)],
    ['calibration_date', s.calibrationDateIso ?? ''],
    ['current_db', F(s.currentDb)],
    ['min_db', F(s.minDb)],
    ['leq_db', F(s.leqDb)],
    ['max_db', F(s.maxDb)],
    ['sampled_peak_dbfs', F(s.peakDb)],
    ['invalid_samples', String(s.invalidSamples)],
    ['segments', String(s.segments.length)],
    ['software_version', s.softwareVersion],
    ['limitations', s.limitations],
  ];
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

export function sessionToJson(s: ExportSession): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), session: s }, null, 2);
}

/** Lazy-load jsPDF only when the user requests a PDF report. Entirely local: no uploads. */
export interface PdfExtras {
  userFields?: { title: string; location: string; distance: string; source: string; position: string; notes: string; includeComparison: boolean };
  exposure?: { laeqDb: number | null; dosePct: number | null; status: string; calibrated: boolean } | null;
  comparison?: { aLabel: string; bLabel: string; deltaLeqDb: number | null; text: string } | null;
  graphSeries?: (number | null)[];
}

export async function sessionToPdfBlob(s: ExportSession, extras: PdfExtras = {}): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const { buildReportRows, REPORT_NOTICE } = await import('./report.js');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 540;
  let y = 56;
  const needPage = (h = 22) => {
    if (y + h > 780) {
      doc.addPage();
      y = 56;
    }
  };
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Real Decibel Meter — session report', 40, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Exported ${new Date().toISOString()} · software v${s.softwareVersion}`, 40, y);
  y += 10;
  // Prominent reference-only notice (required on every report).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(160, 30, 30);
  needPage(28);
  doc.text(doc.splitTextToSize(REPORT_NOTICE, W), 40, y);
  y += 28;
  doc.setTextColor(20);
  const F = (v: number | null, suffix = '') =>
    v == null || !Number.isFinite(v) ? '--' : `${v.toFixed(2)}${suffix}`;
  const baseRows: [string, string][] = [
    ['Session start', `${s.startedAtIso} (${s.timezone}, UTC${s.timezoneOffsetMin >= 0 ? '+' : ''}${s.timezoneOffsetMin / 60})`],
    ['Recorded / active', `${s.recordedSec.toFixed(1)} s recorded · ${s.activeSec.toFixed(1)} s active`],
    ['Capture gaps', `${s.gapMs} ms across ${s.gaps.length} gap(s) (${(s.gapMs / 1000).toFixed(1)} s total)`],
    ['Unit / mode', `${s.unit} · ${s.mode}`],
    ['Weighting / response', `${s.weighting} · ${s.response}`],
    ['Microphone', `${s.deviceLabel || 'unknown'} · ${s.sampleRate} Hz · ${s.channelCount} ch`],
    ['Processing (EC/NS/AGC)', `${s.processing.echoCancellation}/${s.processing.noiseSuppression}/${s.processing.autoGainControl}`],
    ['Relaxed constraints', s.relaxedConstraints.length ? s.relaxedConstraints.join('; ') : '--'],
    ['Calibration', `${s.calibrationStatus} · ${s.calibrationMethod}${s.calibrationOffsetDb != null ? ` · offset ${s.calibrationOffsetDb.toFixed(2)} dB` : ''}${s.calibrationDateIso ? ` · ${s.calibrationDateIso}` : ''}`],
    ['Current', F(s.currentDb, ` ${s.unit}`)],
    ['Minimum', F(s.minDb, ` ${s.unit}`)],
    ['Energy average (Leq)', F(s.leqDb, ` ${s.unit}`)],
    ['Maximum', F(s.maxDb, ` ${s.unit}`)],
    ['Sampled digital peak', F(s.peakDb, ' dBFS')],
    ['Invalid samples', String(s.invalidSamples)],
    ['Segments', String(s.segments.length)],
  ];
  doc.setTextColor(20);
  for (const [k, v] of baseRows) {
    needPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(k, 40, y, { maxWidth: 150 });
    doc.setFont('helvetica', 'normal');
    doc.text(v, 200, y, { maxWidth: W - 160 });
    y += 20;
  }
  // User-entered context (already sanitized by the caller via report.ts).
  if (extras.userFields) {
    const uf = extras.userFields;
    y += 6;
    needPage();
    doc.setFont('helvetica', 'bold');
    doc.text('Session context', 40, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    for (const row of buildReportRows(s, {
      title: uf.title, location: uf.location, distance: uf.distance,
      source: uf.source, position: uf.position, notes: uf.notes, includeComparison: false,
    }).filter((r) => ['Session title', 'Location', 'Distance from source', 'Source / activity', 'Device position / orientation', 'Environmental notes'].includes(r.key))) {
      needPage();
      doc.setFont('helvetica', 'bold');
      doc.text(row.key, 40, y, { maxWidth: 150 });
      doc.setFont('helvetica', 'normal');
      doc.text(row.value || '--', 200, y, { maxWidth: W - 160 });
      y += 20;
    }
  }
  // Exposure estimate (A weighting only).
  if (extras.exposure) {
    y += 6;
    needPage();
    doc.setFont('helvetica', 'bold');
    doc.text('Exposure screening (A-weighted LAeq, NIOSH 3 dB)', 40, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    const e = extras.exposure;
    needPage();
    doc.text(`LAeq ${F(e.laeqDb, ' dBA')} · dose ${e.dosePct == null ? '--' : `${e.dosePct.toFixed(1)} %`} · ${e.status} · ${e.calibrated ? 'calibrated device-specific estimate' : 'screening estimate based on an uncalibrated browser reading'}`, 40, y, { maxWidth: W });
    y += 20;
  }
  // Optional comparison block.
  if (extras.comparison) {
    y += 6;
    needPage(40);
    doc.setFont('helvetica', 'bold');
    doc.text(`Comparison: ${extras.comparison.aLabel} vs ${extras.comparison.bLabel}`, 40, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(extras.comparison.text.slice(0, 1000), W), 40, y);
    y += 44;
  }
  // History graph: simple local line plot from the bounded engine series.
  const series = (extras.graphSeries || []).filter((v): v is number => v != null && Number.isFinite(v));
  if (series.length > 1) {
    y += 6;
    needPage(120);
    doc.setFont('helvetica', 'bold');
    doc.text('Level history', 40, y);
    y += 8;
    const gx = 40;
    const gw = W;
    const gh = 90;
    const lo = Math.min(...series) - 2;
    const hi = Math.max(...series) + 2;
    const span = Math.max(1, hi - lo);
    doc.setDrawColor(200);
    doc.rect(gx, y, gw, gh);
    doc.setDrawColor(59, 130, 246);
    let prevX = gx;
    let prevY = y + gh - ((series[0] - lo) / span) * gh;
    for (let i = 1; i < series.length; i++) {
      const x = gx + (i / (series.length - 1)) * gw;
      const yy = y + gh - ((series[i] - lo) / span) * gh;
      doc.line(prevX, prevY, x, yy);
      prevX = x;
      prevY = yy;
    }
    y += gh + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`${lo.toFixed(0)} – ${hi.toFixed(0)} ${s.unit} · ${series.length} points (local render, no uploads)`, 40, y);
    doc.setTextColor(20);
    doc.setFontSize(10);
    y += 16;
  }
  y += 8;
  needPage(30);
  doc.setFont('helvetica', 'bold');
  doc.text('Limitations', 40, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90);
  doc.text(doc.splitTextToSize(s.limitations, W), 40, y);
  return doc.output('blob');
}

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  downloadBlob(filename, blob);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const safe = sanitizeExportFilename(filename);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safe;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Back-compat for existing call sites (digital-mode panel exports).
export interface ExportMeta {
  weighting: Weighting;
  response: Response;
  calibration: CalibrationProfile;
  deviceLabel: string;
  startedAtIso: string;
}

export function legacyToCsv(
  stats: { current: number | null; min: number | null; leq: number | null; max: number | null },
  meta: ExportMeta,
): string {
  return sessionToCsv(
    buildExportSession({
      stats: { ...stats, peakDb: Number.NEGATIVE_INFINITY, gapMs: 0, recordedSec: 0, durationSec: 0 },
      gaps: [],
      segments: [],
      unit: meta.calibration.isCalibrated ? 'dBA' : 'dBFS',
      mode: meta.calibration.isCalibrated ? 'calibrated' : 'digital',
      weighting: meta.weighting,
      response: meta.response,
      deviceLabel: meta.deviceLabel,
      deviceId: '',
      sampleRate: 0,
      channelCount: 1,
      processing: {},
      relaxedConstraints: [],
      calibration: meta.calibration,
      calibrationMethod: meta.calibration.isCalibrated ? 'stored-profile' : 'none',
      calibrationDateIso: null,
      startedAtIso: meta.startedAtIso,
      invalidSamples: 0,
    }),
  );
}

// Keep old names working for the current panel until it is rewired.
export { legacyToCsv as sessionToCsvLegacy };
