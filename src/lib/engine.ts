import type {
  CalibrationProfileFull,
  CalibrationMode,
  CaptureConfig,
  CaptureSettings,
  RelativeBaseline,
} from './calibration.js';
import {
  APP_VERSION,
  UNCALIBRATED,
  checkProfileCompatibility,
  clearActiveProfileId,
  computeOffset,
  deleteProfile,
  getActiveProfileId,
  loadProfiles,
  setActiveProfileId,
  storeProfile,
  validateCalibration,
  validateReferenceInput,
  type ReferenceInput,
} from './calibration.js';
import type {
  CalibrationProfile,
  DisplayUnit,
  EngineSnapshot,
  ErrorCode,
  MeasurementResult,
  MeasurementState,
  Response,
  Weighting,
} from './types.js';
import { INITIAL_STATS } from './types.js';
import { SessionAccumulator } from './session.js';
import { GraphData } from './graph.js';
import { describeError, errorFromDomException } from './errors.js';
import { MicCapture, type CaptureController, type QuantumMessage } from './microphone.js';
import { designWeightingSos, digitalToInputStrength, EnergyAverager, tauFor } from './dsp.js';

export type { MeasurementState, ErrorCode };
export { APP_VERSION };

export interface EngineOptions {
  createCapture?: () => CaptureController;
  now?: () => number;
  /** Max UI emit rate; DSP quanta are never dropped, only listener emits throttle. */
  uiThrottleMs?: number;
}

const QUANTUM_FRAMES = 128;
const DEFAULT_PROCESSING: CaptureSettings = {
  echoCancellation: 'unknown',
  noiseSuppression: 'unknown',
  autoGainControl: 'unknown',
};

function meterRangeFor(mode: CalibrationMode): [number, number] {
  if (mode === 'relative') return [-30, 30];
  // Calibrated environmental estimates use the 20–120 visual scale.
  // Digital dBFS uses −100…0 (visual mapping only — never clamp stored values).
  if (mode === 'calibrated') return [20, 120];
  return [-100, 0];
}

/** Weighting-carrying environmental unit for calibrated estimates. */
export function splUnitFor(weighting: Weighting): 'dBA' | 'dBC' | 'dBZ' {
  if (weighting === 'C') return 'dBC';
  if (weighting === 'Z') return 'dBZ';
  return 'dBA';
}

/**
 * DecibelEngine: single typed state machine for the whole UI.
 * States: idle → requesting-permission → running ⇄ paused → stopped → error.
 *
 * Measurement integrity rules enforced here:
 * - Uncalibrated readings are DIGITAL dBFS, never "dB SPL".
 * - Session energy comes only from processed, unpaused PCM quanta.
 * - Time weighting smooths ENERGY, never dB numbers.
 * - Calibration/weighting changes mid-run segment the session.
 * - A profile is never applied to an incompatible configuration.
 */
export class DecibelEngine {
  private listeners = new Set<(s: EngineSnapshot) => void>();
  private readonly nowFn: () => number;
  private readonly uiThrottleMs: number;
  private readonly createCapture: () => CaptureController;
  private readonly customCapture: boolean;

  private state: MeasurementState = 'idle';
  private error: ErrorCode = 'none';
  private errorDetail = '';
  private weighting: Weighting = 'A';
  private response: Response = 'fast';
  private mode: CalibrationMode = 'digital';
  private baseline: RelativeBaseline | null = null;
  private profiles: CalibrationProfileFull[] = [];
  private activeProfile: CalibrationProfileFull | null = null;
  private staleReasons: string[] = [];
  private permission: EngineSnapshot['permission'] = 'unknown';
  private deviceId = '';
  private deviceLabel = '';
  private sampleRate = 0;
  private channelCount = 1;
  private processing: CaptureSettings = { ...DEFAULT_PROCESSING };
  private relaxed: string[] = [];
  private storageOk = true;
  private startedAtIso = '';
  private startedAtMs = 0;
  private lastQuantumAt = 0;
  private lastSeq: number | null = null;
  private gapOpenSince: number | null = null;
  private invalidSamples = 0;
  private spectrumDb: (number | null)[] = [];
  private refCapture: { durationSec: number; beganAt: number; energySum: number; samples: number } | null = null;
  private refMeasuredLeq: number | null = null;
  private lastEmitAt = 0;

