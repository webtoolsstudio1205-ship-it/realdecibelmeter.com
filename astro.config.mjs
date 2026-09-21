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
// crawls the homepage and core guides before thin utility pages (about,
// contact, terms). lastmod is set at build time so Google can spot fresh URLs.
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/** @param {string} url @returns {{ priority: number, changefreq: 'daily' | 'weekly' | 'monthly' }} */
function sitemapPriority(url) {
  const path = new URL(url).pathname;
  if (path === '/') return { priority: 1.0, changefreq: 'daily' };
  // Fully translated homepages with their own guide clusters.
  if (path === '/de/' || path === '/ja/') return { priority: 0.9, changefreq: 'weekly' };
  // Translated homepages without dedicated guide subpages yet — valuable but
  // thinner than en/de/ja, so slightly lower to focus the initial crawl.
  if (['/it/', '/es/', '/fr/', '/pt/', '/ko/'].includes(path)) return { priority: 0.7, changefreq: 'weekly' };
  // Core English + de/ja guides: unique articles, the main indexing targets.
  if (
    [
      '/guides/', '/calibration/', '/accuracy/', '/methodology/', '/how-to-use/',
      '/decibel-chart/', '/db-vs-dba/', '/microphone-not-working/', '/privacy/',
      '/noise-exposure/', '/phone-decibel-meter/', '/frequency-analyzer/',
      '/sound-level-meter/', '/faq/',
      '/de/anleitungen/', '/de/kalibrierung/', '/de/genauigkeit/', '/de/dezibel-tabelle/',
      '/de/db-vs-dba/', '/de/mikrofon-funktioniert-nicht/',
      '/ja/guides/', '/ja/how-to-use/', '/ja/methodology/', '/ja/calibration/',
      '/ja/accuracy/', '/ja/decibel-chart/', '/ja/db-vs-dba/',
      '/ja/microphone-not-working/', '/ja/privacy/',
    ].includes(path)
  )
    return { priority: 0.8, changefreq: 'weekly' };
  // Focused tools with original content.
  if (['/background-noise-test/', '/microphone-noise-floor-test/', '/dbfs-vs-db-spl/', '/validation/', '/tone-generator/', '/speaker-test/', '/hearing-age-test/', '/noise-exposure-calculator/'].includes(path))
    return { priority: 0.6, changefreq: 'monthly' };
  // Utility pages: keep indexable but de-prioritised so they don't compete
  // with guides during the first crawl wave.
  // (editorial-policy and disclaimer are trust pages with the same treatment.)
  return { priority: 0.4, changefreq: 'monthly' };
}
export default defineConfig({
  output: 'static',
  site: 'https://realdecibelmeter.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/500'),
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
