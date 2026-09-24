import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('../dist/', import.meta.url);
const SITE = 'https://realdecibelmeter.com';
const HOMEPAGE_LOCALES = {
  en: '/', de: '/de/', it: '/it/', ja: '/ja/', es: '/es/', fr: '/fr/', pt: '/pt/', ko: '/ko/',
};
const OG_LOCALES = {
  en: 'en_US', de: 'de_DE', it: 'it_IT', ja: 'ja_JP', es: 'es_ES', fr: 'fr_FR', pt: 'pt_BR', ko: 'ko_KR',
};
const SOCIAL_IMAGE = `${SITE}/og-image.png`;
const expected = [
  '/', '/about/', '/accuracy/', '/background-noise-test/', '/calibration/', '/contact/', '/db-vs-dba/', '/dbfs-vs-db-spl/',
  '/de/', '/de/anleitungen/', '/de/kalibrierung/', '/de/genauigkeit/', '/de/dezibel-tabelle/', '/de/db-vs-dba/', '/de/mikrofon-funktioniert-nicht/',
  '/decibel-chart/', '/disclaimer/', '/editorial-policy/', '/es/', '/faq/', '/fr/', '/frequency-analyzer/', '/guides/', '/how-to-use/',
  '/it/', '/it/guide/', '/it/calibrazione/', '/it/accuratezza/', '/it/tabella-decibel/', '/it/db-vs-dba/', '/it/microfono-non-funziona/',
  '/ja/', '/ja/accuracy/', '/ja/calibration/', '/ja/db-vs-dba/',
  '/ja/decibel-chart/', '/ja/guides/', '/ja/how-to-use/', '/ja/methodology/', '/ja/microphone-not-working/', '/ja/privacy/', '/ko/',
  '/methodology/', '/microphone-noise-floor-test/', '/microphone-not-working/', '/noise-exposure/', '/noise-exposure-calculator/', '/phone-decibel-meter/', '/privacy/', '/pt/', '/sound-level-meter/', '/speaker-test/', '/terms/', '/tone-generator/', '/hearing-age-test/', '/validation/',
];

const failures = [];
const fail = (message) => failures.push(message);
const rootPath = ROOT.pathname.replace(/^\/(?:[A-Za-z]:)/, (m) => m.slice(1)).replaceAll('/', sep);
const read = (file) => readFileSync(join(rootPath, file), 'utf8');
const routeFile = (route) => route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
const decode = (value = '') => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const attr = (html, tag, name, value) => {
  const pattern = value
    ? new RegExp(`<${tag}\\b(?=[^>]*\\b${name}=["']${value}["'])[^>]*\\bcontent=["']([^"']*)["'][^>]*>`, 'i')
    : new RegExp(`<${tag}\\b[^>]*\\b${name}=["']([^"']*)["'][^>]*>`, 'i');
  return pattern.exec(html)?.[1];
};
const meta = (html, name) => {
  const tag = new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${name}["'])[^>]*>`, 'i').exec(html)?.[0] ?? '';
  return decode(/content=["']([^"']*)["']/i.exec(tag)?.[1] ?? '');
};
const linkValues = (html, rel) => [...html.matchAll(new RegExp(`<link\\b(?=[^>]*rel=["']${rel}["'])[^>]*>`, 'gi'))].map((match) => ({
  href: decode(/href=["']([^"']*)["']/i.exec(match[0])?.[1] ?? ''),
  hreflang: /hreflang=["']([^"']*)["']/i.exec(match[0])?.[1],
}));

const pages = new Map();
for (const route of expected) {
  const file = routeFile(route);
  try { pages.set(route, read(file)); } catch { fail(`Missing expected route ${route} (${file})`); }
}

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
  if (!title) fail(`${route}: missing title`);
  if (!description) fail(`${route}: missing description`);
  if (title && titles.has(title)) fail(`${route}: duplicate title also used by ${titles.get(title)}`); else titles.set(title, route);
  if (description && descriptions.has(description)) fail(`${route}: duplicate description also used by ${descriptions.get(description)}`); else descriptions.set(description, route);
  if (canonical !== `${SITE}${route}`) fail(`${route}: canonical is ${canonical || 'missing'}`);
  if (canonical?.includes('pages.dev')) fail(`${route}: Pages.dev canonical found`);
  if (lang !== expectedLang) fail(`${route}: html lang ${lang || 'missing'} should be ${expectedLang}`);
  if (!/^index,\s*follow$/i.test(robots)) fail(`${route}: indexable page robots is ${robots || 'missing'}`);
  if (h1Count !== 1) fail(`${route}: expected one H1, found ${h1Count}`);
  if (meta(html, 'og:title') !== title) fail(`${route}: og:title does not match the page title`);
  if (meta(html, 'og:description') !== description) fail(`${route}: og:description does not match the meta description`);
  if (meta(html, 'og:url') !== canonical) fail(`${route}: og:url does not match the canonical URL`);
  if (meta(html, 'og:image') !== SOCIAL_IMAGE) fail(`${route}: missing or incorrect og:image`);
  if (meta(html, 'twitter:card') !== 'summary_large_image') fail(`${route}: twitter:card must be summary_large_image`);
  if (meta(html, 'twitter:title') !== title) fail(`${route}: twitter:title does not match the page title`);
  if (meta(html, 'twitter:description') !== description) fail(`${route}: twitter:description does not match the meta description`);
  if (meta(html, 'twitter:image') !== SOCIAL_IMAGE) fail(`${route}: missing or incorrect twitter:image`);
  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(script[1]); } catch (error) { fail(`${route}: invalid JSON-LD (${error.message})`); }
  }
}

