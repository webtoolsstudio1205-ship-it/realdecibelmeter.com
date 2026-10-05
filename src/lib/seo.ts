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
  '/es/privacidad/',
  '/fr/confidentialite/',
  '/pt/privacidade/',
  '/ja/privacy/',
  '/ko/privacy/',
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

export type GuideKey = 'guides' | 'calibration' | 'accuracy' | 'decibel-chart' | 'db-vs-dba' | 'microphone-not-working' | 'how-to-use' | 'methodology' | 'privacy' | 'handy-dezibel-messen' | 'noise-meter-app' | 'iphone-decibel-meter' | 'movil-decibelimetro' | 'sonometre-telephone' | 'decibelimetro-celular' | 'noise-meter-app-ko';

const GUIDE_PATHS: Record<GuideKey, Partial<Record<SeoLocale, string>>> = {
  guides: { en: '/guides/', de: '/de/anleitungen/', ja: '/ja/guides/', it: '/it/guide/', es: '/es/guias/', fr: '/fr/guides/', pt: '/pt/guias/', ko: '/ko/guides/' },
  calibration: { en: '/calibration/', de: '/de/kalibrierung/', ja: '/ja/calibration/', it: '/it/calibrazione/', es: '/es/calibracion/', fr: '/fr/calibrage/', pt: '/pt/calibracao/', ko: '/ko/calibration/' },
  accuracy: { en: '/accuracy/', de: '/de/genauigkeit/', ja: '/ja/accuracy/', it: '/it/accuratezza/', es: '/es/precision/', fr: '/fr/precision/', pt: '/pt/precisao/', ko: '/ko/accuracy/' },
  'decibel-chart': { en: '/decibel-chart/', de: '/de/dezibel-tabelle/', ja: '/ja/decibel-chart/', it: '/it/tabella-decibel/', es: '/es/tabla-decibelios/', fr: '/fr/tableau-decibels/', pt: '/pt/tabela-decibeis/', ko: '/ko/decibel-chart/' },
  'db-vs-dba': { en: '/db-vs-dba/', de: '/de/db-vs-dba/', ja: '/ja/db-vs-dba/', it: '/it/db-vs-dba/', es: '/es/db-vs-dba/', fr: '/fr/db-vs-dba/', pt: '/pt/db-vs-dba/', ko: '/ko/db-vs-dba/' },
  'microphone-not-working': { en: '/microphone-not-working/', de: '/de/mikrofon-funktioniert-nicht/', ja: '/ja/microphone-not-working/', it: '/it/microfono-non-funziona/', es: '/es/microfono-no-funciona/', fr: '/fr/microphone-ne-fonctionne-pas/', pt: '/pt/microfone-nao-funciona/', ko: '/ko/microphone-not-working/' },
  'how-to-use': { en: '/how-to-use/', ja: '/ja/how-to-use/', es: '/es/como-usar/', fr: '/fr/mode-emploi/', pt: '/pt/como-usar/', ko: '/ko/how-to-use/' },
  methodology: { en: '/methodology/', ja: '/ja/methodology/', es: '/es/metodologia/', fr: '/fr/methodologie/', pt: '/pt/metodologia/', ko: '/ko/methodology/' },
  privacy: { en: '/privacy/', ja: '/ja/privacy/', es: '/es/privacidad/', fr: '/fr/confidentialite/', pt: '/pt/privacidade/', ko: '/ko/privacy/' },
  'handy-dezibel-messen': { de: '/de/handy-dezibel-messen/' },
  'noise-meter-app': { ja: '/ja/noise-meter-app/' },
  'iphone-decibel-meter': { en: '/iphone-decibel-meter/' },
  'movil-decibelimetro': { es: '/es/movil-decibelimetro/' },
  'sonometre-telephone': { fr: '/fr/sonometre-telephone/' },
  'decibelimetro-celular': { pt: '/pt/decibelimetro-celular/' },
  'noise-meter-app-ko': { ko: '/ko/noise-meter-app/' },
};

export function guideHreflang(key: GuideKey): HreflangEntry[] {
  const entries = Object.entries(GUIDE_PATHS[key]).map(([hreflang, path]) => ({
    hreflang,
    href: `${SITE}${path}`,
  }));
  // Reciprocal x-default (Ahrefs "Missing reciprocal hreflang" fix):
  // prefer English when it exists; otherwise point x-default at the single
  // existing translation itself (never the homepage — the homepage cluster
  // does not link back, which is exactly what Ahrefs flags as non-reciprocal).
  const english = GUIDE_PATHS[key].en;
  const firstPath = Object.values(GUIDE_PATHS[key])[0];
  const defaultUrl = english ? `${SITE}${english}` : `${SITE}${firstPath}`;
  entries.push({ hreflang: 'x-default', href: defaultUrl });
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
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/OnlineOnly' },
        featureList: 'Live dBA/dBC/dBZ estimates, Fast/Slow response, Leq, spectrum analyzer, calibration profiles, CSV/JSON export',
        publisher: { '@type': 'Organization', name: 'Real Decibel Meter', url: `${SITE}/` },
      },
    ],
  };
}

/**
 * Site-wide Organization entity for GEO/E-E-A-T.
 * Rendered once per page via Layout.astro so every answer engine can
 * attribute facts to a stable publisher with a named author.
 */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: 'Real Decibel Meter',
    url: `${SITE}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE}/og-image.png`,
      width: 1200,
      height: 630,
    },
  };
}

/**
 * HowTo schema for the 3-step measurement flow.
 * Powers "how to measure decibels" answer boxes and voice assistants.
 */
export function howToJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  steps: { name: string; text: string }[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    inLanguage: opts.inLanguage,
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    step: opts.steps.map((s) => ({
      '@type': 'HowToStep',
      name: s.name,
      text: s.text,
    })),
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
  datePublished?: string;
  speakableSelectors?: string[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.inLanguage,
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    author: {
      '@type': 'Person',
      name: 'Bhagya Masalawala',
      jobTitle: 'Full-Stack Developer',
      url: `${SITE}/about/`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Real Decibel Meter',
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/og-image.png`, width: 1200, height: 630 },
    },
    datePublished: opts.datePublished ?? opts.dateModified,
    dateModified: opts.dateModified,
    // SpeakableSpecification tells voice assistants and answer engines
    // exactly which answer-first blocks are safe to read aloud / quote.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: opts.speakableSelectors ?? ['#short-answer', '#key-facts'],
    },
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
