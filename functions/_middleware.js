const NOINDEX_HEADER = 'noindex, nofollow';

export async function onRequest(context) {
  const hostname = new URL(context.request.url).hostname.toLowerCase();
  const response = await context.next();

  if (!hostname.endsWith('.pages.dev')) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', NOINDEX_HEADER);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
