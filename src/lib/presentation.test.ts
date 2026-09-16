import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { EngineSnapshot } from './types.js';
import { digitalDiagnostics, publicGauge, publicGraph, publicStats, transportControls } from './presentation.js';

function snapshot(overrides: Partial<EngineSnapshot> = {}): EngineSnapshot {
  return {
    state: 'running', error: 'none', errorDetail: '', weighting: 'A', response: 'fast',
    mode: 'digital', unit: 'dBFS',
    result: { kind: 'digital', valueDbfs: -53.2, unit: 'dBFS' },
    inputStrengthPct: 46.8, calibrationValid: false,
    display: { current: -53.2, min: -60, leq: -53.2, max: -42, peakDb: -19.2 },
    calibration: { id: 'uncalibrated', label: 'Uncalibrated', offsetDb: 0, isCalibrated: false },
    activeProfile: null, baseline: null, calibrationStale: false, calibrationStaleReasons: [],
    stats: { current: -53.2, min: -60, max: -42, leq: -53.2, durationSec: 12, samples: 1, peakDb: -19.2, gapMs: 0, gapCount: 0, recordedSec: 12 },
    permission: 'granted', deviceLabel: 'Fixture mic', deviceId: 'fixture', sampleRate: 48000,
    channelCount: 1, processing: { echoCancellation: 'disabled', noiseSuppression: 'disabled', autoGainControl: 'disabled' },
    relaxedConstraints: [], secureContext: true, lastUpdateAt: 0, spectrumDb: [], gaps: [], gapMs: 0,
    segments: [], referenceCapture: null, meterRange: [-100, 0], storageOk: true, appVersion: 'test',
    ...overrides,
  };
}

describe('public measurement presentation', () => {
  it('maps −53.2 dBFS to approximately 47% without exposing raw values', () => {
    const s = snapshot();
    expect(publicGauge(s)).toMatchObject({ value: 46.8, unit: '%', lo: 0, hi: 100 });
    const rendered = JSON.stringify(publicStats(s));
    expect(rendered).toContain('47%');
    expect(rendered).not.toMatch(/-53\.2|dBFS|Raw Current|Digital Energy Average/i);
  });

  it('keeps the original raw reading only in Digital Diagnostics', () => {
    expect(digitalDiagnostics(snapshot())[0]).toEqual({ label: 'Current', value: '-53.2 dBFS' });
  });

  it('applies a valid +113.2 dB profile as exactly 60.0 dBA', () => {
    const s = snapshot({
      mode: 'calibrated', unit: 'dBA', calibrationValid: true,
      result: { kind: 'calibrated', spl: 60, unit: 'dBA', profileId: 'fixture', offsetDb: 113.2 },
      display: { current: 60, min: 53.2, leq: 60, max: 71.2, peakDb: 94 },
      calibration: { id: 'fixture', label: 'Fixture', offsetDb: 113.2, isCalibrated: true },
      meterRange: [20, 120],
    });
    expect(publicGauge(s)).toMatchObject({ value: 60, unit: 'dBA', lo: 20, hi: 120 });
    expect(publicStats(s)[0]?.value).toBe('60.0 dBA');
  });

  it('falls back to Input Strength when a profile is invalid or mismatched', () => {
    const s = snapshot({
      calibrationValid: false,
      result: { kind: 'uncalibrated', reason: 'calibration-required', unit: 'dBA' },
      calibrationStale: true,
      calibrationStaleReasons: ['Microphone device changed.'],
    });
    expect(publicGauge(s)).toMatchObject({ label: 'Microphone Input Strength', unit: '%' });
  });

  it('uses 0–100% for uncalibrated history and selected weighting for calibrated history', () => {
    expect(publicGraph([-100, -53.2, 0], snapshot())).toEqual({
      series: [0, 46.8, 100], lo: 0, hi: 100, label: 'Input strength (%)', unit: '%',
    });
    for (const unit of ['dBA', 'dBC', 'dBZ'] as const) {
      const result = publicGraph([-53.2], snapshot({
        calibrationValid: true,
        result: { kind: 'calibrated', spl: 60, unit, profileId: 'fixture', offsetDb: 113.2 },
      }));
      expect(result).toMatchObject({ series: [60], lo: 20, hi: 120, unit });
    }
  });
});

describe('homepage controls and cleanup contract', () => {
  it('shows only controls valid for the actual state', () => {
    expect(transportControls('idle')).toEqual(['start', 'customize']);
    expect(transportControls('requesting-permission')).toEqual(['requesting', 'cancel']);
    expect(transportControls('running')).toEqual(['pause', 'stop', 'customize']);
    expect(transportControls('paused')).toEqual(['resume', 'stop', 'customize']);
    expect(transportControls('stopped')).toEqual(['start-new', 'save', 'reset']);
  });

  it('wires Start directly to the engine and Customize to the dialog', () => {
    const source = readFileSync(fileURLToPath(new URL('../components/MeterPanel.astro', import.meta.url)), 'utf8');
    expect(source).toContain("els.start?.addEventListener('click', () =>");
    expect(source).toMatch(/els\.start\?\.addEventListener[\s\S]{0,180}engine\.start\(\)/);
    expect(source).not.toMatch(/els\.start\?\.addEventListener[\s\S]{0,180}openModal/);
    expect(source).toContain("els.customize?.addEventListener('click', openModal)");
    expect(source).toContain('window.addEventListener(\'pagehide\', cleanup');
    expect(source).toContain('unsubscribe()');
  });

  it('defines reduced-motion fallbacks for all non-essential effects', () => {
    const css = readFileSync(fileURLToPath(new URL('../styles/global.css', import.meta.url)), 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toMatch(/\.hero-orb[\s\S]*animation: none !important/);
    expect(css).toMatch(/\.mic-pulse[\s\S]*animation: none !important/);
  });
});
