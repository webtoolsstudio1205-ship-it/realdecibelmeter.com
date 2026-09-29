import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';

const ROOT = new URL('../dist/', import.meta.url);
const SITE = 'https://realdecibelmeter.com';
const HOMEPAGE_LOCALES = {
  en: '/', de: '/de/', it: '/it/', ja: '/ja/', es: '/es/', fr: '/fr/', pt: '/pt/', ko: '/ko/',
};
const OG_LOCALES = {
  en: 'en_US', de: 'de_DE', it: 'it_IT', ja: 'ja_JP', es: 'es_ES', fr: 'fr_FR', pt: 'pt_BR', ko: 'ko_KR',
};
const SOCIAL_IMAGE = `${SITE}/og-image.png`;

// ---------------------------------------------------------------------------
// Route inventory (single source of truth for the audit)
// INDEXABLE: exactly what the sitemap must contain (88 URLs, prod build).
// NOINDEX: legal/utility pages that exist in dist with `noindex, follow`
// and are excluded from the sitemap (see isNoindexPath in src/lib/seo.ts
// and sitemapInclude in astro.config.mjs — the two lists must mirror it).
// ---------------------------------------------------------------------------
const INDEXABLE = [
  '/', '/accuracy/', '/background-noise-test/', '/calibration/', '/db-vs-dba/', '/dbfs-vs-db-spl/',
  '/de/', '/de/anleitungen/', '/de/db-vs-dba/', '/de/dezibel-tabelle/', '/de/genauigkeit/',
  '/de/handy-dezibel-messen/', '/de/kalibrierung/', '/de/mikrofon-funktioniert-nicht/',
  '/decibel-chart/',
  '/es/', '/es/calibracion/', '/es/como-usar/', '/es/db-vs-dba/', '/es/guias/', '/es/metodologia/',
  '/es/microfono-no-funciona/', '/es/movil-decibelimetro/', '/es/precision/', '/es/tabla-decibelios/',
  '/faq/',
  '/fr/', '/fr/calibrage/', '/fr/db-vs-dba/', '/fr/guides/', '/fr/methodologie/',
  '/fr/microphone-ne-fonctionne-pas/', '/fr/mode-emploi/', '/fr/precision/',
  '/fr/sonometre-telephone/', '/fr/tableau-decibels/',
  '/frequency-analyzer/', '/guides/', '/hearing-age-test/', '/how-to-use/', '/iphone-decibel-meter/',
  '/it/', '/it/accuratezza/', '/it/calibrazione/', '/it/db-vs-dba/', '/it/guide/',
  '/it/microfono-non-funziona/', '/it/tabella-decibel/',
  '/ja/', '/ja/accuracy/', '/ja/calibration/', '/ja/db-vs-dba/', '/ja/decibel-chart/',
  '/ja/guides/', '/ja/how-to-use/', '/ja/methodology/', '/ja/microphone-not-working/',
  '/ja/noise-meter-app/',
  '/ko/', '/ko/accuracy/', '/ko/calibration/', '/ko/db-vs-dba/', '/ko/decibel-chart/',
  '/ko/guides/', '/ko/how-to-use/', '/ko/methodology/', '/ko/microphone-not-working/',
  '/ko/noise-meter-app/',
  '/methodology/', '/microphone-noise-floor-test/', '/microphone-not-working/',
  '/noise-exposure/', '/noise-exposure-calculator/', '/phone-decibel-meter/',
  '/pt/', '/pt/calibracao/', '/pt/como-usar/', '/pt/db-vs-dba/', '/pt/decibelimetro-celular/',
  '/pt/guias/', '/pt/metodologia/', '/pt/microfone-nao-funciona/', '/pt/precisao/',
  '/pt/tabela-decibeis/',
  '/sound-level-meter/', '/speaker-test/', '/tone-generator/', '/validation/',
];

const NOINDEX = [
  '/about/', '/contact/', '/privacy/', '/terms/', '/disclaimer/', '/editorial-policy/',
  '/es/privacidad/', '/fr/confidentialite/', '/pt/privacidade/', '/ja/privacy/', '/ko/privacy/',
];

