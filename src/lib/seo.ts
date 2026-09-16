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
