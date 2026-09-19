# SECURITY-HARDENING — what changed and why

Repo-level changes only. No dashboard changes, no auto-deploy, no redesign,
no measurement-engine behavior change (all DSP/session semantics untouched).

## 1. Headers (`public/_headers`, served by Cloudflare Pages)

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` (primary control)
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` (no popups used;
  COEP/CORP deliberately omitted — `require-corp` would break the blob:
  AudioWorklet; see audit §Architecture)
- `Permissions-Policy: microphone=(self), camera=(), geolocation=(),
  payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(),
  magnetometer=()` — microphone stays available to the first-party meter only
- Enforced CSP (no report-only residue):
  `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors
  'none'; form-action 'self'; script-src 'self' 'unsafe-inline' blob:;
  style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self';
  connect-src 'self'; media-src 'self' blob:; worker-src 'self' blob:;
  manifest-src 'self'; upgrade-insecure-requests`
  - `blob:` exists solely for `audioWorklet.addModule()` (`microphone.ts`).
  - `'unsafe-inline'` is scoped and documented in the file header: static
    hosting cannot mint nonces, and the theme anti-flash script must run
    before first paint. No `*`, no `unsafe-eval`, no `data:`, no external
    origins. HSTS is intentionally left to the dashboard checklist (subdomain
    readiness unknown).

## 2. Client guards (`src/lib/security.ts`, new)

Pure helpers with tests: `escapeHtml`, `isSafeHref`, `isInternalRedirectPath`,
`sanitizeExportFilename` (wired into `downloadBlob`), `isStoredPayloadSizeOk`.
No dynamic-URL sink exists today; the href/redirect guards encode the
allowlist so future edits are checked by tests.

## 3. Storage hardening

- `history.ts`: 256 KiB pre-parse cap; id/label/date/numeric range validation
  on load; save path already truncated labels to 80 chars and bounded to 20.
- `calibration.ts`: loader re-checks offset range (±120), label length,
  reference bounds — a tampered store can no longer smuggle fantasy offsets.

## 4. Export hardening

- `export-format.ts`: CSV cells are quote-escaped *after* formula-prefixing;
  `downloadBlob` sanitizes filenames and still revokes the object URL.

## 5. UI hardening

- `MeterPanel.astro`: `innerHTML = ''` → `replaceChildren()` (3 sites).
- `errors.ts`: error detail reduced to first line ≤200 chars; rendered via
  `textContent`.

## 6. Hygiene

- `.gitignore`: `.env*.local`, `.dev.vars`, `.wrangler/`.
- `public/.well-known/security.txt`: template, marked INCOMPLETE — owner must
  supply a real contact before it counts as published.

## 7. Tests

- `src/lib/security.test.ts` (37 tests) + updated `export-format.test.ts`
  expectations for the stricter CSV quoting.
- Full suite: 219/219 pass. Typecheck pass. Build pass (22 pages).
- SEO preserved: robots/sitemap/canonicals/hreflang/JSON-LD untouched and
  re-verified by the existing `seo.test.ts` + dist audit in build output.

## Deliberately NOT done (with reason)

- Turnstile: no abuse-prone server action exists (no forms/APIs) — adding it
  to page navigation or the local meter would violate the brief.
- CSRF tokens / cookies / CORS policy: no cookie-auth surface exists.
- Rate limiting in code: no server endpoints; plan documented for dashboard
  rules *if* endpoints are added later.
- HSTS header in repo: subdomain readiness unknown; dashboard-gated.
- `npm audit fix --force`: would force breaking vitest 5 for a dev-only issue.
