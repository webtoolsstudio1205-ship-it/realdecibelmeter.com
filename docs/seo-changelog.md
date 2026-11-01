# SEO Changelog

Dated list of every URL changed, to compare GSC before/after. Build + 183 vitest tests verified green after each batch.

## 2026-11-01 — Pass 2: "a weighted decibel meter" + Blog post & Homepage Backlinks for realtonegenerator.com

Targets SEMrush keyword "a weighted decibel meter" (US Vol: 110, KD: 10% Easy) and establishes natural, contextual dofollow backlinks to https://realtonegenerator.com/.

### New Pages
| URL | Title & Query Focus | Reason |
| --- | --- | --- |
| `/a-weighted-decibel-meter/` | A-Weighted Decibel Meter: What Is dBA & How to Measure Online | Dedicated spoke targeting the low-KD (10%) high-intent query "a weighted decibel meter". Full IEC 61672 frequency curve breakdown, regulatory limits (OSHA, NIOSH), calibration guide. |
| `/blog/` | How to Calibrate an A-Weighted Decibel Meter with Audio Test Tones | Dedicated blog post on audio test tones, 1 kHz sine waves (where A-weighting is 0 dB), speaker checks, and decibel meter calibration. Contains contextual dofollow backlinks to https://realtonegenerator.com/. |

### Changed Pages
- `/` (Main Homepage): In the "What A, C and Z weighting mean" section, integrated direct targeting for "a weighted decibel meter" with link to the new guide. In the calibration section, added a natural editorial dofollow backlink to `https://realtonegenerator.com/` for generating 1 kHz reference sine waves. Guides grid updated with cards for both `/a-weighted-decibel-meter/` and `/blog/`.
- `/guides/` (Guide Hub): Added directory links for `/a-weighted-decibel-meter/` and `/blog/`.
- `/db-vs-dba/`: Added internal cross-link to `/a-weighted-decibel-meter/`.
- `src/lib/seo.ts` & `src/components/Layout.astro`: Registered guide keys and canonical clusters for `a-weighted-decibel-meter` and `blog`.
- `astro.config.mjs`: Added both URLs to sitemap with priority 0.7 weekly.

## 2026-11-01 — Germany & Japan Expansion (6 New Target URLs) + Competitor Optimization

Targets competitor traffic drivers from realtimesoundmeter.org, sounddbmeter.com, and sounddecibelmeter.com:
- Japan top keywords: デシベル計測 (3.9K vol, pos 1), デシベル測定 (2.8K vol, pos 1), 音量測定 (1.6K vol, pos 2), db測定 (900 vol, pos 1), 騒音測定.
- Germany top keywords: Dezibel messen, Schallpegelmesser online, Lärm messen (6.2K vol equiv), Ton Generator / Frequenzgenerator (11K & 4.9K vol competitor drivers).

