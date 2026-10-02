# realdecibelmeter.com: SEO pass 2 (for Nemotron 3 Ultra)

Paste everything below this line into the coding agent.

---

## ROLE AND GOAL
You are a senior technical SEO engineer editing my Astro project for **realdecibelmeter.com**, a free browser-based decibel meter. English is at the root; other languages are in /de /fr /es /it /pt /ja /ko.
Goal: more Google clicks in 90 days, starting with the pages already close to page 1, then the head term "decibel meter" (US, about 60k searches a month). The basic SEO is already done. Do NOT redo it. Only change what is listed below.

## HARD RULES
- Never change URL slugs, never delete pages, never add dependencies, never touch AdSense code.
- No fake reviews, ratings, statistics, credentials or accuracy claims. This is an uncalibrated phone/laptop mic tool; say so honestly wherever accuracy is mentioned.
- No hidden text, no keyword stuffing, no mention of competitor sites on the pages.
- Non-English text must read as native, natural phrasing, not literal translation.
- If unsure, flag it in the report instead of guessing.

## CREDIT RULES (I have a limited balance)
- Write a plan of at most 10 lines, then act. Do not restate this prompt or the data back to me.
- Find things with ripgrep; read only matching files or line ranges. Never dump the whole repo or whole large files.
- One edit per file where possible. Minimal diffs. Do not regenerate whole pages or components.
- Use low reasoning effort for repetitive text edits (titles, meta, links). Use full reasoning only for the plan and for T3.
- If the same error happens twice, stop and report it. Do not loop.
- Run `astro build` once at the end of each part, not after every edit.

## DATA (first 10 days, Google Search Console 17 to 29 Sep 2026, plus OpenRush)
Totals: 5 clicks, 614 impressions, about 0.8% CTR. Impressions rose from 4 (19 Sep) to 143 (28 Sep): early indexing phase, positions will swing.
Devices: mobile 228 impressions at avg position 11.7 (all 5 clicks); desktop 384 impressions at avg position 29.3 (0 clicks).
Countries by impressions: Germany 96, United States 89 (avg pos 39.6), Brazil 67 (pos 11), Spain 57 (pos 49), Japan 55, Italy 38, India 30 (2 clicks, pos 6.7), France 26.

**Striking-distance pages (rewrite title, meta, H1 first)**
| URL | Impr | Avg pos | Query signals (use this wording) |
|---|---|---|---|
| /de/handy-dezibel-messen/ | 35 | 10.1 | lautstärke messen mit handy (kostenlos), dezibel messen iphone ohne app |
| /de/db-vs-dba/ | 48 | 12.1 | unterschied db und dba, db dba unterschied |
| /pt/tabela-decibeis/ | 38 | 10.0 | tabela de decibeis |
| /pt/decibelimetro-celular/ | 18 | 8.2 | medidor de decibéis online grátis, decibelímetro online grátis |
| /dbfs-vs-db-spl/ | 36 | 12.3 | db spl vs dbfs, dbfs vs db spl |
| /ja/db-vs-dba/ | 24 | 8.8 | db dba 違い, dbとdbaの違い |
| /it/db-vs-dba/ | 15 | 9.9 | differenza tra db e dba |
| / (home) | 19 | 15.5 | decibel meter online, online decibel meter |
| /noise-exposure-calculator/ | 18 | 18.3 | decibel exposure chart, noise dose calculation |

**Weak but valuable (pos 25 to 60):** /sound-level-meter/ (26 impr, pos 40.7), /es/tabla-decibelios/ (38, pos 58), /de/dezibel-tabelle/ (22, pos 51), /db-vs-dba/ EN (20, pos 45.9), /calibration/ (12, pos 41.5), /decibel-chart/ (6, pos 30).
Already top 5 for small queries: "sonomètre en ligne" (pos 2.7), "tabela de decibeis" (3.3), "fonometro online" (4.3). Protect these pages; touch only if clearly better.
English head terms ("decibel meter online", "online decibel meter") sit at pos 60 to 70.

