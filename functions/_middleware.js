const NOINDEX_HEADER = 'noindex, nofollow';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname.toLowerCase();

  if (hostname === 'www.realdecibelmeter.com' || url.protocol === 'http:') {
    url.hostname = 'realdecibelmeter.com';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

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

