import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '../../functions/_middleware.js';

function createContext(url) {
  return {
    request: new Request(url),
    next: vi.fn(async () => new Response('ok', {
      status: 200,
      headers: { 'Content-Type': 'text/plain', 'X-Existing': 'preserved' },
    })),
  };
}

describe('Pages hostname indexing middleware', () => {
  it('adds a noindex header to the stable pages.dev hostname', async () => {
    const response = await onRequest(createContext('https://realdecibelmeter-7us.pages.dev/'));

    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(response.headers.get('X-Existing')).toBe('preserved');
    expect(await response.text()).toBe('ok');
  });

  it('adds a noindex header to preview deployment hostnames', async () => {
    const response = await onRequest(createContext('https://abc123.realdecibelmeter-7us.pages.dev/contact/'));

    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('leaves the primary domain indexable', async () => {
    const context = createContext('https://realdecibelmeter.com/');
    const response = await onRequest(context);

    expect(response.headers.has('X-Robots-Tag')).toBe(false);
    expect(context.next).toHaveBeenCalledOnce();
  });
});

describe('Canonical trailing-slash redirects', () => {
  it('redirects a slashless page URL to its canonical trailing-slash form', async () => {
    const context = createContext('https://realdecibelmeter.com/guides');
    const response = await onRequest(context);

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://realdecibelmeter.com/guides/');
    expect(context.next).not.toHaveBeenCalled();
  });

  it('preserves the query string when adding the trailing slash', async () => {
    const response = await onRequest(createContext('https://realdecibelmeter.com/faq?utm_source=x'));

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://realdecibelmeter.com/faq/?utm_source=x');
  });

  it('redirects /guides/index.html to /guides/', async () => {
    const response = await onRequest(createContext('https://realdecibelmeter.com/guides/index.html'));

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://realdecibelmeter.com/guides/');
  });

  it('redirects /index.html to /', async () => {
    const response = await onRequest(createContext('https://realdecibelmeter.com/index.html'));

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://realdecibelmeter.com/');
  });

  it('does not redirect canonical URLs or static assets', async () => {
    for (const url of [
      'https://realdecibelmeter.com/',
      'https://realdecibelmeter.com/guides/',
      'https://realdecibelmeter.com/de/',
      'https://realdecibelmeter.com/favicon.svg',
      'https://realdecibelmeter.com/robots.txt',
      'https://realdecibelmeter.com/sitemap-0.xml',
      'https://realdecibelmeter.com/llms.txt',
      'https://realdecibelmeter.com/og-image.png',
      'https://realdecibelmeter.com/_astro/client.abc123.js',
    ]) {
      const context = createContext(url);
      const response = await onRequest(context);

      expect(response.status).toBe(200);
      expect(context.next).toHaveBeenCalledOnce();
    }
  });

  it('combines www + slashless into a single redirect hop', async () => {
    const response = await onRequest(createContext('https://www.realdecibelmeter.com/guides'));

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://realdecibelmeter.com/guides/');
  });

  it('combines http + slashless into a single redirect hop', async () => {
    const response = await onRequest(createContext('http://realdecibelmeter.com/faq'));

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://realdecibelmeter.com/faq/');
  });
});
