# SEO Report — realdecibelmeter.com

Generated: 2026-09-22T06:15:34.287Z
Scope: local build only (**no deploy**). Artifact: `dist/` (52 HTML files, 50 indexable routes).

## Summary

| Check | Result |
|---|---|
| Build (`astro build`) | PASS — 52 pages built |
| Site audit (`npm run audit:site`) | PASS — 50 indexable routes, 50 sitemap URLs; metadata, links, hreflang, JSON-LD, robots, 404 checks |
| Typecheck (`tsc --noEmit`) | PASS |
| Unit tests (`vitest run`) | PASS — 11 files / 147 tests |
| H1 per indexable page | PASS — exactly 1 on all 50 |
| Titles / meta descriptions | PASS — present and unique (per audit) |
| Canonical URLs | PASS — self-referencing `https://realdecibelmeter.com` + trailing slash |
| `<html lang>` | PASS — matches route locale |
| robots meta | PASS — `index, follow` (404/500: `noindex, follow`) |
| Open Graph / Twitter | PASS — og:title/description/url/image + twitter card match title/description |
| hreflang | PASS — reciprocal homepage cluster (`en,de,it,ja,es,fr,pt,ko,x-default`); guide clusters en/de/ja |
| JSON-LD | PASS — valid blocks (WebSite/WebApplication, FAQPage, BreadcrumbList, Article where used) |
| Sitemap | PASS — `sitemap-index.xml` → `sitemap-0.xml`, 50 production URLs; no 404/500/`pages.dev` |
| `robots.txt` | PASS — `Allow: /` + sitemap pointer |
| Internal links | PASS — no broken internal links (audit) |
| English UI leakage on non-EN homepages | PASS — forbidden phrases absent |

Hard issues from this run: **0**

## Soft warnings (not failures)

Titles longer than 60 characters may truncate in SERPs:
- (67) accuracy/ — Browser Decibel-Meter Accuracy and Limitations — Real Decibel Meter
- (61) calibration/ — How to Calibrate a Browser Decibel Meter — Real Decibel Meter
- (64) dbfs-vs-db-spl/ — dBFS vs dB SPL: Why Browser Readings Differ | Real Decibel Meter
- (63) de/mikrofon-funktioniert-nicht/ — Mikrofon funktioniert nicht: Browser-Hilfe | Real Decibel Meter
- (66) frequency-analyzer/ — Frequency Analyzer: Reading the Live Spectrum — Real Decibel Meter
- (61) microphone-noise-floor-test/ — Microphone Noise Floor Test – 30 Seconds | Real Decibel Meter
- (71) noise-exposure/ — Noise Exposure: Level, Duration and Hearing Safety — Real Decibel Meter
- (63) speaker-test/ — Speaker Test: Channels, Polarity and Sweep — Real Decibel Meter
- (71) validation/ — Validation Protocol for Browser Sound Measurements — Real Decibel Meter

## H1 tags by language

### English (/) — 28 page(s)

