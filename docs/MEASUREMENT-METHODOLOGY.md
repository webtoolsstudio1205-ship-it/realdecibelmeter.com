# Measurement Methodology — Real Decibel Meter

## Pipeline (single path, no duplicates)

```text
microphone PCM (128-frame quanta, AudioWorklet `meter-processor.js`)
→ per-quantum sumSq / n / peak / validity (NaN/Inf excluded, clipping counted)
→ SOS frequency weighting for the ACTUAL sample rate (A/C per IEC 61672-1
  pole/zero layout, bilinear-mapped, 0 dB at 1 kHz; Z = unity)
→ Fast (125 ms) / Slow (1 s) exponential averaging on ENERGY (never on dB)
→ SessionAccumulator (energy sum + sample count; pause excluded;
  stabilization window discarded; weighting/calibration changes open segments)
→ EngineSnapshot (raw digital dBFS + typed MeasurementResult)
→ presentation.ts (ONE display contract):
  input-strength → 0–100% via ((dBFS + 100) / 100) · 100 (floor −100 dBFS)
  calibrated-spl → estimatedSpl = rawDbfs + profile.offset, unit dBA/dBC/dBZ
→ gauge / stats / graph / export
```

Digital Diagnostics (Customize → Advanced, collapsed by default) is the only place
raw negative dBFS is rendered.

## DSP contract

- `meanSquare = sum(x²) / N` over valid samples only.
- `digitalRmsDbfs = 10 · log10(meanSquare)`; silence/empty → `-Infinity`, rendered `--`.
- `sampledPeakDbfs = 20 · log10(max|x|)`; a sampled peak, never "True Peak".
- Session energy average: `10 · log10(energySum / sampleCount)` — dB values are never
  arithmetically averaged (40 dB + 60 dB equal-duration ≈ 57.0329 dB, tested).
- Capture requests `echoCancellation: false, noiseSuppression: false, autoGainControl: false,
  channelCount: 1` with OverconstrainedError fallback; actual track settings are inspected
  and surfaced, never assumed.

## Calibration

Offset = reference reading − measured digital energy level (same weighting, 30–60 s stable
capture, no clipping, no major gaps). A profile applies only when sample rate, device,
weighting, channel count, processing flags, and app version all match; otherwise the meter
falls back to input-strength mode. Reference must be a trusted meter or acoustic calibrator —
never silence, conversation, or another website.

## Honest limitations

Browser microphones are uncalibrated transducers: gain, placement, frequency response, and
OS/browser processing vary per device. Uncalibrated output is input strength, not sound
pressure. Even calibrated output is an estimate, never certified; safety, workplace, or legal
decisions require a calibrated Class 1/2 meter.

## 2026-09-16 note
No DSP changes this pass. Verified the public HTML no longer leaks digital labels outside
Digital Diagnostics (dead `data-s-*` attributes removed), and error pages (404/500) carry no
measurement claims at all.
