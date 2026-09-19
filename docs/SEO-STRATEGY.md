# SEO Strategy — Real Decibel Meter

Last materially reviewed: 2026-09-18.

## 1. Market benchmark (independent decibelmeter.bond Search Console data, 18 Aug – 12 Sep 2026)

`realdecibelmeter.com` is a new site, not a migration from `decibelmeter.bond`. The figures below are used only
to identify likely countries, devices and search intents. They are not a baseline for `.com`, and no redirects or
Search Console Change of Address should connect the two properties.

- 21 clicks, 1,361 impressions, ~1.54% overall CTR.
- Strongest pages: `/de/` (8 clicks, 530 impressions, pos. 19.44), `/` (8 clicks, 199 impressions, pos. 53.03),
  `/ja/` (3 clicks, 42 impressions, pos. 15.38), `/it/` (1 click, 271 impressions, pos. 12.72).
- Zero-click but indexed: `/es/` (134 impr.), `/fr/` (65), `/pt/` (32), `/ko/` (16), `/tools/` (16).
- Old HTTP homepage drew 85 impressions → canonical protocol consistency is mandatory (all HTTPS).
- Devices: mobile 11 clicks / 610 impr. (pos. 13.28) vs desktop 9 / 738 (pos. 40.71). Mobile already ranks far
  better; keep mobile-first performance and touch targets.
- Countries: Germany (5/320), Italy (1/266), Spain (0/120), US (0/85, pos. 51.74), Switzerland (2/62),
  France (0/61), Japan (3/36), Austria (0/40), Brazil (0/19), South Korea (0/11).
- Competitor keyword estimates supplied for prioritization only (treated as unverified, never published).

### Newer country snapshot supplied 17 Sep 2026

The supplied three-month Search Console screenshot shows: Germany 5 clicks / 329 impressions, Japan 5 / 54,
Italy 2 / 289, Switzerland 2 / 62, Denmark 1 / 1, Spain 0 / 130, United States 0 / 94, France 0 / 64,
and Austria 0 / 40. The screenshot contains rows 1–10 of 71 and does not show totals, so no new global CTR or
position was inferred from it. This reinforces the existing priority order: German and Italian opportunity,
Japanese traction, then US relevance and CTR work.

### Competitor snapshot supplied 17 Sep 2026

Third-party estimates in the supplied screenshots are directional, not verified Search Console data:

- `realtimesoundmeter.org`: US keyword estimates place “decibel meter” and “noise level meter” at position 2,
  “sound level meter” at position 1, and its homepage at about 90% of reported US organic traffic.
- `sounddecibelmeter.com`: Japan is the largest reported country (22%); `/ja/` is shown as about 97% of its
  reported Japanese traffic, with デシベル計測 / デシベル 計測 / デシベル測定 / 音量測定 around positions 1–2.

These numbers are used to choose intent and market coverage only. They are not copied into public page claims.

## 2. Target markets

Primary: United States + international English. Opportunity markets in priority order: Germany, Italy, Japan,
Spain, France, Switzerland/Austria (via `/de/`), Portugal/Brazil (via `/pt/`), South Korea.

## 3. Page priorities (in order)

1. Indexability/canonical/protocol/metadata correctness (done).
2. Sitemap, robots, hreflang, language signals (done).
3. `/it/` — near page one (pos. 12.72), 271 impressions, 0.37% CTR: title/description/intro rewritten, intent kept.
4. `/de/` — largest impression base (530): title/H1/description rewritten, ohne-App + kostenlos addressed naturally.
5. `/ja/` — preserve intent match and connect it to a nine-page Japanese guide cluster covering use,
   methodology, calibration, accuracy, dB/dBA, a level chart, troubleshooting and privacy (implemented 2026-09-18).
6. English homepage + US coverage: topical depth (weighting, calibration, accuracy, privacy), internal links, crawlability.
7. `/es/`, `/fr/` relevance; 8. `/pt/`, `/ko/` pages.
8. Methodology / calibration / accuracy / decibel-chart cluster + `/guides/` hub.
9. Internal linking, structured data, final QA.

## 4. Content strategy

- Tool-first homepage: working meter above long-form content; one H1; one coherent intent
  (microphone input strength now, calibrated dBA/dBC/dBZ after calibration).
- Every indexable page has a distinct intent; no thin keyword pages, no city/device programmatic pages.
- All technical claims describe the real engine (RMS → dBFS → weighting → Fast/Slow → Leq → offset → clamp).
  Unsupported claims banned: 100% accuracy, certified/professional/lab accuracy, IEC/ANSI/OSHA/NIOSH compliance,
  replacement of certified meters, identical results across microphones.
