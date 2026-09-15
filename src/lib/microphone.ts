/**
 * Microphone capture controller (AudioWorklet measurement path).
 *
 * Separation of concerns:
 *  - THIS module: getUserMedia, AudioContext/AudioWorklet lifecycle, device
 *    events, actual processing-setting inspection, display-only spectrum tap.
 *  - Worklet (`meter-processor.js`): contiguous Float32 PCM filtering + sums.
 *  - Engine: DSP math on quanta, session aggregation.
 *
 * Never connects microphone input to an audible output.
 */

import type { CaptureSettings } from './calibration.js';
import { spectrumBandsDb } from './dsp.js';
import PROCESSOR_SOURCE from './meter-processor.js?raw';

export interface QuantumMessage {
  seq: number;
  frames: number;
  sumSq: number;
  n: number;
  peak: number;
  clipped: number;
  dcSum: number;
  nan: number;
  inf: number;
  framesTotal: number;
}

export interface CaptureStartInfo {
  sampleRate: number;
  label: string;
  channelCount: number;
  processing: CaptureSettings;
  /** Human-readable list of constraints the browser could not honor. */
  relaxed: string[];
}

export interface CaptureCallbacks {
  onQuantum: (q: QuantumMessage) => void;
  /** Display-only spectrum in digital dBFS (never used for measurement). */
  onSpectrum: (bandsDb: (number | null)[], sampleRate: number) => void;
  onEnded: (reason: 'device-lost') => void;
  onDevicesChanged: () => void;
}

export interface CaptureController {
  readonly active: boolean;
  start(deviceId: string, sos: number[][], gain: number, cb: CaptureCallbacks): Promise<CaptureStartInfo>;
  setWeighting(sos: number[][], gain: number): void;
  suspend(): Promise<void>;
  resume(): Promise<void>;
  dispose(): void;
}

function tri(v: unknown): CaptureSettings[keyof CaptureSettings] {
  if (v === true) return 'enabled';
  if (v === false) return 'disabled';
  return 'unknown';
}

export class MicCapture implements CaptureController {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private displayTimer = 0;
  private blobUrl: string | null = null;
  private trackEnded: (() => void) | null = null;
  private devicesChanged: (() => void) | null = null;
  private cb: CaptureCallbacks | null = null;

  get active(): boolean {
    return this.stream != null;
  }

  get suspended(): boolean {
    return this.ctx != null && this.ctx.state === 'suspended';
  }

  async start(
    deviceId: string,
    sos: number[][],
    gain: number,
    cb: CaptureCallbacks,
  ): Promise<CaptureStartInfo> {
    if (this.stream) {
      throw Object.assign(new Error('capture already active'), { name: 'InvalidStateError' });
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw Object.assign(new Error('getUserMedia unavailable'), { name: 'TypeError' });
    }
    this.cb = cb;
    const relaxed: string[] = [];
    const stream = await this.acquire(deviceId, relaxed);
    const Ctx: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      stream.getTracks().forEach((t) => t.stop());
      throw Object.assign(new Error('Web Audio unavailable'), { name: 'TypeError' });
    }

    const track = stream.getAudioTracks()[0];
    const settings = track?.getSettings() ?? {};
    const processing: CaptureSettings = {
      echoCancellation: tri((settings as Record<string, unknown>).echoCancellation),
      noiseSuppression: tri((settings as Record<string, unknown>).noiseSuppression),
      autoGainControl: tri((settings as Record<string, unknown>).autoGainControl),
    };
    // Requesting `false` does not prove hardware processing is absent.
    if (processing.echoCancellation === 'enabled') relaxed.push('Echo cancellation could not be disabled on this device.');
    if (processing.noiseSuppression === 'enabled') relaxed.push('Noise suppression could not be disabled on this device.');
    if (processing.autoGainControl === 'enabled') relaxed.push('Automatic gain control could not be disabled on this device.');

    let ctx: AudioContext | null = null;
    try {
      ctx = new Ctx({ latencyHint: 'interactive' });
      if (!this.blobUrl) {
        const blob = new Blob([PROCESSOR_SOURCE], { type: 'application/javascript' });
        this.blobUrl = URL.createObjectURL(blob);
      }
      await ctx.audioWorklet.addModule(this.blobUrl);
      const source = ctx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(ctx, 'rdm-meter', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: { sos, gain },
      });
      worklet.port.onmessage = (e: MessageEvent) => {
        const msg = e.data as { type?: string } & QuantumMessage;
        if (msg && msg.type === 'quantum') this.cb?.onQuantum(msg as QuantumMessage);
      };
      source.connect(worklet);
      // Display-only spectrum tap (measurement never uses FFT bars).
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      // NEVER connect to ctx.destination: no audible feedback path.

