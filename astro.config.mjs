// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// Static output for static hosting.
// All audio processing runs client-side via Web Audio API.
// SEO: single canonical origin https://realdecibelmeter.com with trailing-slash URLs.
export default defineConfig({
  output: 'static',
  site: 'https://realdecibelmeter.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/500'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