- Authoritative outbound references (concise, no copied wording): W3C Web Audio API, MDN getUserMedia,
  MDN media constraints, CDC/NIOSH noise guidance.
- Honest E-E-A-T: methodology page, accuracy limits, privacy implementation notes, last-reviewed dates,
  about page with real publisher identity, no invented experts/reviews/stats.

## 5. Technical SEO decisions

- Single origin `https://realdecibelmeter.com`; `site` set in `astro.config.mjs`; `trailingSlash: 'always'`.
- Absolute self-referencing canonicals from one Layout component; no localhost/preview/decibelmeter.bond URLs.
- Reciprocal 9-tag hreflang cluster (en/de/it/ja/es/fr/pt/ko + x-default → `/`) on all 8 homepages;
  guide pages carry a self hreflang tag only because there is not yet a complete reciprocal translated set.
- `robots.txt` allows all + points at `sitemap-index.xml`; `@astrojs/sitemap` emits 29 canonical URLs
  (404 excluded by filter).
- 404 page is `noindex, follow` with no self-canonical and links to meter/guides.
- JSON-LD only where it matches visible content: WebSite + WebApplication (homepage cluster),
  Article (guides, with real dates), BreadcrumbList (visible breadcrumbs), FAQPage (visible FAQs only).
- No `noindex` added for poor performance; weak pages were improved, not hidden.

## 6. Internal-link strategy

- Homepage → calibration, accuracy, methodology, decibel chart, dB-vs-dBA, privacy, guide hub, localized alternatives.
- Every guide → working meter (`/#measure`) with natural anchors
  (online decibel meter, calibrate your microphone, browser measurement accuracy, understand decibel levels,
  microphone privacy, sound-level weighting).
- `/guides/` hub → all 8 guides; guides cross-link forward/backward (calibration ↔ accuracy ↔ methodology).
- Language switcher + footer language list keep every locale homepage one `<a href>` away; no IP-based redirects.
- Breadcrumb navigation on nested guides with matching BreadcrumbList schema.

## 7. Measurement plan (requires future Search Console data)

- Track per-locale clicks/impressions/CTR/position for `/`, `/de/`, `/it/`, `/ja/`, `/es/`, `/fr/`, `/pt/`, `/ko/`.
- Watch `/it/` CTR (target: lift from 0.37% at same/similar position) and `/de/` position (target: page one).
- Watch US impressions for `/` (baseline 85, pos. 51.74) after topical expansion.
- Confirm HTTPS canonical uptake (HTTP impressions should decay to ~0).

## 8. Honest limitations

- Competitor volumes/positions are third-party estimates, not facts; no traffic or ranking is guaranteed.
- Browser readings can never be certified; content says so everywhere, which caps conversion of
  compliance-seeking queries by design.
- German, Italian, Spanish, French, Portuguese and Korean guides remain English-only. Japanese now has a
  complete first-party guide cluster; the other locales should only receive guides after native-language review.
- Interactive meter chrome (calibration modal, diagnostics, error recovery) remains English-first at runtime;
  landing content, metadata, H1s and FAQs are fully localized.

## 2026-09-16 re-verification
- Dist output re-checked: `SITE` is the single canonical origin, no decibelmeter.bond/HTTP/localhost/
  preview references, 9-entry reciprocal hreflang cluster with x-default, unique localized titles/
  descriptions/H1s, JSON-LD parses, sitemap lists canonical HTTPS URLs only, robots allows `/` and
  references the sitemap index. Suite: `seo.test.ts` 17/17 pass. No deployment/hosting/DNS work done.

## 2026-09-16 pass (this session)
- Error pages (404/500) are noindex with non-self canonicals and are excluded from the sitemap;
  `seo.test.ts` now 18/18. No deployment/hosting/DNS work done.

## 2026-09-18 Japanese expansion

- Added `/ja/guides/` plus eight Japanese supporting guides; Japanese navigation and homepage cards now link to
  localized destinations rather than English pages.
- Every new URL has a unique Japanese title, description, H1, self-canonical, breadcrumb schema and (where
  applicable) Article schema. The sitemap now contains 29 indexable URLs.
- Added `theme-color` and Twitter image metadata to the shared layout.
- Rankings are not guaranteed. The domain keyword and `.com` TLD are not treated as substitutes for usefulness,
  links, crawl/indexing health or demonstrated user satisfaction.
