# POST-PROMPT-2-FIXES — negative decibel bug + meter rebuild

Date: 2026-09-15. Request: fix `-55.9 dB (estimated)` on a 30–120 scale, strict
typed results, state-based controls, premium real-data animations, semicircular
gauge. No browser/screenshot tooling is available in this environment — every
claim below is from `tsc`, `vitest`, `astro build` output and `dist/` content
checks, never from a visual render.

## Root cause

1. The panel rendered `stats.current` — the raw digital dBFS value
   (mathematically negative, e.g. −55.9) — next to the dictionary unit
   `dB (estimated)` on a 30–120 LED scale. Raw dBFS was labelled as an
   environmental estimate. The engine already computed mode-aware `display`
   values and units, but the panel ignored `display`, `mode` and `unit`.
2. The panel called `engine.setCalibrationOffset(...)`, which does not exist on
   `DecibelEngine` (inline `<script>` is not type-checked), referenced
   `s.spectrum` (the snapshot carries `spectrumDb`), and called the export
   helpers with the legacy `(stats, meta)` signature instead of
   `buildExportSession(...)`. Calibration therefore silently did nothing.
3. The engine defaulted to `digital` with no auto-apply of a saved compatible
   profile, used a generic `dB SPL (est.)` unit, and ranged digital as
   `[-80, 0]` / calibrated as `[20, 130]`.
4. Test debt masked all of it: `engine.test.ts` passed `sineFixture` sample
   counts as seconds (e.g. `4800` → 4800 s ≈ 230 M samples), hanging the suite
   before the calibration tests ran; `validateCalibration` (±60 dB) rejects the
   realistic ≈ +100 dB offsets genuine USB/phone mics need; and
   `applyReferenceCalibration` hard-failed when `localStorage` was unavailable
   (thrown away in private mode / node), so the calibration tests could never
   pass there.

No `Math.abs()`, clamping, sign-stripping or arbitrary offset was used as a
fix anywhere. The only `Math.abs` near display code is gone from the panel
(the interpolation snap uses a sign-preserving comparison); remaining
`Math.abs` hits are linear-PCM peak analysis (`dsp.ts`, `meter-processor.js`),
test tolerances, and the ±120 offset plausibility window — none of which touch
a displayed dB sign.

## Changed files

- `src/lib/types.ts` — `DisplayUnit` is now
  `dBFS | dB | dBA | dBC | dBZ`; new `MeasurementResult` union
  (`digital` / `relative` / `calibrated` / `uncalibrated` — the last carries
  deliberately NO numeric dB); snapshot gains `result`, `inputStrengthPct`
  (0–100 visual only, never exported) and `calibrationValid`.
- `src/lib/dsp.ts` — new `digitalToInputStrength()` (−100…0 dBFS → 0…100%,
  null-safe; display only).
- `src/lib/calibration.ts` — plausibility window widened ±60 → ±120 dB
  (−30 dBFS + 100 dB = 70 dBA is normal for real mics).
- `src/lib/engine.ts` — `splUnitFor()` (weighting-carrying dBA/dBC/dBZ);
  `buildResult()` (SPL exists ONLY as rawDbfs + compatible profile offset);
  `calibrationCompatible()`; saved compatible profiles auto-apply on `start()`;
  ranges `digital [-100, 0]` / `calibrated [20, 120]`; persistence failure no
  longer blocks calibration (in-memory profile, `storageOk = false`).
- `src/lib/export-format.ts` — legacy calibrated unit `dB SPL (est.)` → `dBA`.
- `src/lib/engine.test.ts` — fixed `sineFixture` seconds-vs-samples hang,
  30→31 reference-capture batches, `dBA` unit expectation, plus a new
  `strict typed results` block (uncalibrated exposes no environmental number,
  SPL = raw + offset with stored raw still negative, auto-apply, strength
  mapping).
- `src/lib/calibration.test.ts` — absurd-offset expectations match ±120.
- `src/components/MeterPanel.astro` — full rewrite (see below).
- `src/styles/global.css` — gauge/modal/stats/chip/edge/pulse animation
  system; LED-bar styles removed.
- `src/i18n/dictionaries.ts` — new keys (`btnCustomize`, `btnStartMeasuring`,
  `btnStartNew`, `btnSave`, `statusCalRequired`, `inputStrength`,
  `calibrateCta`, `digitalNote`, `digitalTitle`, `statSoundCurrent`,
  `statEnergyAvg`, `statDigitalAvg`, `statDigitalPeak`, `customizeTitle`,
  `customizeClose`). English is complete; the other 7 locales carry English
  fallback text pending professional translation (same status as FAQ).
- `docs/BUILD-STATE.md`, `docs/UI-QA.md`, `docs/POST-PROMPT-2-FIXES.md`
  (this file).

## New behaviour

- Main environmental meter without a compatible profile shows `-- dBA`
  (weighting-carried), `Calibration required`, a 0–100% microphone-input
  visual mapped from digital −100…0 dBFS, and a `Calibrate for sound level`
  CTA. Never a negative estimated dB; never `Leq` for raw dBFS (labels read
  `Digital energy average` / `Digital peak` / `Energy average`).
- Raw negative dBFS lives only in Customize → Digital Input (with the
  `Digital signal — normally negative` note and a −100…0 scale).