const routeForAbsolute = (url) => {
  try { const parsed = new URL(url, SITE); return parsed.origin === SITE ? parsed.pathname : null; } catch { return null; }
};
for (const [route, html] of pages) {
  const withoutScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
  for (const match of withoutScripts.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    const raw = decode(match[1]);
    if (/^(?:mailto:|tel:|javascript:|#)/i.test(raw)) continue;
    const pathname = routeForAbsolute(raw);
    if (!pathname) continue;
    const normalized = pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
    if (!pages.has(normalized) && !['/404/', '/500/'].includes(normalized)) fail(`${route}: broken internal link ${raw}`);
  }
}

const expectedHomepageAlternates = {
  ...Object.fromEntries(Object.entries(HOMEPAGE_LOCALES).map(([language, path]) => [language, `${SITE}${path}`])),
  'x-default': `${SITE}/`,
};
for (const [locale, route] of Object.entries(HOMEPAGE_LOCALES)) {
  const html = pages.get(route);
  const alternates = linkValues(html, 'alternate');
  const byLanguage = new Map();
  for (const alternate of alternates) {
    if (!alternate.hreflang) continue;
    if (byLanguage.has(alternate.hreflang)) fail(`${route}: duplicate hreflang ${alternate.hreflang}`);
    byLanguage.set(alternate.hreflang, alternate.href);
  }
  for (const [language, href] of Object.entries(expectedHomepageAlternates)) {
    if (byLanguage.get(language) !== href) fail(`${route}: hreflang ${language} should point to ${href}`);
  }
  if (byLanguage.size !== Object.keys(expectedHomepageAlternates).length) fail(`${route}: homepage hreflang cluster contains unexpected entries`);
  if (meta(html, 'og:locale') !== OG_LOCALES[locale]) fail(`${route}: og:locale is incorrect for ${locale}`);
}

for (const [route, html] of pages) {
  for (const alt of linkValues(html, 'alternate')) {
    if (!alt.hreflang || alt.hreflang === 'x-default') continue;
    const target = routeForAbsolute(alt.href);
    if (!target) { fail(`${route}: hreflang points off-site (${alt.href})`); continue; }
    const normalized = target === '/' ? '/' : `${target.replace(/\/+$/, '')}/`;
    const targetHtml = pages.get(normalized);
    if (!targetHtml) { fail(`${route}: hreflang target missing (${alt.href})`); continue; }
    const reciprocal = linkValues(targetHtml, 'alternate').some((item) => item.href === `${SITE}${route}`);
    if (!reciprocal) fail(`${route}: hreflang target ${normalized} is not reciprocal`);
  }
}

const sitemapIndex = read('sitemap-index.xml');
const sitemap = read('sitemap-0.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
if (!sitemapIndex.includes(`${SITE}/sitemap-0.xml`)) fail('sitemap-index.xml does not reference the production sitemap');
for (const url of sitemapUrls) {
  if (!url.startsWith(`${SITE}/`)) fail(`Sitemap contains non-production URL ${url}`);
  const route = new URL(url).pathname;
  if (!pages.has(route)) fail(`Sitemap URL has no generated indexable page: ${url}`);
}
for (const route of expected) if (!sitemapUrls.includes(`${SITE}${route}`)) fail(`Indexable route missing from sitemap: ${route}`);

const robots = read('robots.txt');
if (!/User-agent:\s*\*/i.test(robots) || !/Allow:\s*\//i.test(robots) || !robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`)) fail('robots.txt is missing required production directives');
const redirects = read('_redirects');
if (!/^\/sitemap\.xml\s+\/sitemap-index\.xml\s+301\s*$/m.test(redirects)) fail('Safe sitemap redirect is missing');
const notFound = read('404.html');
if (!/^noindex,\s*follow$/i.test(meta(notFound, 'robots'))) fail('404 page must remain noindex, follow');
if (sitemap.includes('/404') || sitemap.includes('/500') || sitemap.includes('pages.dev')) fail('Sitemap contains an excluded or preview URL');

const forbidden = ['Microphone Input Strength', 'Current Strength', 'Average Strength', 'Peak Strength', 'Measurement quality', 'Browser processing', 'Active duration', 'Processing gaps', 'Last calibration', 'Reference capture', 'Digital Diagnostics', 'No baseline captured', 'Capture baseline'];
for (const locale of ['de','it','ja','es','fr','pt','ko']) {
  const visible = pages.get(`/${locale}/`).replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  for (const phrase of forbidden) if (visible.includes(phrase)) fail(`/${locale}/: English interface leakage “${phrase}”`);
}

if (failures.length) {
  console.error(`Site audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Site audit passed: ${pages.size} indexable routes, ${sitemapUrls.length} sitemap URLs, metadata, links, hreflang, JSON-LD, robots and 404 checks.`);
