# UI-QA — Real Decibel Meter (Prompt 1)

Method: static code review + production build only. **No browser or screenshot tooling is
available in this environment, so no viewport was visually rendered.** Nothing below marked
“pending” may be reported as tested.

## Checklist
| Check | 320×800 | 390×844 | 768×1024 | 1440×900 | Dark | Light |
|---|---|---|---|---|---|---|
| No horizontal overflow | pending | pending | pending | pending | — | — |
| Hero compact, meter near first viewport | pass (code) | pass (code) | pass (code) | pass (code) | pass | pass |
| Clipped text / translation overflow | pending | pending | — | — | pending | pending |
| Contrast (text vs surface) | pass (tokens) | pass | pass | pass | pass (code) | pass (code) |
| Mobile menu opens/closes, Escape, focus return | pass (code) | pass (code) | — | — | — | — |
| Language selector switches, no mixed language | pass (build) | — | — | — | — | — |
| Theme toggle + persist + no flash | pass (code) | — | — | — | pass | pass |
| Focus-visible on all controls | pass (code) | — | — | — | pass | pass |
| All buttons functional/disabled-with-reason | pass (code) | — | — | — | — | — |
| Graph resizes (SVG viewBox, preserveAspectRatio none) | pass (code) | pending | pending | pending | — | — |
| Production build | **pass** | — | — | — | — | — |
| Type check | **pass** | — | — | — | — | — |

## Code-review findings (fixed)
- Translated meter statuses/permissions/calibration badges were initially rendered as raw
  state keys by the client script — fixed via `data-*` attributes from the server dictionary.
- Duplicate `name="rdm-r"` radio removed; response handler simplified.
- `tsc` failures fixed (dictionary `base()` typing, `alphaFor` import, typed-array generics).

## Design-review notes (vs spec)
- Gradient confined to hero glow + graph stroke; live reading sits on solid surface. OK.
- No hearing-safety colour verdicts anywhere. Status uses text + dot. OK.
- Buttons ≥44px; panels 12–14px radius; max-width 1120px; 16/24/32px gutters. OK.
- Motion limited to 150–220ms opacity; `prefers-reduced-motion` disables. OK.

## Prompt 2 additions (code-verified, not browser-rendered)
- dist HTML verified: no `favicon.ico` reference, no header tagline, `lang-menu` with 8
  locales + checkmark, `rdm-led` (24 segs) + `rdm-spec` (10 bands) + `data-reveal` present.
- Resume ships `hidden` in SSR; screenshots showing otherwise = stale dev server (restart + hard refresh).
- Browser render checks for the new animations remain **pending** (no tooling available).
- Motion now allows two slow 2.4s ambient pulses (live glow, idle Start); all else ≤220ms.

## Pending (needs browser)
Render 320×800, 390×844, 768×1024, 1440×900 in both themes; exercise Start → pause →
resume → stop → reset, denied/busy/no-device paths (via permission mocks), locale pages,
and 404. Record screenshots before claiming responsive QA is complete.

## Prompt 3 additions (code- and dist-verified, not browser-rendered)

Negative-dB fix: uncalibrated main meter is `-- dBA` + `Calibration required` + 0–100%
input-strength visual + CTA (verified: `dB (estimated)` 0 hits in `dist/index.html`,
`rdm-led` removed, `dB SPL (est.)` 0 hits). Calibrated path shows weighting-carried
`dBA/dBC/dBZ` from `rawDbfs + offset` only (engine unit tests assert the identity and
that stored raw stays negative); digital negatives appear solely in Customize →
Digital Input with the `Digital signal — normally negative` note; no `Leq` label
anywhere near raw dBFS (stats/history use `Digital energy average`/`Digital peak`/
`Energy average`/`Avg Δ` as appropriate); no `Math.abs`/clamp/sign-strip on displayed dB.

Controls: Start opens no popup (direct `engine.start()`); Customize is the sole options
opener (modal: Calibrate / Digital / Relative / Microphone / A-C-Z / Fast-Slow);
transport sets are mutually exclusive per state (`hidden`-toggled groups; verified in
source, not yet clicked in a browser). `stop()` disposes capture (mic released;
covered by the Start → Stop → Start single-stream test). Single rAF loop guarded by
`rafId`, cancelled on idle/stopped/error/pagehide; DSP quanta arrive via subscription
independently of frame rate; exports are built from unsmoothed engine values only.

Layout risk review (no overflow expected, not rendered): gauge `min(100%, 420px)`
SVG viewBox scaling, modal `min(100%, 640px)`, stats `minmax(0, 1fr)` grid, strength
`max-width: 420px`, `overflow-x: hidden` on body, `overflow: hidden` meter wrap.
Reduced-motion disables interpolation, pulses, edge animation and modal transitions
(both CSS and the JS `REDUCED` fast path); mobile drops blur/glow/edge animation.
New i18n strings are English-fallback in de/it/ja/es/fr/pt/ko (same pending status as
FAQ translation). Browser render checks for all of the above remain **pending**.
