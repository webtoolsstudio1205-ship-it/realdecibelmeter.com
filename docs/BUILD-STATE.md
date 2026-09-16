# BUILD-STATE — Real Decibel Meter (Prompt 1)

## What was built
Static Astro 7 site (output `static`, Tailwind CSS v4 via `@tailwindcss/vite`) with a real
client-side Web Audio measurement engine. No simulated data: idle reads `--` until Start.

- **Engine (`src/lib/`)**: `types.ts` (state machine `idle | requesting-permission | running |
  paused | stopped | error`, typed snapshot), `dsp.ts` (RMS → dB estimate, A/C/Z correction,
  Fast/Slow time weighting, formatters), `microphone.ts` (single-stream capture guard, never
  routes to speakers), `calibration.ts` (±40 dB validation), `session.ts` (Leq accumulator),
  `graph.ts` (240-pt ring buffer + SVG path), `export-format.ts` (CSV/JSON download),
  `history.ts` (20-entry localStorage), `errors.ts` (8 typed errors + recovery), `engine.ts`
  (facade; all UI consumes its snapshot), `pipeline.ts` (display clamp 20–130 dB).
- **UI**: `Layout.astro` (64px sticky header, logo, Guides link, language `<select>` with native
  names, theme toggle, mobile menu with Escape/focus-return), `MeterPanel.astro` (all transport
  controls, mic selector, live SVG graph, 5 stat tiles, Advanced `<details>`, export, history),
  `Article.astro` (guide template). Homepage order matches spec: compact hero → meter in first
  viewport → stats/graph → advanced → 3 steps → accuracy → troubleshooting → session/export →
  FAQ → guides → footer.
- **Routes (20 built pages)**: `/`, 11 English guides/legal pages, `/de /it /ja /es /fr /pt /ko`
  homepages via `src/pages/[locale]/index.astro` static paths, `404.html` (served as the
  not-found page by Cloudflare Pages static hosting).
- **i18n**: typed `Dict` in `src/i18n/dictionaries.ts` (8 locales); no mixed-language pages; no
  auto-redirect; switcher opens the equivalent path when known, else the locale homepage.
- **Brand**: original meter-bar `public/logo.svg`, `favicon.svg`, `og-image.svg` (no Vercel marks).
- **Theme**: dark default, `localStorage` persist, inline head script prevents flash, honours
  `prefers-reduced-motion`, tabular numerals, focus-visible rings both themes.

## Changed / added files
- Edited: `astro.config.mjs`, `package.json` (+tailwindcss, +@tailwindcss/vite, +typescript),
  `public/favicon.svg`, `src/components/MeterPanel.astro` (new), all below new:
- New: `src/styles/global.css`, `src/lib/*` (10 modules), `src/i18n/dictionaries.ts`,
  `src/components/{Layout,Article}.astro`, `src/pages/{index,404}.astro`,
  `src/pages/{accuracy,calibration,methodology,how-to-use,microphone-not-working,decibel-chart,db-vs-dba,about,contact,privacy,terms}/index.astro`,
  `src/pages/[locale]/index.astro`, `public/{logo,og-image}.svg`, `docs/*`.

## Commands executed (actual results)
- `npm install -D tailwindcss@^4 @tailwindcss/vite@^4 typescript@~5.9` — ok (17 packages).
- `npx tsc --noEmit` — **pass** (after fixing: `base()` typing, `alphaFor` import source,
  `Float32Array<ArrayBuffer>` generics).
- `npm run build` — **pass**, 20 pages, static output to `dist/`.
- No lint configured (`package.json` has no eslint/stylelint script) — nothing to run.
- No unit tests configured — none exist; DSP/session/graph modules are written pure for future tests.

## Prompt 2 changes (2026-09-15, user feedback round)
- Removed `BROWSER SPL ESTIMATE` tagline from the header (brand is now wordmark only).
- Favicon fix: deleted stale Astro-default `public/favicon.ico` (it was winning over the
  custom meter-bar `favicon.svg` in tabs) and removed the `.ico` link tag. **Restart the dev
  server and hard-refresh** — screenshots showing the old "A" icon / visible Resume button
  came from a stale dev session; current source + `dist/` output are correct (Resume ships
  with `hidden`, verified in built HTML).
