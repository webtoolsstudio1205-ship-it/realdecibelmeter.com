/** Central SEO helpers — single canonical origin, hreflang, JSON-LD builders. */

export const SITE = 'https://realdecibelmeter.com';

export type SeoLocale = 'en' | 'de' | 'it' | 'ja' | 'es' | 'fr' | 'pt' | 'ko';

export const LOCALE_PATHS: Record<SeoLocale, string> = {
  en: '/',
  de: '/de/',
  it: '/it/',
  ja: '/ja/',
  es: '/es/',
  fr: '/fr/',
  pt: '/pt/',
  ko: '/ko/',
};

export function canonicalFor(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE}${p}`;
}

/**
 * Thin / legal / utility pages that must NOT be indexed.
 * Single source of truth — mirrored in `astro.config.mjs` sitemap filter
 * (config cannot import TS) and consumed by `Layout.astro` for the
 * `<meta name="robots">` default.
 *
 * INDEXED (high value, keep `index, follow` + in sitemap):
 * `/`, locale homepages (`/de/`, `/ja/`…), tools
 * (`/tone-generator/`, `/speaker-test/`, …), guides & explainers
 * (`/guides/`, `/calibration/`, `/accuracy/`, `/methodology/`,
 * `/how-to-use/`, `/decibel-chart/`, `/db-vs-dba/`, `/faq/`, …)
 * including their `/de/`, `/ja/`, `/it/` equivalents.
 *
 * NOINDEX (`noindex, follow`, excluded from sitemap):
 * legal & utility pages with no search intent — privacy, terms,
 * disclaimer, editorial-policy, contact, about, error pages.
 * Methodology is deliberately INDEXED: it is core guide content with
 * real search demand. To noindex it, just add '/methodology/' below
 * (and in astro.config.mjs).
 */
export const NOINDEX_PATHS: readonly string[] = [
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/disclaimer/',
  '/editorial-policy/',
];

/** Returns true for paths that must render `noindex, follow`. */
export function isNoindexPath(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  const withSlash = p.endsWith('/') ? p : `${p}/`;
  if (withSlash.includes('/404') || withSlash.includes('/500')) return true;
  if ((NOINDEX_PATHS as readonly string[]).includes(withSlash)) return true;
  // Localized legal pages, e.g. /ja/privacy/ (present + future locales).
  if (/^\/[a-z]{2}\/privacy\/$/.test(withSlash)) return true;
  return false;
}

export interface HreflangEntry {
  hreflang: string;
  href: string;
}

export type GuideKey = 'guides' | 'calibration' | 'accuracy' | 'decibel-chart' | 'db-vs-dba' | 'microphone-not-working' | 'how-to-use' | 'methodology' | 'privacy' | 'handy-dezibel-messen' | 'noise-meter-app' | 'iphone-decibel-meter';

const GUIDE_PATHS: Record<GuideKey, Partial<Record<SeoLocale, string>>> = {
  guides: { en: '/guides/', de: '/de/anleitungen/', ja: '/ja/guides/', it: '/it/guide/' },
  calibration: { en: '/calibration/', de: '/de/kalibrierung/', ja: '/ja/calibration/', it: '/it/calibrazione/' },
  accuracy: { en: '/accuracy/', de: '/de/genauigkeit/', ja: '/ja/accuracy/', it: '/it/accuratezza/' },
  'decibel-chart': { en: '/decibel-chart/', de: '/de/dezibel-tabelle/', ja: '/ja/decibel-chart/', it: '/it/tabella-decibel/' },
  'db-vs-dba': { en: '/db-vs-dba/', de: '/de/db-vs-dba/', ja: '/ja/db-vs-dba/', it: '/it/db-vs-dba/' },
  'microphone-not-working': { en: '/microphone-not-working/', de: '/de/mikrofon-funktioniert-nicht/', ja: '/ja/microphone-not-working/', it: '/it/microfono-non-funziona/' },
  'how-to-use': { en: '/how-to-use/', ja: '/ja/how-to-use/' },
  methodology: { en: '/methodology/', ja: '/ja/methodology/' },
  privacy: { en: '/privacy/', ja: '/ja/privacy/' },
  'handy-dezibel-messen': { de: '/de/handy-dezibel-messen/' },
  'noise-meter-app': { ja: '/ja/noise-meter-app/' },
  'iphone-decibel-meter': { en: '/iphone-decibel-meter/' },
};

export function guideHreflang(key: GuideKey): HreflangEntry[] {
  const entries = Object.entries(GUIDE_PATHS[key]).map(([hreflang, path]) => ({
    hreflang,
    href: `${SITE}${path}`,
  }));
  const english = GUIDE_PATHS[key].en;
  if (english) entries.push({ hreflang: 'x-default', href: `${SITE}${english}` });
  return entries;
}

export function localizedGuidePath(key: GuideKey, locale: SeoLocale): string | undefined {
  return GUIDE_PATHS[key][locale];
}

/** Reciprocal homepage language cluster. Only includes real locale homepages. */
export function homepageHreflang(): HreflangEntry[] {
  return [
    { hreflang: 'en', href: `${SITE}/` },
    { hreflang: 'de', href: `${SITE}/de/` },
    { hreflang: 'it', href: `${SITE}/it/` },
    { hreflang: 'ja', href: `${SITE}/ja/` },
    { hreflang: 'es', href: `${SITE}/es/` },
    { hreflang: 'fr', href: `${SITE}/fr/` },
    { hreflang: 'pt', href: `${SITE}/pt/` },
    { hreflang: 'ko', href: `${SITE}/ko/` },
    { hreflang: 'x-default', href: `${SITE}/` },
  ];
}

export function ogLocaleFor(locale: SeoLocale): string {
  const map: Record<SeoLocale, string> = {
    en: 'en_US',
    de: 'de_DE',
    it: 'it_IT',
    ja: 'ja_JP',
    es: 'es_ES',
    fr: 'fr_FR',
    pt: 'pt_BR',
    ko: 'ko_KR',
  };
  return map[locale];
}

export function webAppJsonLd(opts: {
  name: string;
  url: string;
  description: string;
  inLanguage: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Real Decibel Meter',
        url: `${SITE}/`,
        inLanguage: 'en',
      },
      {
        '@type': 'WebApplication',
        name: opts.name,
        url: opts.url,
        description: opts.description,
        inLanguage: opts.inLanguage,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires microphone access via getUserMedia; audio is processed locally.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  };
}

export function faqJsonLd(faq: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function articleJsonLd(opts: {
  headline: string;
  description: string;
  url: string;
  inLanguage: string;
  dateModified: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.inLanguage,
    author: { '@type': 'Organization', name: 'Real Decibel Meter', url: `${SITE}/` },
    publisher: { '@type': 'Organization', name: 'Real Decibel Meter', url: `${SITE}/` },
    dateModified: opts.dateModified,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
