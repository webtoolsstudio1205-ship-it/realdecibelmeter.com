const NOINDEX_HEADER = 'noindex, nofollow';

/**
 * Returns true for static-asset paths that must never gain a trailing slash:
 * bundled JS/CSS, images, sitemaps, robots.txt, llms.txt, verification files.
 * All real pages on this site are extensionless with `trailingSlash: 'always'`.
 */
function isAssetPath(pathname) {
  return /\/[^/]*\.[a-zA-Z0-9]+$/.test(pathname);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname.toLowerCase();

  // Canonical origin: https + non-www (single hop — never chain).
  let needsCanonicalRedirect = false;
  if (hostname === 'www.realdecibelmeter.com' || url.protocol === 'http:') {
    url.hostname = 'realdecibelmeter.com';
    url.protocol = 'https:';
    needsCanonicalRedirect = true;
  }

  // Canonical URLs always end with a trailing slash (matches Astro
  // `trailingSlash: 'always'` and every <link rel="canonical">). Without this,
  // `/guides` serves the same bytes as `/guides/` with a 200, so Google
  // reports the slashless copy as "Alternate page with proper canonical tag".
  // A 301 consolidates the signal instead of leaving a duplicate to classify.
  // `/guides/index.html` -> `/guides/` (same duplicate class).
  if (url.pathname.endsWith('/index.html')) {
    url.pathname = url.pathname.slice(0, -'index.html'.length);
    needsCanonicalRedirect = true;
  } else if (
    url.pathname !== '/' &&
    !url.pathname.endsWith('/') &&
    !isAssetPath(url.pathname)
  ) {
    url.pathname = `${url.pathname}/`;
    needsCanonicalRedirect = true;
  }

  if (needsCanonicalRedirect) {
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

