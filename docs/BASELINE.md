# BASELINE — Real Decibel Meter (Prompt 1 start)

Recorded 2026-09-15 before implementation. The repository was a bare Astro starter.

## Route inventory (existing)
- `src/pages/index.astro` — default Astro placeholder (`<h1>Astro</h1>`), no styling, no components.
- No other routes. None of the required content routes existed (`/accuracy/`, `/calibration/`,
  `/methodology/`, `/how-to-use/`, `/microphone-not-working/`, `/decibel-chart/`, `/db-vs-dba/`,
  `/about/`, `/contact/`, `/privacy/`, `/terms/`, locale roots, 404).

## Reusable code (existing)
- None. No `src/components/`, no `src/lib/`, no i18n, no styles.
- `public/favicon.svg` / `public/favicon.ico` — default Astro rocket assets (replaced: off-brand).
- `DESIGN.md` — present, but it is a **Vercel marketing-site analysis**, not a project design spec.
  Preserved untouched. The Prompt-1 design system (dark `#08090B` / light `#FFFFFF`, blue accent,
  cyan→blue→violet gradient) lives in `src/styles/global.css`.

## Config (existing)
- `astro.config.mjs` — empty `defineConfig({})`, no output mode, no integrations.
- `package.json` — only dependency `astro ^7.3.2`; scripts: `dev`, `build`, `preview`, `astro`.
  No TypeScript, Tailwind, lint, or test tooling installed.
- `tsconfig.json` — extends `astro/tsconfigs/strict`.

## Constraints noted
- No `docs/` directory. No lint/test configuration to preserve.
- Tailwind CSS was **not** installed despite the required stack; installed v4 fresh
  (`tailwindcss@^4`, `@tailwindcss/vite@^4`) — no v3 config was ever present, so no v3/v4 mixing.
