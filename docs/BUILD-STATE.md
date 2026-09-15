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
1. **Browser/screenshot verification NOT performed** — no browser or screenshot tooling is
   available in this environment. The 320×800 / 390×844 / 768×1024 / 1440×900 render checks
   and dark/light visual QA are marked **pending** in `docs/UI-QA.md`. Do not claim otherwise.
2. **FAQ localization incomplete** — non-English locales show English FAQ Q&A (structure and all
   other strings translated). Needs translator pass.
3. **Owner contact channel missing** — see `/contact/` + note below (private): configure a real
   support email/form endpoint before advertising support. **Do not publish invented details.**

## Next prompt to execute
Prompt 2 (per plan): professional FAQ translation pass, real-device microphone QA
(permission flows on Chrome/Safari/Firefox + Android/iOS), ` OG PNG` render from
`public/og-image.svg` if the platform needs raster, then Cloudflare Pages deploy config
(`dist/` static, `404.html` as not-found). Re-run `npx tsc --noEmit` + `npm run build` after
any change.
