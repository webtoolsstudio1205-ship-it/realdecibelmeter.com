# SEO QA — Real Decibel Meter

Executed: 2026-09-16. All checks below were run; results recorded honestly.

## Baseline (before changes)

- Tests: 55/55 pass. Build: 20 pages, pass.
- `astro.config.mjs` had no `site`, no `trailingSlash`, no sitemap integration → no sitemap, weak canonical base.
- No `public/robots.txt`.
- Layout: canonical only; no hreflang, no robots meta, no JSON-LD, no OG locale/image-alt/twitter tags.
- Homepage H1 was marketing copy ("Measure Sound / Instantly"), not the target keyword; no FAQ/Article schema.
- All 7 locale H1s were English ("Online Decibel Meter"); all locale FAQs were English copies.
- Meter customize/panel strings untranslated in 7 locales.
- Guide pages thin (accuracy ~3 paragraphs, calibration stale ±40 dB note vs ±120 engine, chart without
  approximate-marking/caveats, methodology without refs, contact leaked internal `docs/BUILD-STATE.md` path).
- 404 canonicalized to `/404/` (non-canonical URL) without noindex.
- No `/guides/` hub; footer/nav pointed at `/how-to-use/` as guides entry.
- Language switcher on guide pages linked to non-existent equivalents (`/de/about/` etc.) → broken internal links.
- No automated SEO checks.

## Internal URL inventory (post-change state)

| URL | Lang | Title | H1 | Canonical | Indexability | Primary intent |
|---|---|---|---|---|---|---|
| `/` | en | Online Decibel Meter – Measure Sound in Your Browser | Online Decibel Meter | https://realdecibelmeter.com/ | index | online decibel meter |
| `/de/` | de | Dezibelmesser Online – Lautstärke im Browser messen | Dezibelmesser Online | https://realdecibelmeter.com/de/ | index | dezibelmesser online |
| `/it/` | it | Fonometro Online Gratis – Misura i Decibel nel Browser | Fonometro Online | https://realdecibelmeter.com/it/ | index | fonometro online |
| `/ja/` | ja | デシベル測定オンライン – ブラウザで音量を計測 | オンラインデシベル測定 | https://realdecibelmeter.com/ja/ | index | デシベル測定/計測 |
| `/es/` | es | Medidor de Decibelios Online – Medir Ruido en el Navegador | Medidor de Decibelios Online | https://realdecibelmeter.com/es/ | index | medidor de decibelios online |
| `/fr/` | fr | Sonomètre en Ligne – Mesurer les Décibels en Ligne | Sonomètre en Ligne | https://realdecibelmeter.com/fr/ | index | sonomètre en ligne |
| `/pt/` | pt | Medidor de Decibéis Online – Medir Som no Navegador | Medidor de Decibéis Online | https://realdecibelmeter.com/pt/ | index | medidor de decibéis online |
| `/ko/` | ko | 온라인 데시벨 측정기 – 브라우저에서 소음 측정 | 온라인 데시벨 측정기 | https://realdecibelmeter.com/ko/ | index | 온라인 데시벨 측정기 |
| `/methodology/` | en | How Browser Sound Measurement Works — … | How Browser Sound Measurement Works | …/methodology/ | index | how measurement works |
| `/how-to-use/` | en | How to Use the Online Decibel Meter — … | How to Use the Online Decibel Meter | …/how-to-use/ | index | setup steps |
| `/calibration/` | en | How to Calibrate a Browser Decibel Meter — … | How to Calibrate a Browser Decibel Meter | …/calibration/ | index | calibration |
| `/accuracy/` | en | Browser Decibel-Meter Accuracy and Limitations — … | Browser Decibel-Meter Accuracy and Limitations | …/accuracy/ | index | accuracy/limits |
| `/decibel-chart/` | en | Decibel Comparison Chart — … | Decibel Comparison Chart | …/decibel-chart/ | index | level examples |
| `/db-vs-dba/` | en | dB vs dBA: Weighting Explained — … | dB vs dBA: Weighting Explained | …/db-vs-dba/ | index | weighting |
| `/microphone-not-working/` | en | Microphone Not Working? Fix It — … | Microphone Not Working? Fix It | …/microphone-not-working/ | index | troubleshooting |
| `/guides/` | en | Sound-Measurement Guide Hub — … | Sound-Measurement Guide Hub | …/guides/ | index | guide hub |
| `/privacy/` | en | Microphone and Audio-Processing Privacy — … | Microphone and Audio-Processing Privacy | …/privacy/ | index | privacy |
| `/about/` | en | About Real Decibel Meter | About Real Decibel Meter | …/about/ | index | trust |
| `/contact/` | en | Contact — Real Decibel Meter | Contact | …/contact/ | index | contact |
| `/terms/` | en | Terms — Real Decibel Meter | Terms | …/terms/ | index | terms |
| `/404.html` | en | Page not found — … | Page not found | (none; noindex) | noindex, follow | error recovery |

