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

export interface HreflangEntry {
  hreflang: string;
  href: string;
}

export type GuideKey = 'guides' | 'calibration' | 'accuracy' | 'decibel-chart' | 'db-vs-dba' | 'microphone-not-working' | 'how-to-use' | 'methodology' | 'privacy';

const GUIDE_PATHS: Record<GuideKey, Partial<Record<SeoLocale, string>>> = {
  guides: { en: '/guides/', de: '/de/anleitungen/', ja: '/ja/guides/' },
  calibration: { en: '/calibration/', de: '/de/kalibrierung/', ja: '/ja/calibration/' },
  accuracy: { en: '/accuracy/', de: '/de/genauigkeit/', ja: '/ja/accuracy/' },
  'decibel-chart': { en: '/decibel-chart/', de: '/de/dezibel-tabelle/', ja: '/ja/decibel-chart/' },
  'db-vs-dba': { en: '/db-vs-dba/', de: '/de/db-vs-dba/', ja: '/ja/db-vs-dba/' },
  'microphone-not-working': { en: '/microphone-not-working/', de: '/de/mikrofon-funktioniert-nicht/', ja: '/ja/microphone-not-working/' },
  'how-to-use': { en: '/how-to-use/', ja: '/ja/how-to-use/' },
  methodology: { en: '/methodology/', ja: '/ja/methodology/' },
  privacy: { en: '/privacy/', ja: '/ja/privacy/' },
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
