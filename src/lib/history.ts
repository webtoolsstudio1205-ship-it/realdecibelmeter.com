import type { ExportSession } from './export-format.js';
import { isStoredPayloadSizeOk } from './security.js';

/**
 * Local session history: numeric summaries + settings + optional user labels.
 * NEVER stores raw audio. Bounded, versioned, validated on load.
 */

export interface SavedSession {
  id: string;
  label: string;
  savedAtIso: string;
  session: ExportSession;
}

export const HISTORY_SCHEMA = 2;
const KEY = 'rdm.session-history.v2';
const LEGACY_KEY = 'rdm.session-history.v1';
const MAX = 20;

interface HistoryStore {
  schema: number;
  entries: SavedSession[];
}

function isValidEntry(e: unknown): e is SavedSession {
  if (typeof e !== 'object' || e == null) return false;
  const o = e as Record<string, unknown>;
  const s = o.session as Record<string, unknown> | undefined;
  // Labels are written truncated to 80 chars; reject tampered oversized ones.
  // Numeric session fields are range-checked so a hand-edited store cannot
  // inject absurd values into the history UI.
  if (typeof o.id !== 'string' || o.id.length > 64) return false;
  if (typeof o.label !== 'string' || o.label.length > 100) return false;
  if (typeof o.savedAtIso !== 'string' || Number.isNaN(Date.parse(o.savedAtIso))) return false;
  if (typeof s !== 'object' || s == null) return false;
  if (typeof s.startedAtIso !== 'string' || typeof s.unit !== 'string') return false;
  if (typeof s.weighting !== 'string' || typeof s.sampleRate !== 'number') return false;
  for (const k of ['currentDb', 'minDb', 'leqDb', 'maxDb', 'peakDb'] as const) {
    const v = s[k];
    if (v != null && (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 200)) return false;
  }
  for (const k of ['recordedSec', 'activeSec', 'gapMs'] as const) {
    const v = s[k];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 864000) return false;
  }
  return true;
}

function ambientStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* unavailable */ }
  return undefined;
}

export function loadHistory(storage: Pick<Storage, 'getItem'> | undefined = ambientStorage()): {
  entries: SavedSession[];
  storageOk: boolean;
} {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return { entries: [], storageOk: true };
    // Reject absurdly large payloads before parsing (tampered store / DoS).
    if (!isStoredPayloadSizeOk(raw)) return { entries: [], storageOk: true };
    const parsed = JSON.parse(raw) as Partial<HistoryStore>;
    if (parsed.schema !== HISTORY_SCHEMA || !Array.isArray(parsed.entries)) {
      return { entries: [], storageOk: true }; // old/foreign schema: start clean, loudly
    }
    return { entries: parsed.entries.filter(isValidEntry).slice(0, MAX), storageOk: true };
  } catch {
    return { entries: [], storageOk: false };
  }
}

function writeEntries(entries: SavedSession[], storage: Pick<Storage, 'setItem'>): void {
  storage.setItem(KEY, JSON.stringify({ schema: HISTORY_SCHEMA, entries: entries.slice(0, MAX) }));
}

/** Explicit user-triggered save. Returns quota/full failures instead of throwing. */
export function saveSession(
  session: ExportSession,
  label: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = ambientStorage(),
): { ok: boolean; reason: string; entries: SavedSession[] } {
  const current = loadHistory(storage);
  const entry: SavedSession = {
    id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    label: label.trim().slice(0, 80),
    savedAtIso: new Date().toISOString(),
    session,
  };
  const entries = [entry, ...current.entries].slice(0, MAX);
  if (!storage) {
    return { ok: false, reason: 'Browser storage is unavailable, full, or blocked (private mode?). Free space or export files instead.', entries: current.entries };
  }
  try {
    writeEntries(entries, storage);
    return { ok: true, reason: '', entries };
  } catch {
    return { ok: false, reason: 'Browser storage is unavailable, full, or blocked (private mode?). Free space or export files instead.', entries: current.entries };
  }
}

export function deleteSession(
  id: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = ambientStorage(),
): SavedSession[] {
  const { entries } = loadHistory(storage);
  const rest = entries.filter((e) => e.id !== id);
  try {
    if (storage) writeEntries(rest, storage);
  } catch { /* keep in-memory state */ }
  return rest;
}

export function clearHistory(storage: Pick<Storage, 'removeItem'> | undefined = ambientStorage()): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(KEY);
    storage.removeItem(LEGACY_KEY);
    return true;
  } catch {
    return false;
  }
}

// ---- two-session comparison ---------------------------------------------------

export interface ComparisonResult {
  compatible: boolean;
  reasons: string[];
  deltaLeqDb: number | null;
  deltaMaxDb: number | null;
}

/**
 * Only compare sessions with compatible units, calibration, microphone,
 * sample rate, weighting, response and processing. Otherwise explain why.
 * Relative comparisons are never proof of a legal violation.
 */
export function compareSessions(a: SavedSession, b: SavedSession): ComparisonResult {
  const reasons: string[] = [];
  const A = a.session;
  const B = b.session;
  if (A.unit !== B.unit) reasons.push(`Units differ (${A.unit} vs ${B.unit}).`);
  if (A.mode !== B.mode) reasons.push(`Modes differ (${A.mode} vs ${B.mode}).`);
  if (A.weighting !== B.weighting) reasons.push(`Frequency weighting differs (${A.weighting} vs ${B.weighting}).`);
  if (A.response !== B.response) reasons.push(`Time response differs (${A.response} vs ${B.response}).`);
  if (A.sampleRate !== B.sampleRate) reasons.push(`Sample rates differ (${A.sampleRate} vs ${B.sampleRate} Hz).`);
  const devA = A.deviceId || A.deviceLabel;
  const devB = B.deviceId || B.deviceLabel;
  if (devA !== devB) reasons.push('Microphones differ.');
  if (A.calibrationStatus !== B.calibrationStatus) {
    reasons.push('Calibration status differs (one is calibrated, the other is not).');
  } else if (A.calibrationStatus === 'calibrated-estimate' && A.calibrationOffsetDb !== B.calibrationOffsetDb) {
    reasons.push('Calibration offsets differ.');
  }
  for (const k of ['echoCancellation', 'noiseSuppression', 'autoGainControl'] as const) {
    if ((A.processing[k] ?? 'unknown') !== (B.processing[k] ?? 'unknown')) {
      reasons.push(`Processing differs (${k}).`);
      break;
    }
  }
  if (reasons.length > 0) return { compatible: false, reasons, deltaLeqDb: null, deltaMaxDb: null };
  const deltaLeqDb = A.leqDb != null && B.leqDb != null ? A.leqDb - B.leqDb : null;
  const deltaMaxDb = A.maxDb != null && B.maxDb != null ? A.maxDb - B.maxDb : null;
  return { compatible: true, reasons: [], deltaLeqDb, deltaMaxDb };
}