      this.stream = stream;
      this.ctx = ctx;
      this.source = source;
      this.worklet = worklet;
      this.analyser = analyser;
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      void ctx?.close().catch(() => undefined);
      this.stream = null;
      this.ctx = null;
      throw err;
    }

    const handleEnded = () => this.cb?.onEnded('device-lost');
    this.trackEnded = handleEnded;
    track?.addEventListener('ended', handleEnded);
    const handleDevices = () => this.cb?.onDevicesChanged();
    this.devicesChanged = handleDevices;
    navigator.mediaDevices.addEventListener?.('devicechange', handleDevices);
    if (track && track.readyState === 'ended') {
      this.dispose();
      cb.onEnded('device-lost');
      throw Object.assign(new Error('device ended'), { name: 'AbortError' });
    }

    this.startDisplayLoop();
    // Resume only after the user gesture that led here (Start button).
    try {
      await ctx.resume();
    } catch {
      /* statechange handling reports suspension via engine polling */
    }
    const channelCount = (settings as Record<string, unknown>).channelCount === 2 ? 2 : 1;
    return { sampleRate: ctx.sampleRate, label: track?.label ?? '', channelCount, processing, relaxed };
  }

  /** Acquire with strict constraints first, relaxing only on OverconstrainedError. */
  private async acquire(deviceId: string, relaxed: string[]): Promise<MediaStream> {
    const base: Record<string, unknown> = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    };
    if (deviceId) base.deviceId = { exact: deviceId };
    const attempts: MediaStreamConstraints[] = [
      { audio: { ...base, channelCount: 1 } as MediaTrackConstraints, video: false },
      { audio: { ...base } as MediaTrackConstraints, video: false },
      { audio: deviceId ? ({ deviceId: { exact: deviceId } } as MediaTrackConstraints) : true, video: false },
    ];
    let lastErr: unknown = null;
    for (let i = 0; i < attempts.length; i++) {
      try {
        const s = await navigator.mediaDevices.getUserMedia(attempts[i]);
        if (i === 1) relaxed.push('Mono input (channelCount 1) was not available; using the device default channel layout.');
        if (i === 2) relaxed.push('Microphone processing toggles could not be requested on this browser; using device defaults.');
        return s;
      } catch (err) {
        lastErr = err;
        if ((err as { name?: string })?.name !== 'OverconstrainedError') throw err;
      }
    }
    throw lastErr;
  }

  setWeighting(sos: number[][], gain: number): void {
    try {
      this.worklet?.port.postMessage({ type: 'set-sos', sos, gain });
    } catch { /* node may be gone; engine segments on next quantum gap */ }
  }

  async suspend(): Promise<void> {
    this.stopDisplayLoop();
    try {
      await this.ctx?.suspend();
    } catch { /* noop */ }
  }

  async resume(): Promise<void> {
    try {
      await this.ctx?.resume();
    } catch { /* noop */ }
    this.startDisplayLoop();
  }

  private startDisplayLoop(): void {
    this.stopDisplayLoop();
    if (typeof window === 'undefined') return;
    const freq = new Float32Array(2048);
    this.displayTimer = window.setInterval(() => {
      const an = this.analyser;
      const rate = this.ctx?.sampleRate ?? 0;
      if (!an || rate <= 0) return;
      try {
        an.getFloatFrequencyData(freq);
        this.cb?.onSpectrum(spectrumBandsDb(freq, rate, 10), rate);
      } catch { /* display only */ }
    }, 120);
  }

  private stopDisplayLoop(): void {
    if (this.displayTimer) {
      clearInterval(this.displayTimer);
      this.displayTimer = 0;
    }
  }

  /** Full disposal: tracks, worklet, context, timers, listeners, object URL. */
  dispose(): void {
    this.stopDisplayLoop();
    try {
      this.worklet?.port.close();
    } catch { /* noop */ }
    try {
      this.source?.disconnect();
    } catch { /* noop */ }
    try {
      this.analyser?.disconnect();
    } catch { /* noop */ }
    const track = this.stream?.getAudioTracks()[0];
    if (track && this.trackEnded) {
      try {
        track.removeEventListener('ended', this.trackEnded);
      } catch { /* noop */ }
    }
    if (this.devicesChanged) {
      try {
        navigator.mediaDevices.removeEventListener?.('devicechange', this.devicesChanged);
      } catch { /* noop */ }
    }
    this.stream?.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch { /* noop */ }
    });
    const ctx = this.ctx;
    this.stream = null;
    this.ctx = null;
    this.source = null;
    this.worklet = null;
    this.analyser = null;
    this.trackEnded = null;
    this.devicesChanged = null;
    this.cb = null;
    if (ctx) void ctx.close().catch(() => undefined);
  }

  /** Legacy alias used by older call sites. */
  stop(): void {
    this.dispose();
  }

  static async listDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      return all.filter((d) => d.kind === 'audioinput');
    } catch {
      return [];
    }
  }
}