| Route | H1 | Title | H1 count |
|---|---|---|---|
| / | Online Decibel Meter – Measure Sound Level in Your Browser | Free Online Decibel Meter – Measure Sound in Browser | 1 |
| /about/ | About Real Decibel Meter | About Real Decibel Meter | 1 |
| /accuracy/ | Browser Decibel-Meter Accuracy and Limitations | Browser Decibel-Meter Accuracy and Limitations — Real Decibel Meter | 1 |
| /background-noise-test/ | Background Noise Test | Background Noise Test in Your Browser \| Real Decibel Meter | 1 |
| /calibration/ | How to Calibrate a Browser Decibel Meter | How to Calibrate a Browser Decibel Meter — Real Decibel Meter | 1 |
| /contact/ | Contact | Contact — Real Decibel Meter | 1 |
| /db-vs-dba/ | dB vs dBA: Weighting Explained | dB vs dBA: Weighting Explained — Real Decibel Meter | 1 |
| /dbfs-vs-db-spl/ | dBFS vs dB SPL: Why Browser Readings Differ | dBFS vs dB SPL: Why Browser Readings Differ \| Real Decibel Meter | 1 |
| /decibel-chart/ | Decibel Comparison Chart | Decibel Comparison Chart — Real Decibel Meter | 1 |
| /disclaimer/ | Measurement Disclaimer | Measurement Disclaimer — Real Decibel Meter | 1 |
| /editorial-policy/ | Editorial Policy | Editorial Policy — Real Decibel Meter | 1 |
| /faq/ | Frequently Asked Questions | Frequently Asked Questions — Real Decibel Meter | 1 |
| /frequency-analyzer/ | Frequency Analyzer: Reading the Live Spectrum | Frequency Analyzer: Reading the Live Spectrum — Real Decibel Meter | 1 |
| /guides/ | Sound-Measurement Guide Hub | Sound-Measurement Guide Hub — Real Decibel Meter | 1 |
| /hearing-age-test/ | Hearing Age Test | Hearing Age Test — Real Decibel Meter | 1 |
| /how-to-use/ | How to Use the Online Decibel Meter | How to Use the Online Decibel Meter — Real Decibel Meter | 1 |
| /methodology/ | How Browser Sound Measurement Works | How Browser Sound Measurement Works — Real Decibel Meter | 1 |
| /microphone-noise-floor-test/ | Microphone Noise Floor Test | Microphone Noise Floor Test – 30 Seconds \| Real Decibel Meter | 1 |
| /microphone-not-working/ | Microphone Not Working? Fix It | Microphone Not Working? Fix It — Real Decibel Meter | 1 |
| /noise-exposure-calculator/ | Noise Exposure Calculator | Noise Exposure Calculator — Real Decibel Meter | 1 |
| /noise-exposure/ | Noise Exposure: Level, Duration and Hearing Safety | Noise Exposure: Level, Duration and Hearing Safety — Real Decibel Meter | 1 |
| /phone-decibel-meter/ | Using Your Phone as a Decibel Meter | Using Your Phone as a Decibel Meter — Real Decibel Meter | 1 |
| /privacy/ | Microphone and Audio-Processing Privacy | Microphone and Audio-Processing Privacy — Real Decibel Meter | 1 |
| /sound-level-meter/ | What Is a Sound Level Meter? | What Is a Sound Level Meter? — Real Decibel Meter | 1 |
| /speaker-test/ | Speaker Test | Speaker Test: Channels, Polarity and Sweep — Real Decibel Meter | 1 |
| /terms/ | Terms | Terms — Real Decibel Meter | 1 |
| /tone-generator/ | Tone Generator | Browser Tone Generator — Real Decibel Meter | 1 |
| /validation/ | Validation Protocol for Browser Sound Measurements | Validation Protocol for Browser Sound Measurements — Real Decibel Meter | 1 |

### Deutsch (/de/) — 7 page(s)

| Route | H1 | Title | H1 count |
|---|---|---|---|
| /de/ | Dezibelmesser online – Lautstärke im Browser messen | Dezibelmesser Online – Lautstärke im Browser messen | 1 |
| /de/anleitungen/ | Anleitungen zum Online-Dezibelmesser | Anleitungen zum Online-Dezibelmesser \| Real Decibel Meter | 1 |
| /de/db-vs-dba/ | dB und dBA: Was ist der Unterschied? | dB und dBA: Was ist der Unterschied? \| Real Decibel Meter | 1 |
| /de/dezibel-tabelle/ | Dezibel-Tabelle: Lautstärke im Alltag | Dezibel-Tabelle: Lautstärke im Alltag \| Real Decibel Meter | 1 |
| /de/genauigkeit/ | Wie genau ist ein Online-Dezibelmesser? | Wie genau ist ein Online-Dezibelmesser? \| Real Decibel Meter | 1 |
| /de/kalibrierung/ | Online-Dezibelmesser kalibrieren | Online-Dezibelmesser kalibrieren \| Real Decibel Meter | 1 |
| /de/mikrofon-funktioniert-nicht/ | Mikrofon funktioniert nicht: Browser-Hilfe | Mikrofon funktioniert nicht: Browser-Hilfe \| Real Decibel Meter | 1 |

### Italiano (/it/) — 1 page(s)

| Route | H1 | Title | H1 count |
|---|---|---|---|
| /it/ | Fonometro online – Misura i decibel nel browser | Fonometro Online Gratis – Misura i Decibel nel Browser | 1 |

### 日本語 (/ja/) — 10 page(s)

