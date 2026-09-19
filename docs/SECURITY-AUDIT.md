# SECURITY-AUDIT — Real Decibel Meter (2026-09-16)

## Architecture (verified, not assumed)

- **Astro 7, `output: 'static'`** (`astro.config.mjs`): 22 pre-rendered pages in
  `dist/`, no SSR, no server routes.
- **No middleware** (`src/middleware.ts` absent), **no API routes**
  (`src/pages/api/` absent), **no Astro Actions** (`src/actions/` absent),
  **no forms** (contact page is link-only), **no cookies set by the app**,
  **no analytics, no third-party scripts, no service worker, no file uploads**.
- **Deployment: Cloudflare Pages static hosting** (per `docs/BUILD-STATE.md`:
  `dist/` static, `404.html` as not-found). No `wrangler.toml`; `.wrangler/`
  contains only an empty tmp dir. Headers are therefore applied via
  `public/_headers` — the correct Pages mechanism.
- **Classification: static.** There is no server-side attack surface on this
  origin. SQL injection, CSRF, session hijacking, CORS misconfiguration and
  authentication-bypass findings are **not applicable** — no database, no
  sessions, no credentials, no cross-origin endpoints exist.

## Attack surface (actual)

| Surface | Exposure |
|---|---|
| Static HTML/CSS/JS over HTTPS | Low — no secrets in bundles (tested) |
| Web Audio measurement engine | Local-only; mic gated behind Start click |
| localStorage (theme, 20 sessions, ≤10 calibration profiles) | User-controlled; validated on load |
| CSV/JSON/PDF session export + download | Formula-injection neutralized; filenames sanitized |
| Static outbound links (MDN, CDC/NIOSH, W3C) | Same-tab links, no `target=_blank` |
| JSON-LD `set:html` | Static author-controlled JSON only |
| Cloudflare account / DNS / registrar | **Highest residual risk — owner action required** |
| npm supply chain | 3 runtime deps; prod audit clean |

## Findings

### Critical — none.

### High

1. **No security headers were sent (before this audit).** No CSP, no
   `X-Content-Type-Options`, no framing controls, no Permissions-Policy.
   *Evidence:* `public/` contained only svg + robots.txt; no `_headers` file
   existed. *Remediation:* `public/_headers` created (verified copied to
   `dist/_headers`). *Status:* fixed at repo level; production serving depends
   on Pages deploy (owner redeploys; no auto-deploy performed here).

### Medium

2. **CSV formula injection partially neutralized.** `csvCell` prefixed
   `= + - @` cells with `'` but returned them *unquoted*, so a payload
   containing `"`/`,`/newline could still break CSV structure.
   *Evidence:* `src/lib/export-format.ts` old `if (cell.startsWith("'")) return cell;`
   *Remediation:* quote after prefixing; expectations updated in
   `export-format.test.ts`; new cases in `security.test.ts` §7. *Status:* fixed.
3. **Calibration profile loader trusted stored offsets.** `isValidProfile`
   accepted any finite `offsetDb` (e.g. hand-edited `9999`), which would flow
   into `rawDbfs + offset` SPL display.
   *Evidence:* old validator in `src/lib/calibration.ts`. *Remediation:*
   range (±120), label-length and reference-bound checks on load. *Status:* fixed.
4. **History loader had no size bound and weak entry checks.**
   *Remediation:* 256 KiB pre-parse cap (`isStoredPayloadSizeOk`), id/label/
   date/numeric range validation. *Status:* fixed.
5. **Error detail echoed multi-line browser text into the UI.**
   *Remediation:* `describeError` keeps only the first line (Error.message),
   capped at 200 chars; panel renders via `textContent`. *Status:* fixed.
6. **`innerHTML = ''` clearing in MeterPanel** (history/mic/profiles lists).
   Content was rebuilt with `textContent`, so not exploitable, but replaced
   with `replaceChildren()` to remove the sink class entirely. *Status:* fixed.
7. **Export filenames passed through to `a.download` unsanitized.**
   *Remediation:* `sanitizeExportFilename` applied inside `downloadBlob`.
   *Status:* fixed.
8. **`.gitignore` missed `.dev.vars` and `.wrangler/`.**
   *Remediation:* added `.env*.local`, `.dev.vars`, `.wrangler/`. *Status:* fixed.

### Low

9. **`data-mic-default`-style attributes / labels**: no issue — static.
10. **No `security.txt`.** *Remediation:* `public/.well-known/security.txt`
    template created, marked INCOMPLETE (no fake contact published). Owner must
    supply a real security email. *Status:* pending owner input.
11. **Dev-only moderate advisory** (`@vitest/mocker` path traversal,
    GHSA-82fw-gwwq-j7x9, via `vitest`). Fix requires breaking `vitest@5`;
    dev-only, never shipped to production (`npm audit --omit=dev`: 0 vulns).
    *Status:* accepted risk, documented.

### Informational

- No source maps emitted in `dist/` (verified: zero `*.map` files).
- No `console.log` of audio/tokens; no analytics calls; no `fetch`/
  `sendBeacon` anywhere in `src/` (verified by grep).
- `window.location.reload()` in `500.astro` is the only location use — no
  user-controlled URL, no open redirect.
- Public JS remains inspectable by design; hiding source maps is not
  concealment of source.

## Verification

- `npx tsc --noEmit` — pass.
- `npm test` — 219/219 pass (17 files), incl. new `src/lib/security.test.ts`
  (37 tests covering spec §21 items 1–20).
- `npm run build` — pass, 22 pages, `dist/_headers` present.
- `npm audit` — 0 prod vulns; 2 moderate dev-only (vitest chain).
- Secret scan (tracked files + last 50 commits): no tokens/keys found.

## Remaining risks

1. Cloudflare account without 2FA / leaked token / DNS hijack — **owner
   checklist** (`docs/CLOUDFLARE-SECURITY-CHECKLIST.md`), all MANUAL CHECK.
2. CSP `script-src`/`style-src` retain scoped `'unsafe-inline'` (static Pages
   cannot mint nonces; theme anti-flash script must run pre-paint; 113 inline
   style attributes). XSS defense rests on output encoding + zero dynamic
   sinks — verified by tests, but a future inline-script addition must be
   reviewed against the CSP.
3. Microphone accuracy limits are a measurement-integrity matter, not a
   network-security one; covered by existing methodology docs.