- With a valid profile the meter shows the positive estimate (e.g. `62.4 dBA`)
  on a 20–120 visual scale; the stored value is never clamped to it.
  Relative view shows dB change from baseline (never called calibration).
- Start requests permission and measures immediately — no popup. Customize is
  the only opener of measurement options (Calibrate, Digital Input, Relative,
  Microphone, A/C/Z, Fast/Slow). Transport is exclusive per state:
  idle `Start Measuring + Customize`, requesting `requesting + Customize`,
  running `Pause + Stop + Customize`, paused `Resume + Stop + Customize`,
  stopped `Start New + Save + Reset + Customize`, error `Retry + Dismiss +
  Customize`. (Customize stays visible when stopped so calibration remains
  reachable; it is not a transport button.)
- Animations all derive from real engine data: CSS transform/opacity
  entrances, one-shot logo wave, ambient glow fade-in, subtle grid, card
  scale-fade, gradient Start edge, requesting mic pulse, staggered chips,
  rAF-interpolated number/arc (~30 FPS, single loop, cancelled when
  idle/stopped/error/unmounted), glow tied to input strength, real FFT bars,
  progressive graph, first-sample stats fade, pause dim, stop pop, modal
  scale-fade, scroll reveal, 200 ms theme colour transition. `stop()` still
  disposes capture (mic released). Reduced-motion disables interpolation and
  continuous effects; mobile drops blur/glow/edge animation.

## Actual test results

- `npx tsc --noEmit` — pass.
- `npx vitest run` — **46/46 pass** (5 files; previously the suite hung in
  `engine.test.ts` and never finished: 13 engine + 4 new strict-result tests
  now run green).
- `npm run build` — pass, 20 pages.
- `dist/index.html` content check: `rdm-gauge` 2, `rdm-customize` 1,
  `rdm-modal` 6, `Calibration required` 2, `Calibrate for sound level` 2,
  `Digital signal` 2, `Start New Measurement` 1, `Customize measurement` 1,
  `dB (estimated)` 0, `rdm-led` 0, `dB SPL (est.)` 0.
- Source grep: no `setCalibrationOffset`, no `s.spectrum[^D]`, no `dB SPL
  (est.)`, no `Math.abs()` on any displayed dB value.

## Still pending (needs browser / human)

- Visual render QA at 320×800 / 390×844 / 768×1024 / 1440×900 in both themes
  (no tooling here); permission-flow QA on Chrome/Safari/Firefox + Android/iOS.
- Professional translation of the new Customize/gauge strings (7 locales show
  English fallback) and of the FAQ answers (pre-existing).
- OG PNG render if the platform needs raster; Cloudflare Pages deploy config.

## 2026-09-16 follow-up repair

The previous rewrite left one obsolete public branch in `updateStats()`: in Input Strength mode it
still wrote raw `stats.leq`, `stats.peakDb`, and `stats.current` into the normal homepage. It also
allowed Digital/Relative views to replace the public gauge and drew every history series with the
legacy 30–120 transform. This was the remaining source of the reported 47% / −53.2 / −19.2 /
−53.2 interface.

The follow-up introduces `src/lib/presentation.ts` as the single display contract, removes those
branches, keeps the engine graph as bounded raw digital history, and maps that history only at the
display layer. Public uncalibrated gauge/stats/graph are percentages; compatible calibrated mode
adds the saved offset and carries dBA/dBC/dBZ; Digital Diagnostics alone formats negative dBFS.
The diagnostics are nested under Customize → Advanced and collapsed by default.

Actual final checks: TypeScript pass; Vitest 55/55; Astro production build pass (20 pages);
rendered dark/light browser review at 320×800, 390×844, 768×1024, and 1440×900. The browser pass
found and fixed a 768px duplicate menu-button cascade and 320px brand wrapping. Live hardware
permission completion remains a real-device limitation; deterministic engine tests cover stream
release, cancellation, state transitions, and calibration math.

## 2026-09-16 two-mode + stabilizing pass
- `stabilizing` state added to the engine with a ~1.5 s discarded warm-up window; quanta inside
  the window never reach session, graph, or reference capture (proven: 0 samples mid-window).
- Central `PublicMeasurementMode` selector (`input-strength` | `calibrated-spl`) in
  `presentation.ts`; components no longer guess the mode.
- Public copy corrected: `Uncalibrated — showing microphone input strength, not environmental dB`,
  `Calibration required for environmental dB`, Current/Average/Peak Strength, Save Session,
  spec hero eyebrow/sub.
- New Measurement Quality panel (overall, calibration, signal, processing, rate, channels,
  duration, gaps, last calibration date).
- Verified: Vitest 89/89 (8 files), `tsc --noEmit` pass, `astro build` 21 pages pass, dist SEO
  re-verified (canonicals, hreflang, JSON-LD, sitemap, robots), localhost:4321 DOM scan all-pass
  with zero banned strings and no server errors.

## 2026-09-16 pass (this session)
- Baseline: 89/89 tests, clean typecheck, 21-page build — zero initial failures.
- Removed dead `data-s-*` attributes + dead i18n keys; added `500.astro`, verified `404.astro`,
  excluded both from the sitemap.
- Final: Vitest 91/91, typecheck pass, 22-page build pass, localhost + error-page checks all-pass.