| Route | H1 | Title | H1 count |
|---|---|---|---|
| /ja/ | オンライン騒音計 – ブラウザでデシベルを測定 | デシベル測定オンライン – ブラウザで音量を計測 | 1 |
| /ja/accuracy/ | ブラウザのデシベル測定精度と限界 | ブラウザのデシベル測定精度と限界 \| Real Decibel Meter | 1 |
| /ja/calibration/ | オンラインデシベル計の校正方法 | オンラインデシベル計の校正方法 \| Real Decibel Meter | 1 |
| /ja/db-vs-dba/ | dBとdBAの違い – 周波数重み付けを解説 | dBとdBAの違い – 周波数重み付けを解説 \| Real Decibel Meter | 1 |
| /ja/decibel-chart/ | デシベル比較表 – 身近な音の大きさ | デシベル比較表 – 身近な音の大きさ \| Real Decibel Meter | 1 |
| /ja/guides/ | デシベル測定ガイド | デシベル測定ガイド \| Real Decibel Meter | 1 |
| /ja/how-to-use/ | オンラインデシベル計の使い方 | オンラインデシベル計の使い方 \| Real Decibel Meter | 1 |
| /ja/methodology/ | ブラウザ音量測定の仕組み | ブラウザ音量測定の仕組み \| Real Decibel Meter | 1 |
| /ja/microphone-not-working/ | ブラウザでマイクが使えないときの対処法 | ブラウザでマイクが使えないときの対処法 \| Real Decibel Meter | 1 |
| /ja/privacy/ | マイク音声のプライバシー | マイク音声のプライバシー \| Real Decibel Meter | 1 |

### Español (/es/) — 1 page(s)

| Route | H1 | Title | H1 count |
|---|---|---|---|
| /es/ | Sonómetro online – Mide decibelios en tu navegador | Medidor de Decibelios Online – Medir Ruido en el Navegador | 1 |

### Français (/fr/) — 1 page(s)

| Route | H1 | Title | H1 count |
|---|---|---|---|
| /fr/ | Sonomètre en ligne – Mesurez les décibels dans votre navigateur | Sonomètre en Ligne – Mesurer les Décibels en Ligne | 1 |

### Português (/pt/) — 1 page(s)

| Route | H1 | Title | H1 count |
|---|---|---|---|
| /pt/ | Medidor de decibéis online – Meça o som no navegador | Medidor de Decibéis Online – Medir Som no Navegador | 1 |

### 한국어 (/ko/) — 1 page(s)

| Route | H1 | Title | H1 count |
|---|---|---|---|
| /ko/ | 온라인 데시벨 측정기 – 브라우저에서 소음 측정 | 온라인 데시벨 측정기 – 브라우저에서 소음 측정 | 1 |

## Homepage H1 comparison (all 8 languages)

| Lang | Route | H1 |
|---|---|---|
| en | / | Online Decibel Meter – Measure Sound Level in Your Browser |
| de | /de/ | Dezibelmesser online – Lautstärke im Browser messen |
| it | /it/ | Fonometro online – Misura i decibel nel browser |
| ja | /ja/ | オンライン騒音計 – ブラウザでデシベルを測定 |
| es | /es/ | Sonómetro online – Mide decibelios en tu navegador |
| fr | /fr/ | Sonomètre en ligne – Mesurez les décibels dans votre navigateur |
| pt | /pt/ | Medidor de decibéis online – Meça o som no navegador |
| ko | /ko/ | 온라인 데시벨 측정기 – 브라우저에서 소음 측정 |

## Technical SEO config

- `site`: https://realdecibelmeter.com (`trailingSlash: "always"`, `output: "static"`)
- 8 locales: en, de, it, ja, es, fr, pt, ko
- Localized guide clusters: de (6 guides), ja (9 guides); it/es/fr/pt/ko are homepage-only
- Homepage hreflang: full reciprocal cluster including `x-default` → `/`
- `robots.txt`: `User-agent: *` / `Allow: /` / `Sitemap: https://realdecibelmeter.com/sitemap-index.xml`
- 404/500: `noindex, follow`; excluded from sitemap

## Verdict

PASS with cosmetic notes. Local SEO audit is green: 50/50 indexable routes healthy, exactly one H1 per page in every language, unique titles/descriptions, correct canonicals, valid hreflang, sitemap and robots. Follow-up: 9 title(s) exceed 60 characters (truncation risk). No deploy performed.
