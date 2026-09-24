// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// Static output for static hosting.
// All audio processing runs client-side via Web Audio API.
// SEO: single canonical origin https://realdecibelmeter.com with trailing-slash URLs.
//
// Sitemap priorities guide crawl budget toward unique, high-value pages first.
// This helps the "Crawled - currently not indexed" state on new sites: Google
// crawls the homepage and core guides first. Legal/utility pages (about,
// contact, terms, privacy, disclaimer, editorial-policy) are noindex and
// excluded from the sitemap via sitemapInclude(). lastmod is set at build
// time so Google can spot fresh URLs.
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// Mirror of NOINDEX_PATHS in src/lib/seo.ts (config cannot import TS).
// These pages render `noindex, follow` and must stay out of the sitemap so
// crawl budget goes to homepages, locale pages, tools, guides and FAQ.
const NOINDEX_PATHS = [
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/disclaimer/',
  '/editorial-policy/',
];

/** @param {string} page @returns {boolean} false for noindex/error pages */
function sitemapInclude(page) {
  const path = new URL(page).pathname;
  if (path.includes('/404') || path.includes('/500')) return false;
  if (NOINDEX_PATHS.includes(path)) return false;
  // Localized legal pages, e.g. /ja/privacy/.
  if (/^\/[a-z]{2}\/privacy\/$/.test(path)) return false;
  return true;
}
/** @param {string} url @returns {{ priority: number, changefreq: 'daily' | 'weekly' | 'monthly' }} */
function sitemapPriority(url) {
  const path = new URL(url).pathname;
  // Main English Homepage - Top Priority
  if (path === '/') return { priority: 1.0, changefreq: 'daily' };
  
  // Priority 1: All International Homepages
  if (['/de/', '/ja/', '/it/', '/es/', '/fr/', '/pt/', '/ko/'].includes(path)) {
    return { priority: 0.9, changefreq: 'daily' };
  }

  // Priority 2: Homepage cluster — the four core entry pages that feed the
  // homepage most impressions. Sole step below '/' so crawlers always see
  // the homepage as the site's most important URL.
  if (['/guides/', '/faq/', '/calibration/', '/accuracy/'].includes(path)) {
    return { priority: 0.8, changefreq: 'weekly' };
  }

  // Priority 3: Primary Web Audio Tools & Interactive Calculators
  if (
    [
      '/tone-generator/',
      '/speaker-test/',
      '/hearing-age-test/',
      '/noise-exposure-calculator/',
      '/frequency-analyzer/',
      '/background-noise-test/',
      '/microphone-noise-floor-test/',
      '/sound-level-meter/',
      '/phone-decibel-meter/',
      '/iphone-decibel-meter/',
    ].includes(path)
  ) {
    return { priority: 0.8, changefreq: 'weekly' };
  }

  // Priority 4: Guides, Methodology & Calibration Content
  if (
    [
      '/methodology/', '/how-to-use/',
      '/decibel-chart/', '/db-vs-dba/', '/microphone-not-working/',
      '/dbfs-vs-db-spl/', '/validation/',
      '/de/anleitungen/', '/de/kalibrierung/', '/de/genauigkeit/', '/de/dezibel-tabelle/',
      '/de/db-vs-dba/', '/de/mikrofon-funktioniert-nicht/', '/de/handy-dezibel-messen/',
      '/ja/guides/', '/ja/how-to-use/', '/ja/methodology/', '/ja/calibration/',
      '/ja/accuracy/', '/ja/decibel-chart/', '/ja/db-vs-dba/',
      '/ja/microphone-not-working/', '/ja/noise-meter-app/',
    ].includes(path)
  ) {
    return { priority: 0.7, changefreq: 'weekly' };
  }

  // Priority 5 (fallback): remaining indexed pages (e.g. /noise-exposure/,
  // /it/ guides, locale pages). Legal/utility pages never reach here —
  // they are excluded by sitemapInclude() above.
  return { priority: 0.4, changefreq: 'monthly' };
}
export default defineConfig({
  output: 'static',
  site: 'https://realdecibelmeter.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => sitemapInclude(page),
      lastmod: new Date(),
      serialize(item) {
        const { priority, changefreq } = sitemapPriority(item.url);
        // SitemapItem types changefreq as EnumChangefreq; string values are
        // equivalent at runtime, so cast to satisfy tsc in this JS config.
        return { ...item, priority, changefreq: /** @type {any} */ (changefreq), lastmod: BUILD_DATE };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