### 6 New Localized URLs
| URL | Title & Query Focus | Reason / Competitor Signal |
| --- | --- | --- |
| `/de/schallpegelmesser/` | Schallpegelmesser Online: Schallpegel im Browser messen | Targets "schallpegelmesser online", "schallpegel messen". Reciprocal hreflang linked with EN `/sound-level-meter/`. |
| `/de/laerm-messen/` | Lärm messen Online: Lärmpegel mit Handy & PC ermitteln | Targets "lärm messen", "lärmpegel messen" (competitor "noise meter" 6.2K vol equivalent). Includes TA Lärm noise guidelines. |
| `/de/ton-generator/` | Online Ton Generator: Sinuston & Frequenzen testen | Targets "ton generator online", "frequenzgenerator" (11K vol keyword & #2 traffic driver on competitors). Linked with EN `/tone-generator/`. |
| `/ja/onryo-sokutei/` | 音量測定 オンライン – ブラウザでPCやスマホの音量を計測 | Competitor #3 keyword from sounddecibelmeter.com (1.6K volume, rank 2). Targets browser volume measurement. |
| `/ja/db-sokutei/` | dB測定 オンライン – デシベル計測と音圧レベルの確認 | Competitor #4 keyword from sounddecibelmeter.com (900 volume, rank 1) + "デシベル計測" (3.9K volume, rank 1). |
| `/ja/souon-sokutei/` | 騒音測定 オンライン – スマホで生活音・近隣騒音を測定 | Targets "騒音測定" (residential and neighborhood noise measurement in Japan, Environmental Quality Standards). |

### Additional New URLs in this release
- `/ja/decibel-measurement/` (targets "デシベル 測定")
- `/decibel-meter-for-classroom/` (targets "decibel meter for classroom")

### Metadata & Internal Linking Improvements
- `/de/` (German Homepage): Title updated to `Dezibel messen online – Lautstärke & Schallpegel im Browser`. Description enhanced with keyword-first wording. Guides grid updated with `/de/schallpegelmesser/`, `/de/laerm-messen/`, and `/de/ton-generator/`.
- `/ja/` (Japanese Homepage): Title updated to `デシベル計測・測定 オンライン – 音量と騒音を測定`. Meta description broadened with デシベル計測・測定 + 音量・騒音. Guides grid updated with all new Japanese spokes.
- `src/pages/de/[slug].astro` (`/de/anleitungen/`): Hub updated to link to the new German pages.
- `src/pages/ja/[slug].astro` (`/ja/guides/`): Hub updated to link to the new Japanese pages.

## 2026-10-30 — Japan pass "デシベル 測定" + USA ranking pass

### New pages
| URL | Change | Reason |
| --- | --- | --- |
| `/ja/decibel-measurement/` | New HTML: 「デシベル 測定」 head query (dB SPL・dBA, 3-step browser measurement, level targets, smartphone, calibration limits). Article + BreadcrumbList JSON-LD, Article speakable via cluster default, self + x-default→self hreflang, sitemap priority 0.7 weekly. | Japan had no page targeting the broad 「デシベル 測定」 / 「デシベル測定 方法」 query family; existing JA pages target 騒音計アプリ terms only. |
| `/decibel-meter-for-classroom/` | New HTML (~600 words): typical classroom dBA bands, device placement, 3-step check, honest phone-mic limits, FAQ. Article + Breadcrumb JSON-LD with short-answer/key-facts speakable, sitemap priority 0.7 weekly. | Missing Part B item ("decibel meter for classroom", ~720 US searches/mo, low competition). |

### Changed pages
| URL | Change | Reason |
| --- | --- | --- |
| `/ja/` (homepage) | Title → 「デシベル 測定 オンライン – ブラウザで音量・騒音を測定」; description broadened with デシベル測定 + 騒音 wording, still ≤80 CJK and honest. | Query-first title for the exact "デシベル 測定" phrase; CJK title ~24 chars (≤30 rule). |
| `/ja/` (homepage guides grid) | Added card linking to `/ja/decibel-measurement/`. | Internal links (T4): every new spoke needs a link from its language's tool page. |
| `/ja/guides/` | Added list item linking to `/ja/decibel-measurement/` under 数値を理解する. | Same-language internal linking. |
| `/ja/noise-meter-app/` | Added inline link to `/ja/decibel-measurement/` in the デシベル計測とは section. | Same-language internal linking. |
| `/sound-level-meter/` | Title/meta rewritten: "Sound Level Meter Guide: Types, Classes & Online Tools" + tightened US-phrased description; dateModified → 2026-10-30. | Striking-distance page (26 impr, US pos 40.7); query-first rewrite per the T2 rule. |
| `/` (EN homepage) | Guides grid gained a `/decibel-meter-for-classroom/` card. | T4 internal linking for the new US spoke. |
| `/guides/` | Hub list gained the classroom guide card. | T4 internal linking. |
| `/faq/` | "How do I measure classroom noise?" answer now references the classroom guide. | Feeds the new page from the page with the matching Q. |

### Files touched (non-page)
- `src/i18n/dictionaries.ts` — ja metaTitle/metaDescription.
- `src/pages/ja/[slug].astro` — new page entry, per-page `dateModified` support, cross-links.
- `src/lib/seo.ts` — new single-locale `decibel-measurement` hreflang cluster (self + x-default→self).
- `src/components/Layout.astro` — guideKeyByPath mapping for the new JA path (language-menu cross-links).
- `src/pages/[locale]/index.astro` — ja homepage grid card.
- `astro.config.mjs` — sitemap priorities for both new URLs (0.7 weekly).

### Needs manual action
1. Search Console: resubmit sitemap after deploy.
2. Search Console: URL Inspection + "Request indexing" for `/ja/decibel-measurement/` and `/decibel-meter-for-classroom/`.
3. If GSC country filters are configured, confirm Japan filter now counts `/ja/decibel-measurement/` impressions.

### Flags
- `/ja/decibel-measurement/` exists only in Japanese (like `/de/handy-dezibel-messen/` originally). The hreflang cluster is self + x-default→self by design; add EN/other locales later by extending the `decibel-measurement` cluster in `src/lib/seo.ts`.
- The new EN classroom page claims only relative/screening usefulness; no accuracy ratings, no statistics. JP copy kept to natural Japanese phrasing (e.g. 「マイク穴を塞がず」), not literal translations.
- CTR improving on `/sound-level-meter/` will take a few weeks; don't re-edit the title inside that window.
