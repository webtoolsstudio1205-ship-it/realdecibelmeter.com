# 90-Day SEO Execution Plan — Real Decibel Meter

Prepared: 2026-09-18. Target: improve visibility for the English decibel-meter cluster and Japanese
デシベル測定 / デシベル計測 searches. A top-10 result is an operating target, not a guarantee.

## Project boundary: independent new site

`realdecibelmeter.com` is a new, independent website. It is not replacing or receiving a migration from
`decibelmeter.bond`.

- Do not redirect `.bond` URLs to `.com`.
- Do not submit a Search Console Change of Address.
- Do not copy canonicals, sitemaps, backlinks or ownership signals between the domains.
- Keep separate Search Console and analytics properties.
- Use the supplied `.bond` Search Console figures only as market-research evidence for country, device and query
  prioritization. They are not a performance baseline for the new `.com` site.

### New-site launch gate found on 18 Sep 2026

`https://realdecibelmeter.com/` returned `ERR_NAME_NOT_RESOLVED` in a live browser check. DNS and production
hosting must be connected before the new site can be crawled or ranked. This is a standalone launch task and has
no relationship to the `.bond` domain.

## Days 1–14: launch and index correctly

- Deploy the current production build and confirm the canonical host resolves over HTTPS.
- Test the homepage, `/ja/`, all Japanese guides, `robots.txt`, the sitemap and real 404 responses.
- In Search Console, inspect and request indexing for `/`, `/ja/`, `/ja/guides/`, `/ja/accuracy/`,
  `/ja/calibration/` and `/ja/decibel-chart/` after sitemap submission.
- Record an immutable baseline by page, query, country and device for the new `.com` property.
- Do not rewrite titles repeatedly during initial recrawling; allow Google enough time to process one stable set.

Exit criteria: all 29 canonical URLs discovered, no accidental `noindex`, canonical or hreflang errors, and the
important English/Japanese URLs indexed or in a clear crawl queue.

## Days 15–30: measure discovery and engagement

- Review the new site's Search Console data weekly by page and country. Watch Germany, Italy and Japan separately
  because the independent `.bond` benchmark suggests demand there. Track US impressions even before clicks.
- Group queries by intent: use-now terms, accuracy/calibration questions, dB/dBA education and microphone errors.
- Improve snippets only where impressions are material and CTR is weak. Preserve the page's primary intent.
- Check Core Web Vitals and real-device microphone start success on mobile. The independent benchmark suggests
  mobile demand is important, but the `.com` site must establish its own device baseline.

Exit criteria: clean index coverage, query-to-page mapping with no obvious cannibalization, and a documented set
of pages with impressions but weak CTR or positions 11–30.

## Days 31–60: build evidence, not volume

- Expand only pages that have query evidence. Add original screenshots, measurement workflows or repeatable test
  examples when they genuinely help users.
- Publish at most two strong English supporting resources based on observed queries; avoid dozens of near-duplicate
  keyword pages such as separate “db meter,” “noise meter,” and “sound meter” homepages.
- Have a native Japanese reviewer check terminology and naturalness across the new Japanese cluster before broad
  promotion. Correct language quality before adding more translations.
- Earn relevant citations through useful assets: a transparent methodology, calibration workflow, privacy model,
  or embeddable level-reference resource. Avoid paid link schemes, bulk directory submissions and generated guest
  posts.

Exit criteria: at least one useful, citable asset promoted to relevant acoustics, audio, education or workplace
resources; Japanese copy reviewed; pages 11–30 have targeted improvements tied to query evidence.

## Days 61–90: consolidate winners

- Compare the latest 28 days with the first 28-day baseline by URL, country, device and query cluster.
- For pages approaching page one, strengthen internal links from the homepage and guide hubs using natural anchors.
- Merge overlapping pages within `.com` only when Search Console shows genuine cannibalization; otherwise keep
  stable URLs and distinct intent.
- Build new editorial links directly to `.com` through useful resources and outreach. Do not claim or repoint
  links belonging to the unrelated `.bond` site.
- Keep a changelog so ranking changes can be connected to deployments rather than guessed.

## Scorecard

Track these weekly; do not judge the project on one rank-check screenshot:

| Measure | 90-day direction |
|---|---|
| Valid indexed canonical URLs | Toward all 29 intended URLs |
| New `.com` pages indexed | Toward all 29 intended canonical URLs |
| English homepage US impressions | Establish a 28-day baseline, then grow |
| Japanese clicks and non-brand queries | Establish a 28-day baseline, then grow |
| German and Italian visibility | Establish separate `.com` baselines, then improve |
| Queries in positions 1–10 | Increasing across English and Japanese clusters |
| Mobile Core Web Vitals | Pass; no regression after deploys |
| Relevant referring domains | Steady growth from genuine editorial mentions |

## What will not create reliable rankings

- The exact-match phrase in the domain by itself.
- The `.com` extension by itself.
- Copying competitor paragraphs or keyword repetition.
- FAQ or other structured data that is not visible on the page.
- Publishing many translated pages without native-language quality control.
- Promising a fixed ranking date; Google alone controls indexing and ranking.