  private capture: CaptureController | null = null;
  private averager: EnergyAverager | null = null;
  private session = new SessionAccumulator();
  readonly graph = new GraphData(240);
  private visibilityHandler: (() => void) | null = null;
  private pagehideHandler: (() => void) | null = null;

  constructor(opts: EngineOptions = {}) {
    this.nowFn = opts.now ?? (() => Date.now());
    this.uiThrottleMs = opts.uiThrottleMs ?? 120;
    this.customCapture = opts.createCapture != null;
    this.createCapture = opts.createCapture ?? (() => new MicCapture());
    try {
      this.profiles = loadProfiles();
      const activeId = getActiveProfileId();
      this.activeProfile = this.profiles.find((p) => p.id === activeId) ?? null;
    } catch {
      this.storageOk = false;
      this.profiles = [];
    }
  }

  // -- subscription ---------------------------------------------------------

  subscribe(fn: (s: EngineSnapshot) => void): () => void {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(force = false): void {
    const now = this.nowFn();
    if (!force && now - this.lastEmitAt < this.uiThrottleMs) return;
    this.lastEmitAt = now;
    const s = this.snapshot();
    this.listeners.forEach((fn) => {
      try {
        fn(s);
      } catch {
        /* listener failure must not break engine */
      }
    });
  }

  // -- snapshot --------------------------------------------------------------

  private currentConfig(): CaptureConfig {
    return {
      sampleRate: this.sampleRate,
      weighting: this.weighting,
      deviceId: this.deviceId,
      deviceLabel: this.deviceLabel,
      channelCount: this.channelCount,
      processing: { ...this.processing },
      relaxed: [...this.relaxed],
    };
  }

  private unit(): DisplayUnit {
    if (this.mode === 'calibrated') return splUnitFor(this.weighting);
    if (this.mode === 'relative') return 'dB';
    return 'dBFS';
  }

  /** True only with an active profile compatible with the live configuration. */
  private calibrationCompatible(): boolean {
    if (!this.activeProfile || this.sampleRate <= 0) return false;
    return checkProfileCompatibility(this.activeProfile, this.currentConfig()).ok;
  }

  /**
   * Strict typed result. Environmental SPL exists ONLY as
   * rawDbfs + profile.offset with a compatible profile — otherwise the
   * `uncalibrated` variant carries no numeric dB so the UI cannot render
   * raw dBFS as an environmental level. No Math.abs, no clamping of the
   * stored value, no arbitrary offsets anywhere in this path.
   */
  private buildResult(rawCurrent: number | null): MeasurementResult {
    if (this.mode === 'digital') {
      return { kind: 'digital', valueDbfs: rawCurrent, unit: 'dBFS' };
    }
    if (this.mode === 'relative') {
      const delta = this.baseline != null && rawCurrent != null && Number.isFinite(rawCurrent)
        ? rawCurrent - this.baseline.energyDb
        : null;
      return { kind: 'relative', deltaDb: delta, unit: 'dB' };
    }
    // calibrated mode
    if (this.activeProfile && this.calibrationCompatible()) {
      const spl = rawCurrent != null && Number.isFinite(rawCurrent)
        ? rawCurrent + this.activeProfile.offsetDb
        : null;
      return {
        kind: 'calibrated',
        spl,
        unit: splUnitFor(this.weighting),
        profileId: this.activeProfile.id,
        offsetDb: this.activeProfile.offsetDb,
      };
    }
    return { kind: 'uncalibrated', reason: 'calibration-required', unit: splUnitFor(this.weighting) };
  }

  private toDisplay(v: number | null): number | null {
    if (v == null || !Number.isFinite(v)) return null;
    if (this.mode === 'relative' && this.baseline) return v - this.baseline.energyDb;
    if (this.mode === 'calibrated' && this.activeProfile) return v + this.activeProfile.offsetDb;
    if (this.mode === 'digital') return v;
    return null;
  }

  private refreshStale(): void {
    this.staleReasons = [];
    if (this.mode === 'calibrated' && this.activeProfile && this.sampleRate > 0) {
      const c = checkProfileCompatibility(this.activeProfile, this.currentConfig());
      this.staleReasons = c.reasons;
      if (!c.ok) {
        // Never silently measure "calibrated" on an incompatible setup.
        this.mode = 'digital';
        this.session.reconfigure(
          { weighting: this.weighting, calibrationId: null, sampleRate: this.sampleRate },
          this.nowFn(),
        );
      }
    }
    if (this.mode === 'relative' && this.baseline) {
      if (this.baseline.weighting !== this.weighting || this.baseline.sampleRate !== this.sampleRate) {
        this.baseline = null;
        this.mode = 'digital';
      }
    }
  }

  snapshot(): EngineSnapshot {
    const s = this.session.snapshot(this.nowFn());
    const cal: CalibrationProfile =
      this.mode === 'calibrated' && this.activeProfile
        ? { id: this.activeProfile.id, label: this.activeProfile.label, offsetDb: this.activeProfile.offsetDb, isCalibrated: true }
        : { ...UNCALIBRATED };
    const disp = (v: number | null) => this.toDisplay(v);
    const peakDisp =
      this.mode === 'calibrated' && this.activeProfile && Number.isFinite(s.peakDb)
        ? s.peakDb + this.activeProfile.offsetDb
        : this.mode === 'relative' && this.baseline && Number.isFinite(s.peakDb)
          ? s.peakDb - this.baseline.energyDb
          : s.peakDb;
    return {
      state: this.state,
      error: this.state === 'error' ? this.error : 'none',
      errorDetail: this.state === 'error' ? describeError(this.error, this.errorDetail).message : '',
      weighting: this.weighting,
      response: this.response,
      mode: this.mode,
      unit: this.unit(),
      result: this.buildResult(s.current),
      inputStrengthPct: digitalToInputStrength(s.current),
      calibrationValid: this.mode === 'calibrated' && this.calibrationCompatible(),
      display: { current: disp(s.current), min: disp(s.min), leq: disp(s.leq), max: disp(s.max), peakDb: peakDisp },
      calibration: cal,
      activeProfile: this.activeProfile ? { ...this.activeProfile } : null,
      baseline: this.baseline ? { ...this.baseline } : null,
      calibrationStale: this.staleReasons.length > 0,
      calibrationStaleReasons: [...this.staleReasons],
      stats: { ...s },
      permission: this.permission,
      deviceLabel: this.deviceLabel,
      deviceId: this.deviceId,
      sampleRate: this.sampleRate,
      channelCount: this.channelCount,
      processing: { ...this.processing },
      relaxedConstraints: [...this.relaxed],
      secureContext: typeof window === 'undefined' ? true : window.isSecureContext !== false,
      lastUpdateAt: this.lastQuantumAt,
      spectrumDb: [...this.spectrumDb],
      gaps: [...s.gaps],
      gapMs: s.gapMs,
      segments: [...s.segments],
      referenceCapture: this.refCapture
        ? {
            active: true,
            durationSec: this.refCapture.durationSec,
            elapsedSec: Math.min(this.refCapture.durationSec, (this.nowFn() - this.refCapture.beganAt) / 1000),
          }
        : null,
      meterRange: meterRangeFor(this.mode),
      storageOk: this.storageOk,
      appVersion: APP_VERSION,
    };
  }

  // -- controls ---------------------------------------------------------------

  setWeighting(w: Weighting): void {
    if (w === this.weighting) return;
    this.weighting = w;
    if (this.capture?.active) {
      const design = designWeightingSos(w, this.sampleRate);
      this.capture.setWeighting(design.sos as number[][], design.gain);
    }
    if (this.state === 'running' || this.state === 'paused') {
      this.session.reconfigure(
        { weighting: w, calibrationId: this.activeProfile?.id ?? null, sampleRate: this.sampleRate },
        this.nowFn(),
      );
    }
    this.refreshStale();
    this.emit(true);
  }

  setResponse(r: Response): void {
    this.response = r;
    if (this.sampleRate > 0) {
      this.averager = new EnergyAverager(tauFor(r), this.sampleRate);
    }
    this.emit(true);
  }

  setDevice(deviceId: string, label = ''): void {
    this.deviceId = deviceId;
    if (label) this.deviceLabel = label;
    this.emit(true);
  }

  /** Switch measurement mode. Relative needs a baseline; calibrated needs a compatible profile. */
  setMode(mode: CalibrationMode): { ok: boolean; reason: string } {
    if (mode === 'relative' && !this.baseline) {
      return { ok: false, reason: 'Capture a baseline first — relative mode shows only the change from that baseline.' };
    }
    if (mode === 'calibrated') {
      if (!this.activeProfile) return { ok: false, reason: 'No calibration profile is active. Complete the reference workflow first.' };
      const c = this.sampleRate > 0
        ? checkProfileCompatibility(this.activeProfile, this.currentConfig())
        : { ok: true, reasons: [] as string[] };
      if (!c.ok) return { ok: false, reason: `Active profile is incompatible: ${c.reasons.join(' ')}` };
    }
    this.mode = mode;
    this.graph.clear();
    this.emit(true);
    return { ok: true, reason: '' };
  }

  setBaseline(): { ok: boolean; reason: string } {
    const s = this.session.snapshot(this.nowFn());
    if (this.state !== 'running' || s.leq == null || !Number.isFinite(s.leq)) {
      return { ok: false, reason: 'Start measuring and wait for a valid digital level before capturing a baseline.' };
    }
    this.baseline = {
      energyDb: s.leq,
      capturedAtIso: new Date(this.nowFn()).toISOString(),
      weighting: this.weighting,
      sampleRate: this.sampleRate,
      deviceLabel: this.deviceLabel,
    };
    this.emit(true);
    return { ok: true, reason: '' };
  }

  clearBaseline(): void {
    this.baseline = null;
    if (this.mode === 'relative') this.mode = 'digital';
    this.emit(true);
  }

  // -- calibration workflow ----------------------------------------------------

  startReferenceCapture(durationSec: 30 | 60): { ok: boolean; reason: string } {
    if (this.state !== 'running') return { ok: false, reason: 'Start measuring before capturing a reference period.' };
    if (durationSec !== 30 && durationSec !== 60) return { ok: false, reason: 'Reference capture must last 30 or 60 seconds.' };
    this.refCapture = { durationSec, beganAt: this.nowFn(), energySum: 0, samples: 0 };
    this.refMeasuredLeq = null;
    this.emit(true);
    return { ok: true, reason: '' };
  }

  cancelReferenceCapture(): void {
    this.refCapture = null;
    this.emit(true);
  }

  getReferenceMeasuredLeq(): number | null {
    return this.refMeasuredLeq;
  }

  applyReferenceCalibration(inp: ReferenceInput, label: string): { ok: boolean; reasons: string[] } {
    const full: ReferenceInput = {
      ...inp,
      measuredDigitalLeqDb: this.refMeasuredLeq ?? Number.NaN,
      durationSec: this.refCapture?.durationSec ?? inp.durationSec,
    };
    const v = validateReferenceInput(full);
    if (!v.ok) return { ok: false, reasons: v.reasons };
    const offset = computeOffset(full.referenceReadingDb, full.measuredDigitalLeqDb);
    const offCheck = validateCalibration(offset);
    if (!offCheck.ok) return { ok: false, reasons: [offCheck.reason] };
    const profile: CalibrationProfileFull = {
      id: `cal-${Date.now().toString(36)}`,
      label: label.trim() || 'Reference comparison',
      offsetDb: offset,
      isCalibrated: true,
      mode: 'calibrated',
      referenceReadingDb: full.referenceReadingDb,
      referenceMethod: full.method as CalibrationProfileFull['referenceMethod'],
      referenceNote: inp.note.trim(),
      calibrationDateIso: new Date(this.nowFn()).toISOString(),
      measuredDigitalLeqDb: full.measuredDigitalLeqDb,
      referenceDurationSec: full.durationSec,
      config: this.currentConfig(),
      appVersion: APP_VERSION,
    };
    try {
      storeProfile(profile);
      setActiveProfileId(profile.id);
      this.profiles = loadProfiles();
    } catch {
      // Persistence is best-effort (e.g. private mode): the profile still
      // applies to this live session in memory so measurement is unaffected.
      this.storageOk = false;
      if (!this.profiles.some((p) => p.id === profile.id)) {
        this.profiles = [profile, ...this.profiles].slice(0, 10);
      }
    }
    this.activeProfile = profile;
    this.staleReasons = [];
    this.refCapture = null;
    this.refMeasuredLeq = null;
    if (this.state === 'running' || this.state === 'paused') {
      this.session.reconfigure(
        { weighting: this.weighting, calibrationId: profile.id, sampleRate: this.sampleRate },
        this.nowFn(),
      );
    }
    this.mode = 'calibrated';
    this.graph.clear();
    this.emit(true);
    return { ok: true, reasons: [] };
  }

  applyProfile(id: string): { ok: boolean; reason: string } {
    const p = this.profiles.find((x) => x.id === id);
    if (!p) return { ok: false, reason: 'Profile not found.' };
    if (this.sampleRate > 0) {
      const c = checkProfileCompatibility(p, this.currentConfig());
      if (!c.ok) return { ok: false, reason: `Profile incompatible: ${c.reasons.join(' ')}` };
    }
    try {
      setActiveProfileId(id);
    } catch {
      this.storageOk = false;
    }
    this.activeProfile = p;
    this.staleReasons = [];
    if (this.state === 'running' || this.state === 'paused') {
      this.session.reconfigure(
        { weighting: this.weighting, calibrationId: p.id, sampleRate: this.sampleRate },
        this.nowFn(),
      );
    }
    this.mode = 'calibrated';
    this.graph.clear();
    this.emit(true);
    return { ok: true, reason: '' };
  }

  resetCalibration(): void {
    try {
      clearActiveProfileId();
    } catch { /* noop */ }
    this.activeProfile = null;
    this.staleReasons = [];
    if (this.mode === 'calibrated') this.mode = 'digital';
    if (this.state === 'running' || this.state === 'paused') {
      this.session.reconfigure(
        { weighting: this.weighting, calibrationId: null, sampleRate: this.sampleRate },
        this.nowFn(),
      );
    }
    this.graph.clear();
    this.emit(true);
  }

  deleteProfile(id: string): void {
    try {
      this.profiles = deleteProfile(id);
    } catch {
      this.storageOk = false;
    }
    if (this.activeProfile?.id === id) {
      this.activeProfile = null;
      if (this.mode === 'calibrated') this.mode = 'digital';
    }
    this.emit(true);
  }

  clearStaleWarning(): void {
    this.staleReasons = [];
    this.emit(true);
  }

  listProfiles(): CalibrationProfileFull[] {
    return this.profiles.map((p) => ({ ...p }));
  }

  // -- transport ------------------------------------------------------------------

  private fail(code: ErrorCode, detail = ''): void {
    try {
      this.capture?.dispose();
    } catch { /* noop */ }
    this.capture = null;
    this.detachLifecycle();
    this.state = 'error';
    this.error = code;
    this.errorDetail = detail;
    this.emit(true);
  }

  async start(): Promise<void> {
    if (this.state === 'requesting-permission' || this.state === 'running') return;
    if (this.state === 'paused') {
      this.resume();
      return;
    }
    if (!this.customCapture && (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia)) {
      this.fail('unsupported-browser');
      return;
    }
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      this.fail('unsupported-browser', 'Microphone capture requires a secure (HTTPS or localhost) context.');
      return;
    }
    this.state = 'requesting-permission';
    this.error = 'none';
    this.errorDetail = '';
    this.emit(true);

    const capture = this.createCapture();
    try {
      // Design for a placeholder rate; replaced by the real rate below.
      const design = designWeightingSos(this.weighting, 48000);
      const info = await capture.start(this.deviceId, design.sos as number[][], design.gain, {
        onQuantum: (q) => this.handleQuantum(q),
        onSpectrum: (bands) => {
          this.spectrumDb = [...bands];
          this.emit(false);
        },
        onEnded: (reason) => {
          if (reason === 'device-lost' && (this.state === 'running' || this.state === 'paused')) {
            this.session.markGap(0, 'device', this.nowFn());
            this.fail('device-disconnected');
          }
        },
        onDevicesChanged: () => this.emit(true),
      });
      this.capture = capture;
      this.sampleRate = info.sampleRate;
      this.channelCount = info.channelCount;
      if (info.label) this.deviceLabel = info.label;
      this.processing = { ...info.processing };
      this.relaxed = [...info.relaxed];
      // Regenerate weighting for the ACTUAL sample rate — never reuse one rate's array.
      const real = designWeightingSos(this.weighting, this.sampleRate);
      capture.setWeighting(real.sos as number[][], real.gain);
      this.averager = new EnergyAverager(tauFor(this.response), this.sampleRate);
      this.permission = 'granted';
      // Auto-apply a saved compatible profile: with a valid profile the
      // session measures estimated SPL (rawDbfs + offset); without one it
      // stays digital and the UI shows `--` + input strength (never raw
      // dBFS labelled as environmental dB).
      if (this.activeProfile) {
        const compat = checkProfileCompatibility(this.activeProfile, this.currentConfig());
        if (compat.ok) {
          this.mode = 'calibrated';
          this.staleReasons = [];
        }
      }
      this.state = 'running';
      const now = this.nowFn();
      this.startedAtMs = now;
      this.session.begin(now, {
        weighting: this.weighting,
        calibrationId: this.activeProfile?.id ?? null,
        sampleRate: this.sampleRate,
      });
      this.startedAtIso = new Date(now).toISOString();
      this.lastSeq = null;
      this.gapOpenSince = null;
      this.invalidSamples = 0;
      this.spectrumDb = [];
      this.graph.clear();
      this.refreshStale();
      this.attachLifecycle();
      this.emit(true);
    } catch (err) {
      try {
        capture.dispose();
      } catch { /* noop */ }
      if ((err as { name?: string })?.name === 'InvalidStateError') return;
      const code = errorFromDomException(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (code === 'permission-denied') this.permission = 'denied';
      if (code === 'no-microphone' && /permission|denied/i.test(msg)) {
        this.fail('permission-denied', msg);
      } else {
        this.fail(code, msg);
      }
    }
  }

  pause(): void {
    if (this.state !== 'running') return;
    void this.capture?.suspend();
    this.session.pause(this.nowFn());
    this.gapOpenSince = this.nowFn();
    this.state = 'paused';
    this.emit(true);
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.session.resume(this.nowFn());
    // The suspend interval is user-initiated pause, not a capture gap.
    this.gapOpenSince = null;
    void this.capture?.resume();
    this.state = 'running';
    this.emit(true);
  }

  stop(): void {
    if (this.state !== 'running' && this.state !== 'paused') return;
    try {
      this.capture?.dispose();
    } catch { /* noop */ }
    this.capture = null;
    this.detachLifecycle();
    this.refCapture = null;
    this.spectrumDb = [];
    this.state = 'stopped';
    this.emit(true);
  }

  reset(): void {
    try {
      this.capture?.dispose();
    } catch { /* noop */ }
    this.capture = null;
    this.detachLifecycle();
    this.session.reset();
    this.graph.clear();
    this.spectrumDb = [];
    this.refCapture = null;
    this.refMeasuredLeq = null;
    this.state = 'idle';
    this.error = 'none';
    this.errorDetail = '';
    this.emit(true);
  }

  dismissError(): void {
    if (this.state !== 'error') return;
    this.state = 'idle';
    this.error = 'none';
    this.errorDetail = '';
    this.emit(true);
  }

  /** Switch input device mid-session: full capture restart + new segment. */
  async switchDevice(deviceId: string, label = ''): Promise<void> {
    const wasActive = this.state === 'running' || this.state === 'paused';
    try {
      this.capture?.dispose();
    } catch { /* noop */ }
    this.capture = null;
    this.detachLifecycle();
    this.deviceId = deviceId;
    if (label) this.deviceLabel = label;
    if (!wasActive) {
      this.emit(true);
      return;
    }
    this.state = 'idle';
    await this.start();
  }

  // -- quantum ingest (DSP runs per quantum; UI emits are throttled) -------------

  private handleQuantum(q: QuantumMessage): void {
    if (this.state !== 'running') return;
    const now = this.nowFn();
    try {
      // Missing quanta (dropped audio blocks) become explicit gaps.
      if (this.lastSeq != null && q.seq > this.lastSeq + 1 && q.frames > 0 && this.sampleRate > 0) {
        const missingFrames = (q.seq - this.lastSeq - 1) * QUANTUM_FRAMES;
        this.session.markGap((missingFrames / this.sampleRate) * 1000, 'missing-quanta', now);
      }
      this.lastSeq = q.seq;
      // Close any suspension gap once audio flows again.
      if (this.gapOpenSince != null) {
        this.session.markGap(now - this.gapOpenSince, 'suspend', now);
        this.gapOpenSince = null;
      }
      this.invalidSamples += (q.nan ?? 0) + (q.inf ?? 0);
      if (!(q.n > 0) || !Number.isFinite(q.sumSq) || q.sumSq < 0) {
        this.session.markGap(0, 'missing-quanta', now);
        return;
      }
      const meanSq = q.sumSq / q.n;
      const smoothed = this.averager ? this.averager.push(meanSq, q.n) : meanSq;
      const weightedDb = smoothed > 0 ? 10 * Math.log10(smoothed) : null;
      this.session.ingest({ sumSq: q.sumSq, n: q.n, peak: q.peak, weightedDb, atMs: now });
      this.lastQuantumAt = now;
      // Graph follows the DISPLAY value for the active mode.
      this.graph.push(this.toDisplay(weightedDb));
      // Reference capture accumulates raw digital energy only.
      if (this.refCapture) {
        this.refCapture.energySum += q.sumSq;
        this.refCapture.samples += q.n;
        const elapsed = (now - this.refCapture.beganAt) / 1000;
        if (elapsed >= this.refCapture.durationSec && this.refCapture.samples > 0) {
          this.refMeasuredLeq = 10 * Math.log10(this.refCapture.energySum / this.refCapture.samples);
          this.refCapture = null;
        }
      }
      this.emit(false);
    } catch (err) {
      this.fail('processing-error', err instanceof Error ? err.message : String(err));
    }
  }

  // -- page lifecycle --------------------------------------------------------------

  private attachLifecycle(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    this.detachLifecycle();
    this.visibilityHandler = () => {
      if (document.hidden && this.state === 'running') {
        this.gapOpenSince = this.nowFn();
        void this.capture?.suspend();
      } else if (!document.hidden && this.state === 'running') {
        void this.capture?.resume();
        // Gap closes on the next arriving quantum (or now if none arrives).
      }
    };
    this.pagehideHandler = () => {
      // Navigation cleanup: everything disposed so the OS mic indicator clears.
      try {
        this.capture?.dispose();
      } catch { /* noop */ }
      this.capture = null;
      this.detachLifecycle();
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('pagehide', this.pagehideHandler);
  }

  private detachLifecycle(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (this.visibilityHandler) document.removeEventListener('visibilitychange', this.visibilityHandler);
    if (this.pagehideHandler) window.removeEventListener('pagehide', this.pagehideHandler);
    this.visibilityHandler = null;
    this.pagehideHandler = null;
  }

  getStartedAtIso(): string {
    return this.startedAtIso;
  }

  getInvalidSampleCount(): number {
    return this.invalidSamples;
  }
}
