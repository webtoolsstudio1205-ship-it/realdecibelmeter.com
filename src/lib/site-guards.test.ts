import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Regression guards for the mobile-responsiveness, indexation and
 * AdSense-readiness work. All assertions read source files (never dist),
 * so they run without a build.
 */
const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('mobile overflow guards', () => {
  it('html clips horizontal overflow without breaking sticky (clip, not hidden)', () => {
    const css = read('src/styles/global.css');
    expect(css).toMatch(/html\s*\{\s*overflow-x:\s*clip;/);
  });

  it('panels and articles cannot be forced wider than the viewport', () => {
    const css = read('src/styles/global.css');
    expect(css).toContain('.panel, .panel-raised, .article-rich');
    expect(css).toContain('overflow-wrap: break-word');
  });

  it('flex label/value rows shrink and wrap instead of overflowing', () => {
    const css = read('src/styles/global.css');
    expect(css).toContain('dl > div.flex.justify-between');
    expect(css).toContain('flex-wrap: wrap');
  });

  it('wide article tables scroll inside the panel', () => {
    const css = read('src/styles/global.css');
    expect(css).toContain('.article-rich table');
    expect(css).toContain('overflow-x: auto');
  });

  it('text sections never combine content-visibility with the reveal transition (garbled-glyph regression)', () => {
    const css = read('src/styles/global.css');
    expect(css).not.toContain('#main .cv-group > section {');
    expect(read('src/pages/index.astro')).not.toContain('cv-group');
    expect(read('src/pages/[locale]/index.astro')).not.toContain('cv-group');
  });

  it('media elements are capped at container width', () => {
    const css = read('src/styles/global.css');
    expect(css).toContain('img, svg, video, canvas, progress');
    expect(css).toContain('max-width: 100%');
  });
});

describe('article homepage CTA', () => {
  it('Article renders a locale-aware homepage CTA box', () => {
    const article = read('src/components/Article.astro');
    expect(article).toContain('homeHref');
    expect(article).toContain("ctaLocale === 'en' ? '/' : `/${ctaLocale}/`");
    for (const label of ['Try it live', 'Jetzt selbst testen', 'Provalo dal vivo']) {
      expect(article).toContain(label);
    }
  });

  it('CTA links use relative homepage paths only', () => {
    const article = read('src/components/Article.astro');
    expect(article).toContain('href={homeHref}');
    expect(article).not.toMatch(/href="http:\/\//);
  });
});

describe('sitemap priorities', () => {
  it('homepage keeps the sole maximum priority', () => {
    const cfg = read('astro.config.mjs');
    expect(cfg).toContain("if (path === '/') return { priority: 1.0, changefreq: 'daily' }");
  });

  it('homepage cluster (guides, faq, calibration, accuracy) sits one step below', () => {
    const cfg = read('astro.config.mjs');
    expect(cfg).toContain('Homepage cluster');
    for (const p of ['/guides/', '/faq/', '/calibration/', '/accuracy/']) {
      expect(cfg).toContain(`'${p}'`);
    }
  });

  it('italian guides carry guide priority instead of the fallback', () => {
    const cfg = read('astro.config.mjs');
    for (const p of ['/it/guide/', '/it/calibrazione/', '/it/accuratezza/', '/it/tabella-decibel/', '/it/db-vs-dba/', '/it/microfono-non-funziona/']) {
      expect(cfg).toContain(`'${p}'`);
    }
  });

  it('spanish guides exist with slugs, hreflang keys and sitemap priority', () => {
    const seo = read('src/lib/seo.ts');
    for (const p of ['/es/guias/', '/es/como-usar/', '/es/metodologia/', '/es/calibracion/', '/es/precision/', '/es/tabla-decibelios/', '/es/db-vs-dba/', '/es/microfono-no-funciona/', '/es/privacidad/', '/es/movil-decibelimetro/']) {
      expect(seo).toContain(`'${p}'`);
    }
    const es = read('src/pages/es/[slug].astro');
    for (const s of ['guias', 'como-usar', 'metodologia', 'calibracion', 'precision', 'tabla-decibelios', 'db-vs-dba', 'microfono-no-funciona', 'privacidad', 'movil-decibelimetro']) {
      expect(es).toContain(`'${s}'`);
    }
    expect(es).toContain("getDict('es')");
    expect(es).toContain("inLanguage: 'es'");
    const cfg = read('astro.config.mjs');
    for (const p of ['/es/guias/', '/es/movil-decibelimetro/']) {
      expect(cfg).toContain(`'${p}'`);
    }
    const layout = read('src/components/Layout.astro');
    expect(layout).toContain("'/es/guias/': 'guides'");
    expect(layout).toContain("'/es/privacidad/': 'privacy'");
  });

  it('spanish privacy page is noindex like every other privacy page', () => {
    const seo = read('src/lib/seo.ts');
    expect(seo).toContain("'/es/privacidad/'");
    const cfg = read('astro.config.mjs');
    expect(cfg).toContain("'/es/privacidad/'");
  });

  it('french guides exist with slugs, hreflang keys and sitemap priority', () => {
    const seo = read('src/lib/seo.ts');
    for (const p of ['/fr/guides/', '/fr/mode-emploi/', '/fr/methodologie/', '/fr/calibrage/', '/fr/precision/', '/fr/tableau-decibels/', '/fr/db-vs-dba/', '/fr/microphone-ne-fonctionne-pas/', '/fr/confidentialite/', '/fr/sonometre-telephone/']) {
      expect(seo).toContain(`'${p}'`);
    }
    const fr = read('src/pages/fr/[slug].astro');
    for (const s of ['guides', 'mode-emploi', 'methodologie', 'calibrage', 'precision', 'tableau-decibels', 'db-vs-dba', 'microphone-ne-fonctionne-pas', 'confidentialite', 'sonometre-telephone']) {
      expect(fr).toContain(`'${s}'`);
    }
    expect(fr).toContain("getDict('fr')");
    expect(fr).toContain("inLanguage: 'fr'");
    const cfg = read('astro.config.mjs');
    for (const p of ['/fr/guides/', '/fr/sonometre-telephone/']) {
      expect(cfg).toContain(`'${p}'`);
    }
    const layout = read('src/components/Layout.astro');
    expect(layout).toContain("'/fr/guides/': 'guides'");
    expect(layout).toContain("'/fr/confidentialite/': 'privacy'");
  });

  it('french privacy page is noindex like every other privacy page', () => {
    const seo = read('src/lib/seo.ts');
    expect(seo).toContain("'/fr/confidentialite/'");
    const cfg = read('astro.config.mjs');
    expect(cfg).toContain("'/fr/confidentialite/'");
  });

  it('portuguese guides exist with slugs, hreflang keys and sitemap priority', () => {
    const seo = read('src/lib/seo.ts');
    for (const p of ['/pt/guias/', '/pt/como-usar/', '/pt/metodologia/', '/pt/calibracao/', '/pt/precisao/', '/pt/tabela-decibeis/', '/pt/db-vs-dba/', '/pt/microfone-nao-funciona/', '/pt/privacidade/', '/pt/decibelimetro-celular/']) {
      expect(seo).toContain(`'${p}'`);
    }
    const pt = read('src/pages/pt/[slug].astro');
    for (const s of ['guias', 'como-usar', 'metodologia', 'calibracao', 'precisao', 'tabela-decibeis', 'db-vs-dba', 'microfone-nao-funciona', 'privacidade', 'decibelimetro-celular']) {
      expect(pt).toContain(`'${s}'`);
    }
    expect(pt).toContain("getDict('pt')");
    expect(pt).toContain("inLanguage: 'pt'");
    const cfg = read('astro.config.mjs');
    for (const p of ['/pt/guias/', '/pt/decibelimetro-celular/']) {
      expect(cfg).toContain(`'${p}'`);
    }
    const layout = read('src/components/Layout.astro');
    expect(layout).toContain("'/pt/guias/': 'guides'");
    expect(layout).toContain("'/pt/privacidade/': 'privacy'");
  });

  it('portuguese privacy page is noindex like every other privacy page', () => {
    const seo = read('src/lib/seo.ts');
    expect(seo).toContain("'/pt/privacidade/'");
    const cfg = read('astro.config.mjs');
    expect(cfg).toContain("'/pt/privacidade/'");
  });

  it('korean guides exist with slugs, hreflang keys and sitemap priority', () => {
    const seo = read('src/lib/seo.ts');
    for (const p of ['/ko/guides/', '/ko/how-to-use/', '/ko/methodology/', '/ko/calibration/', '/ko/accuracy/', '/ko/decibel-chart/', '/ko/db-vs-dba/', '/ko/microphone-not-working/', '/ko/privacy/', '/ko/noise-meter-app/']) {
      expect(seo).toContain(`'${p}'`);
    }
    const ko = read('src/pages/ko/[slug].astro');
    for (const s of ['guides', 'how-to-use', 'methodology', 'calibration', 'accuracy', 'decibel-chart', 'db-vs-dba', 'microphone-not-working', 'privacy', 'noise-meter-app']) {
      expect(ko).toContain(`'${s}'`);
    }
    expect(ko).toContain("getDict('ko')");
    expect(ko).toContain("inLanguage: 'ko'");
    const cfg = read('astro.config.mjs');
    for (const p of ['/ko/guides/', '/ko/noise-meter-app/']) {
      expect(cfg).toContain(`'${p}'`);
    }
    const layout = read('src/components/Layout.astro');
    expect(layout).toContain("'/ko/guides/': 'guides'");
    expect(layout).toContain("'/ko/privacy/': 'privacy'");
  });

  it('korean privacy page is noindex like every other privacy page', () => {
    const seo = read('src/lib/seo.ts');
    expect(seo).toContain("'/ko/privacy/'");
    const cfg = read('astro.config.mjs');
    expect(cfg).toContain("'/ko/privacy/'");
  });

  it('noindex pages stay out of the sitemap', () => {
    const cfg = read('astro.config.mjs');
    for (const p of ['/about/', '/contact/', '/privacy/', '/terms/', '/disclaimer/', '/editorial-policy/']) {
      expect(cfg).toContain(`'${p}'`);
    }
    expect(cfg).toContain('sitemapInclude');
  });
});

describe('adsense readiness', () => {
  it('privacy pages disclose advertising cookies', () => {
    expect(read('src/pages/privacy/index.astro')).toContain('AdSense');
    expect(read('src/pages/ja/[slug].astro')).toContain('AdSense');
  });

  it('robots.txt allows the AdSense crawler explicitly', () => {
    const robots = read('public/robots.txt');
    expect(robots).toContain('Mediapartners-Google');
    expect(robots).toContain('Allow: /');
  });

  it('footer links the FAQ without touching the header', () => {
    const layout = read('src/components/Layout.astro');
    expect(layout).toContain('href="/faq/"');
    expect(read('src/i18n/ui.ts')).toContain("faq:'FAQ'");
  });

  it('authorship is stated on about and editorial policy', () => {
    expect(read('src/pages/about/index.astro')).toContain('Who writes and reviews this');
    expect(read('src/pages/editorial-policy/index.astro')).toContain('Authors and accountability');
    expect(read('src/pages/about/index.astro')).toContain('hello@realdecibelmeter.com');
  });

  it('named author Bhagya Masalawala is credited on-page and in structured data', () => {
    expect(read('src/pages/about/index.astro')).toContain('Bhagya Masalawala');
    expect(read('src/pages/editorial-policy/index.astro')).toContain('Bhagya Masalawala');
    const seo = read('src/lib/seo.ts');
    expect(seo).toContain("'Person'");
    expect(seo).toContain('Bhagya Masalawala');
  });
});