Internal links in/out per URL are defined in `docs/KEYWORD-MAP.md`. Content status: all rows rewritten or
materially expanded in this pass except `/terms/` (light touch only).

## Validation results (after changes)

1. Unique titles — PASS (20/20 unique in `dist`; automated in `seo.test.ts`).
2. One H1 per indexable page — PASS (20/20 exactly one; automated).
3. Unique canonicals — PASS (20/20 unique; automated).
4. Canonical origin `https://realdecibelmeter.com` — PASS (all; automated).
5. No `decibelmeter.bond`/localhost/preview canonicals — PASS (grep + automated).
6. Correct `lang` per locale — PASS (`en/de/it/ja/es/fr/pt/ko`; automated).
7. Reciprocal hreflang — PASS (9 tags on all 8 homepages incl. self; automated).
8. `x-default` → English homepage — PASS (automated).
9. Localized pages not canonicalized to English — PASS (self-referencing; automated).
10. Sitemap only canonical indexable URLs — PASS (20 URLs, no `/404`, all HTTPS; build log + script check).
11. No HTTP/localhost/preview sitemap URLs — PASS.
12. Robots allows important pages/assets — PASS (`Allow: /`, sitemap pointer, no guide disallows).
13. JSON-LD parses — PASS (all blocks `JSON.parse` clean; automated).
14. Schema matches visible content — PASS (names/URLs/descriptions/FAQ copied from rendered strings; manual review).
15. No broken internal links — PASS (0 failures across 20 pages after switcher fix; script check).
16. No orphaned indexable pages — PASS (every URL reachable: home/nav/footer/hub/switcher; manual trace).
17. Image alt + dimensions — PASS (no `<img>` tags; all graphics inline SVG with aria labels + explicit sizes).
18. Key content in rendered HTML — PASS (H1/intro/steps/FAQ/guides server-rendered; meter needs mic by design).
19. No unsupported accuracy claims — PASS (no 100%/professional-grade/lab-accuracy/compliance claims; automated + grep).
20. No accidental English in localized main content — PASS for landing copy/FAQ/meter chrome (initial HTML);
    LIMITATION: runtime calibration-modal/diagnostics/error strings remain English-first (documented below).
21. Production build — PASS (21 pages incl. 404, sitemap-index.xml emitted).

- Tests: `npx tsc --noEmit` PASS; `npm test` 72/72 PASS (55 pre-existing + 17 new SEO tests).
- `npm run build` PASS (21 pages).

## Known remaining limitations

- Interactive meter internals (calibration capture workflow, digital diagnostics, error recovery sentences,
  spectrum/graph runtime labels from `presentation.ts`) render English at runtime on all locales.
  Crawlable landing content is fully localized; full app-chrome translation needs a follow-up i18n pass
  (new dict keys + runtime wiring) without touching DSP logic.
- Guide pages are English-only; hreflang covers homepages until professional guide translation exists.
- OG image is SVG (`og-image.svg`); if any platform requires raster PNG, render one from the SVG source
  (not done here — no tooling run in this pass).
- Sitemap `lastmod` values come from file mtimes via the integration; all guide pages carry a visible
  "Last materially reviewed: 2026-09-16" date that matches this change.
- Rankings/traffic impact can only be assessed with future Search Console data (see SEO-STRATEGY §7).

## 2026-09-16 re-verification
- `seo_check.mjs` against fresh `dist/`: `/`, `/de/`, `/ja/` each have one title, one H1,
  one HTTPS canonical, correct `lang`, 9 head hreflangs, parseable JSON-LD, zero bad URLs;
  `/404.html` is noindex with canonical `/`; sitemap-index lists 20 canonical HTTPS URLs;
  robots valid. `seo.test.ts` 17/17 pass; full suite 89/89.

## 2026-09-16 pass (this session)
- `dist/500.html` added and verified like the 404 page (one H1, noindex, single non-self
  canonical, recovery links); sitemap filter excludes `/404` and `/500` (20 URLs, verified).
  `seo.test.ts` 18/18; full suite 91/91.
