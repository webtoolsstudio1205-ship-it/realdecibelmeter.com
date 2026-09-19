import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('../dist/', import.meta.url);
const SITE = 'https://realdecibelmeter.com';
const expected = [
  '/', '/about/', '/accuracy/', '/background-noise-test/', '/calibration/', '/contact/', '/db-vs-dba/', '/dbfs-vs-db-spl/',
  '/de/', '/de/anleitungen/', '/de/kalibrierung/', '/de/genauigkeit/', '/de/dezibel-tabelle/', '/de/db-vs-dba/', '/de/mikrofon-funktioniert-nicht/',
  '/decibel-chart/', '/es/', '/fr/', '/guides/', '/how-to-use/', '/it/', '/ja/', '/ja/accuracy/', '/ja/calibration/', '/ja/db-vs-dba/',
  '/ja/decibel-chart/', '/ja/guides/', '/ja/how-to-use/', '/ja/methodology/', '/ja/microphone-not-working/', '/ja/privacy/', '/ko/',
  '/methodology/', '/microphone-noise-floor-test/', '/microphone-not-working/', '/privacy/', '/pt/', '/terms/',
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
