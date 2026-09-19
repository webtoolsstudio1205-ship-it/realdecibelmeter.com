/**
 * Client-side security guards: pure, dependency-free helpers with unit tests
 * in `security.test.ts`.
 *
 * Context: this is a fully static site with no server endpoints, so these
 * guards cover the remaining client-controlled surfaces — export filenames,
 * untrusted text, dynamic URLs/redirects (none exist today; the guards encode
 * the allowlist for future edits), and stored-payload sizes.
 */

/** Escape the five HTML-significant characters. Use when building HTML strings. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Allow only safe navigation targets: same-origin `https:` URLs on this site
 * or root-relative internal paths. Rejects `javascript:`, `data:`, `blob:`,
 * protocol-relative (`//evil`) and backslash-escaped hosts.
 */
export function isSafeHref(href: string): boolean {
  const value = href.trim();
  if (value === '') return false;
  if (/^\\/.test(value)) return false;
  if (/^\/\//.test(value)) return false;
  const lower = value.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('blob:')) {
    return false;
  }
  if (lower.startsWith('https://realdecibelmeter.com/') || value === 'https://realdecibelmeter.com') {
    return true;
  }
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (value.startsWith('#')) return true;
  if (lower.startsWith('mailto:')) return false;
  // Bare schemes other than http(s) are rejected; plain relative page links
  // (e.g. "guides/") are resolved by the router, not built dynamically.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  return false;
}

/**
 * Open-redirect guard for internal navigation targets (language switcher,
 * error-page links). Only root-relative paths on this origin are allowed.
 */
export function isInternalRedirectPath(target: string): boolean {
  if (target === '') return false;
  if (!target.startsWith('/')) return false;
  if (target.startsWith('//')) return false;
  if (target.includes('\\')) return false;
  if (/[\r\n]/.test(target)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(target.slice(1))) return false;
  return true;
}

/**
 * Strip directory components, control characters and shell-sensitive
 * characters from export filenames. The meter only ever generates
 * `decibel-session-<epoch>.*`, but every download path funnels through here
 * so a future caller cannot smuggle a path or extension.
 */
export function sanitizeExportFilename(filename: string, fallback = 'decibel-session-export'): string {
  const base = filename.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[\0-\x1f\x7f<>:"|?*]/g, '').replace(/^\.+/, '').trim();
  const truncated = cleaned.slice(0, 120);
  if (truncated === '' || truncated === '.' || truncated === '..') return `${fallback}.csv`;
  return truncated;
}

/** Byte-size guard for a raw localStorage payload before JSON parsing. */
export function isStoredPayloadSizeOk(raw: string, maxBytes = 262144): boolean {
  return raw.length <= maxBytes;
}