**OpenRush (US):**
- "decibel meter" is about 60.5k searches a month (variants like "sound meter decibel", "decibel level meter" share that volume). Top results are tool sites plus Play Store, Amazon, Wikipedia, Reddit. An AI Overview is shown.
- Easier targets: "online decibel meter" / "decibel meter online" about 2.9k (low competition); "decibel meter iphone" cluster about 1.6k (low); "free decibel meter" about 1.3k (low); "decibel meter for classroom" about 720 (low).
- "db vs dba" is only about 390 searches a month in the US and has an AI Overview. It is a feeder to the tool, not a traffic goal.
- Competitor referring domains: youlean 1,108; sounddecibelmeter 251; checkhearing 189; realtimesoundmeter 43; decibelpro 22. Our site: 3, all spammy.

## PART A: do now (T1 to T4), then STOP and report

**T1. Canonical and indexing hygiene.**
GSC shows impressions on www and http variants (www /noise-exposure-calculator/, /faq/, /sound-level-meter/, /ja/decibel-chart/, /it/calibrazione/, /fr/calibrage/; http://realdecibelmeter.com/). Make https + non-www the only version:
(a) host-level 301s www to apex and http to https (check netlify.toml, _redirects, vercel.json, Cloudflare or whatever the repo uses);
(b) `site` in astro.config correct; one self-referencing absolute canonical per page;
(c) sitemap lists only canonical 200 URLs;
(d) hreflang: reciprocal, includes x-default, same URL format as canonicals, and never points to a language page that does not exist.

**T2. Titles, meta, H1 for the striking-distance table.**
Title up to 60 characters (CJK up to 30). Meta 120 to 155 characters (CJK up to 80). Put the main query phrase first, in natural native wording, then one real benefit (free, no app, runs in the browser). Unique per page. Keep brand last.

**T3. Stop pages competing with each other.**
Give each page one primary intent: home = "decibel meter online / online decibel meter / free decibel meter" with the working tool visible without scrolling; /sound-level-meter/ = what it is, how it measures, types; /decibel-chart/ = examples and levels; /calibration/ = calibration only. Adjust H1, intro and title to match. Do not merge or move pages.

**T4. Internal links (same-language only).**
Every guide or spoke page gets a clear "open the meter" link to its language's tool page using varied keyword anchors. Each tool page links to its top 5 spokes. Make sure the language switcher uses real crawlable `<a href>` links. Add visible breadcrumbs with BreadcrumbList data.

**Checkpoint:** run `astro build` once. Print the report below and STOP. I will reply "continue" for Part B.

## PART B: only after I say "continue" (T5 to T9)

**T5. Content, at most 2 changes.**
(a) New EN page /decibel-meter-for-classroom/: original, practical content (typical classroom noise levels, where to place the device, limits of a phone mic), linking to the tool. About 600 words, no filler.
(b) Expand the existing /phone-decibel-meter/ with short iPhone and Android sections (permissions, Safari/Chrome tips). Do not create a new page.

**T6. Structured data.** Validate and fix JSON-LD: WebSite, Organization, WebApplication (free, utility category), BreadcrumbList. No FAQPage or HowTo for rich results, no aggregateRating.

**T7. Report only, change nothing:**
(a) list thin or off-topic pages: /tone-generator/, /speaker-test/, /hearing-age-test/, /microphone-noise-floor-test/, /background-noise-test/. I am building a separate site, realtonegenerator.com, so recommend keep, noindex or merge for each;
(b) Norway is a target market but no /no/ URLs appear in GSC: say whether a Norwegian version exists, and do not build one.

**T8. Directory listing copy** in /docs/directory-listing-copy.md (not in src/pages): one 60-character tagline, one 160-character description, one 500-character description, 6 feature bullets, 3 category tags. For SaaSHub and AlternativeTo submissions. Honest claims only.

**T9. /docs/seo-changelog.md:** dated list of every URL changed, so I can compare GSC before and after.

## REPORT FORMAT (maximum 25 lines)
1. Table: file | change | reason (one line each).
2. "Needs my manual action" (Search Console sitemap resubmit, URL Inspection for the 5 most important pages, anything hosting-side).
3. "Flags" (risks, anything you were unsure about).
