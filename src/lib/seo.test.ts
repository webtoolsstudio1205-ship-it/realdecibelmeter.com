import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { dicts } from '../i18n/dictionaries';
import {
  SITE,
  canonicalFor,
  homepageHreflang,
  webAppJsonLd,
  faqJsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
} from './seo';

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('seo foundations', () => {
  it('canonicals use https://realdecibelmeter.com', () => {
    expect(SITE).toBe('https://realdecibelmeter.com');
    expect(canonicalFor('/')).toBe('https://realdecibelmeter.com/');
    expect(canonicalFor('/de/')).toBe('https://realdecibelmeter.com/de/');
    expect(canonicalFor('/calibration/')).toBe('https://realdecibelmeter.com/calibration/');
  });

  it('no canonical points to decibelmeter.bond, localhost or preview URLs', () => {
    const layout = read('src/components/Layout.astro');
    expect(layout).not.toMatch(/decibelmeter\.bond/);
    expect(layout).not.toMatch(/localhost/);
    expect(layout).not.toMatch(/http:\/\//);
    expect(layout).toContain('${SITE}${path}');
  });

  it('hreflang cluster is reciprocal with x-default to EN homepage', () => {
    const h = homepageHreflang();
    const codes = h.map((x) => x.hreflang);
    expect(codes).toEqual(['en', 'de', 'it', 'ja', 'es', 'fr', 'pt', 'ko', 'x-default']);
    const byCode = new Map(h.map((x) => [x.hreflang, x.href]));
    expect(byCode.get('x-default')).toBe('https://realdecibelmeter.com/');
    expect(byCode.get('en')).toBe('https://realdecibelmeter.com/');
    for (const [code, href] of byCode) {
      expect(href.startsWith('https://realdecibelmeter.com/')).toBe(true);
      expect(href).not.toContain('http://');
      void code;
    }
  });

  it('every locale has a unique title and description', () => {
    const titles = Object.values(dicts).map((d) => d.metaTitle);
    const descs = Object.values(dicts).map((d) => d.metaDescription);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descs).size).toBe(descs.length);
    for (const t of titles) {
      expect(t.length).toBeGreaterThan(10);
      expect(t.length).toBeLessThanOrEqual(90);
    }
    for (const d of descs) {
      expect(d.length).toBeGreaterThan(40);
      expect(d.length).toBeLessThanOrEqual(320);
    }
  });

  it('every locale has a localized H1 (not all English)', () => {
    const h1s = Object.entries(dicts).map(([k, d]) => `${k}:${d.heroH1}`);
    expect(new Set(h1s).size).toBe(h1s.length);
    expect(dicts.de.heroH1).toContain('Dezibelmesser');
    expect(dicts.it.heroH1).toContain('Fonometro');
    expect(dicts.ja.heroH1).not.toBe('Online Decibel Meter');
    expect(dicts.es.heroH1.toLocaleLowerCase('es')).toContain('decibelios');
    expect(dicts.fr.heroH1).toContain('Sonomètre');
    expect(dicts.pt.heroH1.toLocaleLowerCase('pt')).toContain('decibéis');
    expect(dicts.ko.heroH1).not.toBe('Online Decibel Meter');
  });

  it('localized FAQ answers are translated (no English fallback in non-English locales)', () => {
    const enAnswers = new Set(dicts.en.faq.map((f) => f.a));
    for (const loc of ['de', 'it', 'ja', 'es', 'fr', 'pt', 'ko'] as const) {
      for (const f of dicts[loc].faq) {
        expect(enAnswers.has(f.a)).toBe(false);
      }
      // Language-specific keyword coverage: each locale keeps its own
      // question set (EN/iPhone, DE/Handy, JA/騒音計アプリ, ...), so exact
      // parity with EN is not required — only a healthy minimum.
      expect(dicts[loc].faq.length).toBeGreaterThanOrEqual(5);
    }
    expect(dicts.en.faq.length).toBeGreaterThanOrEqual(13);
  });

  it('no unsupported accuracy claims in metadata or UI strings', () => {
    const banned = [
      '100% accura',
      'professional-grade',
      'laboratory accura',
      'certified measurement',
      'certified sound',
      'IEC ',
      'ANSI',
      'OSHA',
      'NIOSH-approve',
      'guaranteed ranking',
    ];
    const blob = JSON.stringify(dicts);
    for (const b of banned) {
      expect(blob.toLowerCase()).not.toContain(b.toLowerCase());
    }
  });

  it('JSON-LD builders produce parseable blocks matching visible content', () => {
    const web = webAppJsonLd({
      name: 'Online Decibel Meter',
      url: `${SITE}/`,
      description: dicts.en.metaDescription,
      inLanguage: 'en',
    });
    const faq = faqJsonLd(dicts.en.faq);
    const art = articleJsonLd({
      headline: 'Accuracy',
      description: 'desc',
      url: `${SITE}/accuracy/`,
      inLanguage: 'en',
      dateModified: '2026-09-16',
    });
    const bc = breadcrumbJsonLd([{ name: 'Home', url: `${SITE}/` }]);
    for (const block of [web, faq, art, bc]) {
      const round = JSON.parse(JSON.stringify(block));
      expect(round['@context']).toBe('https://schema.org');
    }
    expect(JSON.stringify(web)).toContain(dicts.en.metaDescription);
    expect(JSON.stringify(faq)).toContain(dicts.en.faq[0].q);
  });

  it('robots.txt allows important pages and references the sitemap', () => {
    const robots = read('public/robots.txt');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('https://realdecibelmeter.com/sitemap');
    expect(robots).not.toMatch(/Disallow: \/(calibration|accuracy|decibel-chart|guides)/);
  });

  it('astro config sets canonical site origin and sitemap integration', () => {
    const cfg = read('astro.config.mjs');
    expect(cfg).toContain('https://realdecibelmeter.com');
    expect(cfg).toContain('sitemap');
    expect(cfg).toContain('trailingSlash');
  });

  it('layout renders one canonical, robots meta, hreflang and JSON-LD slots', () => {
    const layout = read('src/components/Layout.astro');
    expect((layout.match(/<link rel="canonical"/g) ?? []).length).toBe(1);
    expect(layout).toContain('meta name="robots"');
    expect(layout).toContain('hreflang');
    expect(layout).toContain('application/ld+json');
    expect(layout).toContain('og:image:alt');
    expect(layout).toContain('<html lang={locale}');
  });

  it('homepage has exactly one H1 and the required H2 structure', () => {
    const home = read('src/pages/index.astro');
    expect((home.match(/<h1/g) ?? []).length).toBe(1);
    for (const h of [
      'Measure sound in your browser',
      'How the online decibel meter works',
      'Understanding your measurement',
      'Calibrating for estimated environmental decibels',
      'What A, C and Z weighting mean',
      'Browser measurement accuracy',
      'Microphone privacy',
      'Common questions',
      'Decibel meter guides',
    ]) {
      expect(home).toContain(h);
    }
  });

  it('internal links use HTTPS-free relative paths and key cross-links exist', () => {
    const home = read('src/pages/index.astro');
    expect(home).toContain('href="/calibration/"');
    expect(home).toContain('href="/accuracy/"');
    expect(home).toContain('href="/methodology/"');
    expect(home).toContain('href="/decibel-chart/"');
    expect(home).toContain('href="/privacy/"');
    expect(home).toContain('href="/guides/"');
    expect(home).not.toMatch(/href="http:\/\//);
    const guides = read('src/pages/guides/index.astro');
    for (const href of ['/how-to-use/', '/methodology/', '/calibration/', '/accuracy/', '/decibel-chart/', '/db-vs-dba/', '/microphone-not-working/', '/privacy/']) {
      expect(guides).toContain(`'${href}'`);
    }
  });

  it('404 page is noindex with helpful links (no canonical to /404/)', () => {
    const p404 = read('src/pages/404.astro');
    expect(p404).toContain('noindex');
    expect(p404).not.toContain('path="/404/"');
    expect(p404).toContain('href="/guides/"');
  });

  it('500 page is noindex with recovery links (no canonical to /500/, excluded from sitemap)', () => {
    const p500 = read('src/pages/500.astro');
    expect(p500).toContain('noindex');
    expect(p500).not.toContain('path="/500/"');
    expect(p500).toContain('href="/guides/"');
    expect(p500).toContain('href="/"');
    expect(p500).toMatch(/<h1/);
    const cfg = read('astro.config.mjs');
    expect(cfg).toContain('/500');
  });

  it('guide pages carry unique titles/descriptions and no empty fallbacks', () => {
    const pages = [
      'src/pages/accuracy/index.astro',
      'src/pages/calibration/index.astro',
      'src/pages/methodology/index.astro',
      'src/pages/decibel-chart/index.astro',
      'src/pages/db-vs-dba/index.astro',
      'src/pages/how-to-use/index.astro',
      'src/pages/microphone-not-working/index.astro',
      'src/pages/privacy/index.astro',
      'src/pages/about/index.astro',
      'src/pages/guides/index.astro',
    ];
    const titles: string[] = [];
    for (const p of pages) {
      const src = read(p);
      const m = src.match(/const title = '([^']+)'|title=\{`([^`]+)`/);
      expect(m, p).toBeTruthy();
      titles.push(m![1] ?? m![2]);
      expect(src).toContain('description');
      expect(src).not.toMatch(/decibelmeter\.bond/);
      expect(src).not.toMatch(/localhost:\d/);
    }
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('contact page publishes no invented details or internal paths', () => {
    const contact = read('src/pages/contact/index.astro');
    expect(contact).not.toContain('BUILD-STATE');
    expect(contact).not.toMatch(/@example|support@/);
  });

  it('footer exposes crawlable language links and key guides', () => {
    const layout = read('src/components/Layout.astro');
    const seo = read('src/lib/seo.ts');
    expect(layout).toContain('hreflang={l.code}');
    expect(layout).toContain("accuracy: guidePath('accuracy'");
    expect(layout).toContain("calibration: guidePath('calibration'");
    expect(layout).toContain("methodology: guidePath('methodology'");
    expect(seo).toContain("accuracy: { en: '/accuracy/'");
    expect(seo).toContain("calibration: { en: '/calibration/'");
    expect(seo).toContain("methodology: { en: '/methodology/'");
  });

  it('Japanese users get a localized, internally linked guide cluster', () => {
    const localizedHome = read('src/pages/[locale]/index.astro');
    const guides = read('src/pages/ja/[slug].astro');
    const layout = read('src/components/Layout.astro');
    for (const slug of [
      'guides',
      'how-to-use',
      'methodology',
      'calibration',
      'accuracy',
      'decibel-chart',
      'db-vs-dba',
      'microphone-not-working',
      'privacy',
    ]) {
      expect(guides).toContain(`'${slug}'`);
    }
    expect(localizedHome).toContain("href: '/ja/calibration/'");
    expect(localizedHome).toContain("href: '/ja/accuracy/'");
    expect(localizedHome).toContain("href: '/ja/decibel-chart/'");
    expect(layout).toContain("const guidesHref = guidePath('guides')");
    expect(guides).toContain('inLanguage: \'ja\'');
    expect(guides).not.toMatch(/decibelmeter\.bond|localhost:\d/);
  });
});