const ERROR_ROUTES = ['/404/', '/500/'];
const KNOWN = new Set([...INDEXABLE, ...NOINDEX, ...ERROR_ROUTES]);

// ---------------------------------------------------------------------------
// Scored gates: every check contributes passed/total to one gate.
// Gate score = round(100 * passed / total). Total = weighted sum (weights=100).
// ---------------------------------------------------------------------------
const GATES = {
  metadata: { weight: 20, passed: 0, total: 0, failures: [] },
  links: { weight: 15, passed: 0, total: 0, failures: [] },
  hreflang: { weight: 15, passed: 0, total: 0, failures: [] },
  sitemap: { weight: 15, passed: 0, total: 0, failures: [] },
  crawl: { weight: 10, passed: 0, total: 0, failures: [] },
  structured: { weight: 10, passed: 0, total: 0, failures: [] },
  localization: { weight: 5, passed: 0, total: 0, failures: [] },
  lighthouse: { weight: 10, passed: 0, total: 0, failures: [] },
};

const check = (gate, ok, message) => {
  GATES[gate].total += 1;
  if (ok) GATES[gate].passed += 1;
  else GATES[gate].failures.push(message);
};

const rootPath = ROOT.pathname.replace(/^\/(?:[A-Za-z]:)/, (m) => m.slice(1)).replaceAll('/', sep);
const read = (file) => readFileSync(join(rootPath, file), 'utf8');
const routeFile = (route) => route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
const decode = (value = '') => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const meta = (html, name) => {
  const tag = new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${name}["'])[^>]*>`, 'i').exec(html)?.[0] ?? '';
  return decode(/content=["']([^"']*)["']/i.exec(tag)?.[1] ?? '');
};
const linkValues = (html, rel) => [...html.matchAll(new RegExp(`<link\\b(?=[^>]*rel=["']${rel}["'])[^>]*>`, 'gi'))].map((match) => ({
  href: decode(/href=["']([^"']*)["']/i.exec(match[0])?.[1] ?? ''),
  hreflang: /hreflang=["']([^"']*)["']/i.exec(match[0])?.[1],
}));

// --- Load pages ------------------------------------------------------------
const pages = new Map(); // indexable route -> html
for (const route of INDEXABLE) {
  const file = routeFile(route);
  try { pages.set(route, read(file)); }
  catch { check('metadata', false, `Missing expected indexable route ${route} (${file})`); }
}
const noindexPages = new Map(); // noindex route -> html
for (const route of NOINDEX) {
  const file = routeFile(route);
  try { noindexPages.set(route, read(file)); }
  catch { check('metadata', false, `Missing expected noindex route ${route} (${file})`); }
}
const allPages = new Map([...pages, ...noindexPages]);

// --- Metadata: indexable pages must be index,follow with full head ----------
const titles = new Map();
const descriptions = new Map();
for (const [route, html] of pages) {
  const title = decode(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? '');
  const description = meta(html, 'description');
  const canonical = linkValues(html, 'canonical')[0]?.href;
  const lang = /<html\b[^>]*lang=["']([^"']+)["']/i.exec(html)?.[1];
  const expectedLang = /^\/(de|it|ja|es|fr|pt|ko)(?:\/|$)/.exec(route)?.[1] ?? 'en';
  const robots = meta(html, 'robots');
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;

  check('metadata', !!title, `${route}: missing title`);
  check('metadata', !!description, `${route}: missing description`);
  if (title) {
    check('metadata', !titles.has(title), `${route}: duplicate title also used by ${titles.get(title)}`);
    if (!titles.has(title)) titles.set(title, route);
  }
  if (description) {
    check('metadata', !descriptions.has(description), `${route}: duplicate description also used by ${descriptions.get(description)}`);
    if (!descriptions.has(description)) descriptions.set(description, route);
  }
  check('metadata', canonical === `${SITE}${route}`, `${route}: canonical is ${canonical || 'missing'}`);
  check('metadata', !canonical?.includes('pages.dev'), `${route}: Pages.dev canonical found`);
  check('metadata', lang === expectedLang, `${route}: html lang ${lang || 'missing'} should be ${expectedLang}`);
  check('metadata', /^index,\s*follow$/i.test(robots), `${route}: indexable page robots is ${robots || 'missing'}`);
  check('metadata', h1Count === 1, `${route}: expected one H1, found ${h1Count}`);
  check('metadata', meta(html, 'og:title') === title, `${route}: og:title does not match the page title`);
  check('metadata', meta(html, 'og:description') === description, `${route}: og:description does not match the meta description`);
  check('metadata', meta(html, 'og:url') === canonical, `${route}: og:url does not match the canonical URL`);
  check('metadata', meta(html, 'og:image') === SOCIAL_IMAGE, `${route}: missing or incorrect og:image`);
  check('metadata', meta(html, 'twitter:card') === 'summary_large_image', `${route}: twitter:card must be summary_large_image`);
  check('metadata', meta(html, 'twitter:title') === title, `${route}: twitter:title does not match the page title`);
  check('metadata', meta(html, 'twitter:description') === description, `${route}: twitter:description does not match the meta description`);
  check('metadata', meta(html, 'twitter:image') === SOCIAL_IMAGE, `${route}: missing or incorrect twitter:image`);
}

// --- Metadata: noindex pages must render noindex,follow + correct canonical --
for (const [route, html] of noindexPages) {
  const title = decode(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? '');
  const description = meta(html, 'description');
  const canonical = linkValues(html, 'canonical')[0]?.href;
  const robots = meta(html, 'robots');
  check('metadata', !!title, `${route}: (noindex) missing title`);
  check('metadata', !!description, `${route}: (noindex) missing description`);
  check('metadata', canonical === `${SITE}${route}`, `${route}: (noindex) canonical is ${canonical || 'missing'}`);
  check('metadata', /^noindex,\s*follow$/i.test(robots), `${route}: noindex page robots is ${robots || 'missing'}`);
  if (title) {
    check('metadata', !titles.has(title), `${route}: duplicate title also used by ${titles.get(title)}`);
    if (!titles.has(title)) titles.set(title, route);
  }
}

// --- Structured data: every JSON-LD block must parse ------------------------
for (const [route, html] of allPages) {
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  check('structured', blocks.length > 0, `${route}: no JSON-LD block found`);
  for (const [i, script] of blocks.entries()) {
    try { JSON.parse(script[1]); check('structured', true, ''); }
    catch (error) { check('structured', false, `${route}: invalid JSON-LD block ${i} (${error.message})`); }
  }
}

// --- Links: no broken internal links (indexable + noindex + error pages) -----
const routeForAbsolute = (url) => {
  try { const parsed = new URL(url, SITE); return parsed.origin === SITE ? parsed.pathname : null; } catch { return null; }
};
for (const [route, html] of allPages) {
  const withoutScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
  let linkCount = 0;
  for (const match of withoutScripts.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    const raw = decode(match[1]);
    if (/^(?:mailto:|tel:|javascript:|#)/i.test(raw)) continue;
    const pathname = routeForAbsolute(raw);
    if (!pathname) continue;
    const normalized = pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
    linkCount += 1;
    check('links', KNOWN.has(normalized), `${route}: broken internal link ${raw}`);
  }
  if (linkCount === 0) check('links', false, `${route}: no crawlable internal links found`);
}

// --- Hreflang: homepage cluster must be exact + reciprocal --------------------
const expectedHomepageAlternates = {
  ...Object.fromEntries(Object.entries(HOMEPAGE_LOCALES).map(([language, path]) => [language, `${SITE}${path}`])),
  'x-default': `${SITE}/`,
};
for (const [locale, route] of Object.entries(HOMEPAGE_LOCALES)) {
  const html = pages.get(route);
  if (!html) { check('hreflang', false, `${route}: homepage HTML missing, cannot verify hreflang`); continue; }
  const alternates = linkValues(html, 'alternate');
  const byLanguage = new Map();
  for (const alternate of alternates) {
    if (!alternate.hreflang) continue;
    check('hreflang', !byLanguage.has(alternate.hreflang), `${route}: duplicate hreflang ${alternate.hreflang}`);
    byLanguage.set(alternate.hreflang, alternate.href);
  }
  for (const [language, href] of Object.entries(expectedHomepageAlternates)) {
    check('hreflang', byLanguage.get(language) === href, `${route}: hreflang ${language} should point to ${href}`);
  }
  check('hreflang', byLanguage.size === Object.keys(expectedHomepageAlternates).length, `${route}: homepage hreflang cluster contains unexpected entries`);
  check('hreflang', meta(html, 'og:locale') === OG_LOCALES[locale], `${route}: og:locale is incorrect for ${locale}`);
}

// --- Hreflang: every alternate target must exist and be reciprocal ------------
for (const [route, html] of allPages) {
  for (const alt of linkValues(html, 'alternate')) {
    if (!alt.hreflang || alt.hreflang === 'x-default') continue;
    const target = routeForAbsolute(alt.href);
    if (!target) { check('hreflang', false, `${route}: hreflang points off-site (${alt.href})`); continue; }
    const normalized = target === '/' ? '/' : `${target.replace(/\/+$/, '')}/`;
    const targetHtml = allPages.get(normalized);
    if (!targetHtml) { check('hreflang', false, `${route}: hreflang target missing (${alt.href})`); continue; }
    check('hreflang', true, '');
    const reciprocal = linkValues(targetHtml, 'alternate').some((item) => item.href === `${SITE}${route}`);
    check('hreflang', reciprocal, `${route}: hreflang target ${normalized} is not reciprocal`);
  }
}

// --- Sitemap: must equal the indexable set exactly -----------------------------
let sitemapUrls = [];
try {
  const sitemapIndex = read('sitemap-index.xml');
  check('sitemap', sitemapIndex.includes(`${SITE}/sitemap-0.xml`), 'sitemap-index.xml does not reference the production sitemap');
  const sitemap = read('sitemap-0.xml');
  sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
  for (const url of sitemapUrls) {
    check('sitemap', url.startsWith(`${SITE}/`), `Sitemap contains non-production URL ${url}`);
    const r = new URL(url).pathname;
    check('sitemap', INDEXABLE.includes(r), `Sitemap URL has no generated indexable page: ${url}`);
  }
  for (const route of INDEXABLE) {
    check('sitemap', sitemapUrls.includes(`${SITE}${route}`), `Indexable route missing from sitemap: ${route}`);
  }
  for (const route of [...NOINDEX, '/404/', '/500/']) {
    check('sitemap', !sitemap.includes(route === '/404/' || route === '/500/' ? route.slice(0, -1) : route) || sitemapUrls.includes(`${SITE}${route}`) === false, `Sitemap must exclude ${route}`);
  }
  check('sitemap', !sitemap.includes('pages.dev'), 'Sitemap contains a preview URL');
} catch (error) {
  check('sitemap', false, `Sitemap files unreadable: ${error.message}`);
}

// --- Crawl: robots.txt, _redirects, 404 -----------------------------------------
try {
  const robots = read('robots.txt');
  check('crawl', /User-agent:\s*\*/i.test(robots), 'robots.txt missing User-agent: *');
  check('crawl', /Allow:\s*\//i.test(robots), 'robots.txt missing Allow: /');
  check('crawl', robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`), 'robots.txt missing production sitemap directive');
} catch (error) {
  check('crawl', false, `robots.txt unreadable: ${error.message}`);
}
try {
  const redirects = read('_redirects');
  check('crawl', /^\/sitemap\.xml\s+\/sitemap-index\.xml\s+301\s*$/m.test(redirects), 'Safe sitemap redirect is missing');
} catch (error) {
  check('crawl', false, `_redirects unreadable: ${error.message}`);
}
try {
  const notFound = read('404.html');
  check('crawl', /^noindex,\s*follow$/i.test(meta(notFound, 'robots')), '404 page must remain noindex, follow');
} catch (error) {
  check('crawl', false, `404.html unreadable: ${error.message}`);
}

// --- Localization: no English interface leakage on locale homes ------------------
const forbidden = ['Microphone Input Strength', 'Current Strength', 'Average Strength', 'Peak Strength', 'Measurement quality', 'Browser processing', 'Active duration', 'Processing gaps', 'Last calibration', 'Reference capture', 'Digital Diagnostics', 'No baseline captured', 'Capture baseline'];
for (const locale of ['de', 'it', 'ja', 'es', 'fr', 'pt', 'ko']) {
  const html = pages.get(`/${locale}/`);
  if (!html) { check('localization', false, `/${locale}/: homepage missing for leakage check`); continue; }
  const visible = html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  let leaked = false;
  for (const phrase of forbidden) {
    if (visible.includes(phrase)) {
      check('localization', false, `/${locale}/: English interface leakage "${phrase}"`);
      leaked = true;
    }
  }
  if (!leaked) check('localization', true, '');
}

// --- Lighthouse prod report (if present): 4 category scores out of 100 ---------
try {
  const lhPath = new URL('../lighthouse-prod-report.json', import.meta.url);
  const lhRoot = lhPath.pathname.replace(/^\/(?:[A-Za-z]:)/, (m) => m.slice(1)).replaceAll('/', sep);
  if (existsSync(lhRoot)) {
    const lh = JSON.parse(readFileSync(lhRoot, 'utf8'));
    for (const [key, label] of [['performance', 'Performance'], ['accessibility', 'Accessibility'], ['best-practices', 'Best Practices'], ['seo', 'SEO']]) {
      const score = lh.categories?.[key]?.score;
      if (typeof score !== 'number') { check('lighthouse', false, `Lighthouse ${label} score missing`); continue; }
      const points = Math.round(score * 100);
      check('lighthouse', points >= 90, `Lighthouse ${label} is ${points}/100 (gate >= 90)`);
    }
  } else {
    check('lighthouse', true, '');
    GATES.lighthouse.total = 0; // mark skipped (no report)
  }
} catch (error) {
  check('lighthouse', false, `Lighthouse report unreadable: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Scorechart out of 100
// ---------------------------------------------------------------------------
const scoreOf = (gate) => (gate.total === 0 ? 100 : Math.round((gate.passed / gate.total) * 100));
const bar = (score) => {
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
};
let weightedSum = 0;
let weightSum = 0;
const rows = [];
for (const [name, gate] of Object.entries(GATES)) {
  if (name === 'lighthouse' && gate.total === 0) continue; // skipped
  const score = scoreOf(gate);
  weightedSum += score * gate.weight;
  weightSum += gate.weight;
  rows.push({ name, score, weight: gate.weight, passed: gate.passed, total: gate.total });
}
const total = weightSum === 0 ? 0 : Math.round(weightedSum / weightSum);

console.log('');
console.log('Site quality scorechart (out of 100)');
console.log('====================================');
for (const row of rows) {
  const label = row.name.padEnd(13, ' ');
  console.log(`${label} ${String(row.score).padStart(3, ' ')}/100 ${bar(row.score)}  (${row.passed}/${row.total} checks, weight ${row.weight})`);
}
console.log('------------------------------------');
console.log(`${'TOTAL'.padEnd(13, ' ')} ${String(total).padStart(3, ' ')}/100 ${bar(total)}`);
console.log('');

const failures = Object.values(GATES).flatMap((g) => g.failures);
const report = {
  total,
  gates: Object.fromEntries(
    Object.entries(GATES).map(([name, g]) => [name, { score: scoreOf(g), passed: g.passed, total: g.total, weight: g.weight }]),
  ),
  failures,
  indexableRoutes: pages.size,
  sitemapUrls: sitemapUrls.length,
};
try {
  const outPath = new URL('../site-audit-scores.json', import.meta.url);
  const outFs = outPath.pathname.replace(/^\/(?:[A-Za-z]:)/, (m) => m.slice(1)).replaceAll('/', sep);
  writeFileSync(outFs, `${JSON.stringify(report, null, 2)}\n`);
  console.log('Scores written to site-audit-scores.json');
} catch { /* stdout is the contract; file is a bonus */ }

if (failures.length) {
  console.error(`Site audit failed with ${failures.length} issue(s):`);
  for (const failure of failures.slice(0, 60)) console.error(`- ${failure}`);
  if (failures.length > 60) console.error(`… and ${failures.length - 60} more (see site-audit-scores.json)`);
  process.exit(1);
}
console.log(`Site audit passed: ${pages.size} indexable routes, ${noindexPages.size} noindex routes, ${sitemapUrls.length} sitemap URLs, metadata, links, hreflang, JSON-LD, robots and 404 checks.`);