- New interactive meter: 24-segment LED level bar (30–120 dB, cyan→blue→violet, peak-hold
  marker) + 10-band live spectrum analyzer fed by **real FFT data** (`getFloatFrequencyData`
  aggregated log-spaced 60 Hz–12 kHz in `dsp.spectrumBands`, carried in
  `EngineSnapshot.spectrum`). Running pulse glow on panel + reading halo; Start button gets
  an attention glow while idle. All visuals derive from the same engine snapshot — no
  simulated values.
- Language selector rebuilt: custom globe-button popover with native names, current-language
  checkmark, server-rendered equivalent-page hrefs, ArrowUp/Down + Escape + click-outside,
  animated 180ms pop. Native `<select>` removed.
- Motion system (`global.css`): staggered hero entrance, scroll reveal (`data-reveal` +
  IntersectionObserver, `html.js`-gated so no-JS still shows content), animated brand mark,
  nav hovers, theme-icon spin, burger→X morph, staggered mobile links, button lift/press,
  card hover lift, refresh-icon spin. Everything ≤220ms transform/opacity (plus two slow
  2.4s ambient pulses), all disabled under `prefers-reduced-motion`.
- Mic selector restyled (custom chevron, hover border); refresh is now an icon button.
- Re-ran `npx tsc --noEmit` (pass) + `npm run build` (pass, 20 pages).
- No addresses, registrations, emails, user counts, reviews, ratings, logos, lab tests,
  certifications, or accuracy percentages anywhere (verified by content grep; matches are
  disclaimers like “not certified” or code identifiers).
- `/contact/` states no support email is published yet.
- Non-English FAQ answers reuse the English source text (dictionaries map `enFaq`) pending
  professional translation — surfaced as **blocker 2** below.

## Unresolved blockers
1. **FAQ localization incomplete** — non-English locales show English FAQ Q&A (structure and all
   other strings translated). Needs translator pass.
2. **Owner contact channel missing** — see `/contact/` + note below (private): configure a real
   support email/form endpoint before advertising support. **Do not publish invented details.**

## Next prompt to execute
Prompt 2 (per plan): professional FAQ translation pass, real-device microphone QA
(permission flows on Chrome/Safari/Firefox + Android/iOS), ` OG PNG` render from
`public/og-image.svg` if the platform needs raster, then Cloudflare Pages deploy config
(`dist/` static, `404.html` as not-found). Re-run `npx tsc --noEmit` + `npm run build` after
any change.

## Prompt 3 changes (2026-09-15, negative-decibel fix + meter rebuild)

Root cause: the panel rendered raw digital dBFS (`stats.current`, negative) next to
`dB (estimated)` on a 30–120 LED scale while ignoring the engine's `display`/`mode`/`unit`;
it also called the nonexistent `engine.setCalibrationOffset`, read `s.spectrum`
(snapshot carries `spectrumDb`), and used the legacy export signature — so calibration
silently never worked. Full account: `docs/POST-PROMPT-2-FIXES.md`.

- **Engine (`src/lib/`)**: `types.ts` gains strict `MeasurementResult`
  (`digital`/`relative`/`calibrated`/`uncalibrated`, the last with no numeric dB) plus
  snapshot `result`, `inputStrengthPct` (0–100 visual only, never exported) and
  `calibrationValid`; `DisplayUnit` is now `dBFS|dB|dBA|dBC|dBZ`. `dsp.ts` gains
  `digitalToInputStrength()` (−100…0 dBFS → 0…100%). `calibration.ts` plausibility
  window ±60 → ±120 dB. `engine.ts`: `splUnitFor()`, `buildResult()`
  (`estimatedSPL = rawDbfs + offset` only with a compatible profile),
  auto-apply of saved compatible profiles on `start()`, ranges digital
  `[-100, 0]` / calibrated `[20, 120]`, persistence failure no longer blocks
  calibration (in-memory profile). `export-format.ts` legacy unit → `dBA`.
