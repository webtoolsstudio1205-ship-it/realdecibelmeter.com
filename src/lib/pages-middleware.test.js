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
