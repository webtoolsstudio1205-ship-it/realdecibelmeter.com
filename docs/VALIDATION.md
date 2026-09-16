# Validation — 2026-09-16 pass

## Automated (evidence: command output this pass)

- `npm test` — 89/89 pass across 8 files:
  `dsp.test.ts` (18), `engine.test.ts` (14), `presentation.test.ts` (8),
  `seo.test.ts` (17), `spec-compliance.test.ts` (17), `session.test.ts` (5),
  `calibration.test.ts` (6), `export-format.test.ts` (4).
- `npm run typecheck` (`tsc --noEmit`) — pass.
- `npm run build` (`astro build`) — pass, 21 pages, sitemap-index emitted.
- Key fixtures proven: −53.2 dBFS → 46.8% (renders 47%); −53.2 + 113.2 → 60.0 dBA;
  40 dB + 60 dB equal-duration → ≈57.0329 dB; 1 kHz sine ≈ −3.0103/−9.0309 dBFS;
  A/C filters within 0.6 dB of IEC nominals at 44.1/48 kHz; Z flat.
- Stabilization: 0 ingested samples mid-window, 24000 after; state promotes to running.
- Stop disposes the capture (mic released); late-resolving permission requests are disposed.
- Dist SEO script: unique titles/H1s, self HTTPS canonicals, 9-hreflang cluster, JSON-LD
  parses, sitemap 20 canonical URLs, robots valid, zero bad URLs.
- Localhost DOM scan (`localhost_qa.mjs`): all required strings present, all banned strings
  absent (mode popup, digital-stat labels, old uncalibrated copy, skeletons), routes 200,
  unknown path 404, no dev-server errors.

## Manual / blocked

- MANUAL REQUIRED: physical microphone permission completion (no mic in this environment);
  deterministic fake-capture fixtures cover the pipeline instead.
- MANUAL REQUIRED: visual screenshots at 320×800 / 390×844 / 768×1024 / 1440×900 in dark and
  light themes (no browser harness here); layout uses the previously reviewed responsive
  structure with the new quality panel and stabilizing indicator in normal flow.
- Reduced motion: covered by CSS test (`prefers-reduced-motion` disables orbs, pulse,
  interpolation); manual OS-setting check still recommended.

## 2026-09-16 pass (this session)
- Baseline before editing: `npm test` 89/89, `tsc --noEmit` pass, `astro build` 21 pages —
  zero initial failures.
- After changes: `npm test` 91/91 (new: dead-attribute regression test, 500-page SEO test),
  `tsc --noEmit` pass, `astro build` 22 pages pass.
- Error pages: `dist/404.html` + `dist/500.html` each verified (one H1, code eyebrow, noindex,
  single non-self canonical, meter/guides/calibration links, no bad URLs); sitemap holds 20
  canonical URLs with no /404 or /500 entries.
- Homepage markup: banned labels proven absent from the public part and present only inside
  Digital Diagnostics (offset check against `rdm-diagnostics`); localhost DOM scan all-pass;
  dev-server log shows 200s, one expected 404 probe, no errors.