- **Tests**: `engine.test.ts` sineFixture seconds-vs-samples hang fixed, 31
  reference-capture batches, `dBA` expectation, new `strict typed results` block;
  `calibration.test.ts` absurd-offset expectations match ±120.
- **UI**: `MeterPanel.astro` rewritten — centred semicircular SVG gauge
  (`-- dBA` + `Calibration required` + input-strength % + CTA when uncalibrated;
  positive `62.4 dBA`-style estimate when calibrated; negative dBFS only inside
  Customize → Digital Input with a −100…0 scale), state-exclusive transport
  (Start opens no popup; Customize is the only options opener), Customize modal
  (Calibrate / Digital / Relative / Microphone / A-C-Z / Fast-Slow), compact
  stats grid, real-data-only ~30 FPS rAF interpolation (single loop, cancelled on
  stop/unmount), reduced-motion + mobile fallbacks. LED-bar styles removed from
  `global.css`. New i18n keys; English complete, 7 locales on English fallback
  pending translation.
- Commands (actual): `npx tsc --noEmit` — pass; `npx vitest run` — **46/46 pass**
  (suite previously hung before finishing engine tests); `npm run build` — pass,
  20 pages; `dist/index.html` check — new gauge/CTA strings present, `dB
  (estimated)`/`rdm-led`/`dB SPL (est.)` zero hits.
- Still pending (no browser tooling here): visual render QA all viewports/themes,
  permission-flow QA on real devices, translation of new strings + FAQ, OG PNG,
  Pages deploy config.

## Prompt 4 repair (2026-09-16, strict public presentation + rendered QA)

- **Root cause confirmed in the live render path:** `MeterPanel.updateStats()` mapped only the
  first public tile to `inputStrengthPct`; the other three tiles still formatted `stats.leq`,
  `stats.peakDb`, and `stats.current` directly. Its optional Digital view also promoted raw dBFS
  back onto the main gauge. `seriesToPath()` hardcoded a 30–120 Y scale while the engine graph
  contained raw mode-dependent numbers. Those paths produced the reported 47% / −53.2 / −19.2 /
  −53.2 combination even though the engine itself preserved correct negative digital readings.
- **One public presentation pipeline:** new `src/lib/presentation.ts` owns gauge, statistics,
  graph units/ranges, diagnostics formatting, and state-exclusive controls. Uncalibrated current,
  energy-average, and peak dBFS values each map independently through the documented −100…0 →
  0…100% visual formula. Calibrated output exists only for a compatible profile and remains
  `raw + offset` with its selected dBA/dBC/dBZ unit.
- **Old render paths removed:** no public Digital/Relative gauge selector; no public raw-current,
  digital-average, or digital-peak tile; no fixed 30–120 graph transform; no raw local-history
  average. Raw values and the −100…0 graph now live only in Customize → Advanced → Digital
  Diagnostics, collapsed by default.
- **Layout and motion:** centred compact hero with required eyebrow/copy/trust row, finite
  decorative waveform and exactly two blurred orbs, responsive gauge/stat card, hover-only CTA
  sweep, mode/status/permission animations, area graph, endpoint, crosshair/tooltip, pause
  markers, and cleanup for rAF/subscriptions/device listeners/IntersectionObserver. Reduced
  motion disables non-essential effects.
- **Controls:** requesting state now includes a real Cancel action; a late-resolving microphone
  stream is disposed. Stopped state is exactly Start New Measurement / Save Session / Reset.
- **Verification:** `npx tsc --noEmit` pass; `npm test` **55/55 pass** (6 files); `npm run build`
  pass (20 static pages). Browser screenshots were captured and reviewed at 320×800, 390×844,
  768×1024, and 1440×900 in dark and light themes. No horizontal overflow; the 768px duplicate
  mobile-menu cascade and 320px header wrapping found during QA were fixed and rechecked.
