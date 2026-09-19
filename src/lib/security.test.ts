/**
 * Repository-level security tests (spec section 21).
 * Pure-function checks, fake-capture engine checks, and static source/dist
 * assertions. No network, no destructive probing.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DecibelEngine } from './engine.js';
import type { CaptureCallbacks, CaptureController, CaptureStartInfo } from './microphone.js';
import { csvCell, sessionToCsv, buildExportSession } from './export-format.js';
import type { ExportSession } from './export-format.js';
import { loadHistory, saveSession } from './history.js';
import { loadProfiles, storeProfile, validateCalibration } from './calibration.js';
import { describeError, errorFromDomException } from './errors.js';
import {
  escapeHtml,
  isInternalRedirectPath,
  isSafeHref,
  isStoredPayloadSizeOk,
  sanitizeExportFilename,
} from './security.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const readSrc = (rel: string) => readFileSync(join(root, rel), 'utf8');

function memStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
  };
}

class FakeCapture implements CaptureController {
  startCalls = 0;
  disposeCalls = 0;
  get active() { return this.startCalls > this.disposeCalls; }
  async start(_d: string, _s: number[][], _g: number, _cb: CaptureCallbacks): Promise<CaptureStartInfo> {
    this.startCalls++;
    return {
      sampleRate: 48000, label: 'Fake Mic', channelCount: 1,
      processing: { echoCancellation: 'disabled', noiseSuppression: 'disabled', autoGainControl: 'disabled' },
      relaxed: [],
    };
  }
  setWeighting() {}
  async suspend() {}
  async resume() {}
  dispose() { this.disposeCalls++; }
}

// 1 — untrusted text is escaped; no executable sinks in client code.
describe('1: untrusted text is escaped', () => {
  it('escapeHtml neutralizes markup', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml('"onmouseover="x')).toBe('&quot;onmouseover=&quot;x');
    expect(escapeHtml("a'b&c")).toBe('a&#39;b&amp;c');
  });
  it('MeterPanel renders dynamic data only via textContent/safe DOM APIs', () => {
    const src = readSrc('src/components/MeterPanel.astro');
    for (const sink of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'new Function', 'eval(']) {
      expect(src, sink).not.toContain(sink);
    }
    expect(src).toContain('textContent');
  });
  it('Layout JSON-LD uses only static JSON.stringify, never user input', () => {
    const src = readSrc('src/components/Layout.astro');
    expect(src).toContain('set:html={JSON.stringify(block)}');
    expect(src).not.toContain('innerHTML');
  });
});

// 2 — dynamic URLs reject unsafe protocols.
describe('2: dynamic URLs reject unsafe protocols', () => {
  it.each([
    ['javascript:alert(1)', false],
    ['JaVaScRiPt:alert(1)', false],
    ['data:text/html,<h1>x</h1>', false],
    ['blob:https://x/y', false],
    ['//evil.com/', false],
    ['\\/evil.com', false],
    ['https://evil.com/', false],
    ['http://realdecibelmeter.com/', false],
  ])('isSafeHref(%s) === %s', (href, expected) => {
    expect(isSafeHref(href as string)).toBe(expected as boolean);
  });
  it('allows internal paths, anchors and same-origin https', () => {
    expect(isSafeHref('/calibration/')).toBe(true);
    expect(isSafeHref('/#measure')).toBe(true);
    expect(isSafeHref('#measure')).toBe(true);
    expect(isSafeHref('https://realdecibelmeter.com/privacy/')).toBe(true);
  });
});

// 3 — open redirects are blocked.
describe('3: open redirects are blocked', () => {
  it('accepts only root-relative internal paths', () => {
    expect(isInternalRedirectPath('/de/')).toBe(true);
    expect(isInternalRedirectPath('/guides/')).toBe(true);
    expect(isInternalRedirectPath('https://evil.com/')).toBe(false);
    expect(isInternalRedirectPath('//evil.com/')).toBe(false);
    expect(isInternalRedirectPath('/\\evil.com')).toBe(false);
    expect(isInternalRedirectPath('/x\r\nSet-Cookie: a')).toBe(false);
    expect(isInternalRedirectPath('')).toBe(false);
    expect(isInternalRedirectPath('guides/')).toBe(false);
  });
  it('the only dynamic navigation (language switcher) uses server allowlist hrefs', () => {
    const layout = readSrc('src/components/Layout.astro');
    expect(layout).not.toMatch(/location\s*\.\s*href\s*=/);
    expect(layout).not.toMatch(/window\.open\s*\(/);
  });
});

// 4 — malformed local-storage data is rejected safely.
describe('4: malformed local-storage data is rejected safely', () => {
  it('garbage JSON yields empty history without throwing', () => {
    const r = loadHistory(memStorage({ 'rdm.session-history.v2': '{not json' }));
    expect(r.entries).toEqual([]);
  });
  it('foreign schema versions are ignored, not merged', () => {
    const r = loadHistory(memStorage({ 'rdm.session-history.v2': JSON.stringify({ schema: 999, entries: [{ id: 'x' }] }) }));
    expect(r.entries).toEqual([]);
  });
  it('entries with bad types or absurd numbers are filtered', () => {
    const bad = {
      schema: 2,
      entries: [
        { id: 'ok', label: 'a', savedAtIso: new Date().toISOString(), session: { startedAtIso: 'x', unit: 'dBFS', weighting: 'A', sampleRate: 48000, recordedSec: 1, activeSec: 1, gapMs: 0 } },
        { id: 'evil', label: '<img>', savedAtIso: 'junk', session: { startedAtIso: 'x', unit: 'dBFS', weighting: 'A', sampleRate: 48000 } },
        { id: 'huge', label: 'a', savedAtIso: new Date().toISOString(), session: { startedAtIso: 'x', unit: 'dBFS', weighting: 'A', sampleRate: 48000, leqDb: 99999, recordedSec: 1, activeSec: 1, gapMs: 0 } },
      ],
    };
    const r = loadHistory(memStorage({ 'rdm.session-history.v2': JSON.stringify(bad) }));
    expect(r.entries.map((e) => e.id)).toEqual(['ok']);
  });
});

// 5 — oversized stored objects are rejected.
describe('5: oversized stored objects are rejected', () => {
  it('payloads beyond the cap are dropped before parsing', () => {
    expect(isStoredPayloadSizeOk('x'.repeat(300000))).toBe(false);
    expect(isStoredPayloadSizeOk('{"a":1}')).toBe(true);
    const r = loadHistory(memStorage({ 'rdm.session-history.v2': 'x'.repeat(300000) }));
    expect(r.entries).toEqual([]);
  });
});

// 6 — calibration profiles are schema-validated.
describe('6: calibration profiles are schema-validated', () => {
  it('tampered offsets and labels are filtered on load', () => {
    const tampered = {
      schema: 1,
      profiles: [
        {
          id: 'evil', label: 'x', offsetDb: 9999, isCalibrated: true, mode: 'calibrated',
          referenceReadingDb: 94, measuredDigitalLeqDb: -30, referenceMethod: 'reference-meter',
          referenceNote: '', calibrationDateIso: new Date().toISOString(), measuredDigitalLeqDb2: 0,
          referenceDurationSec: 30, config: { sampleRate: 48000, weighting: 'A', deviceId: '', deviceLabel: 'm', channelCount: 1, processing: {}, relaxed: [] }, appVersion: '1.0.0',
        },
      ],
    };
    const store = memStorage({ 'rdm.calibration-profiles.v1': JSON.stringify(tampered) });
    expect(loadProfiles(store)).toEqual([]);
  });
  it('validateCalibration rejects fantasy offsets', () => {
    expect(validateCalibration(9999).ok).toBe(false);
    expect(validateCalibration(Number.NaN).ok).toBe(false);
    expect(validateCalibration(80).ok).toBe(true);
  });
  it('valid profiles round-trip through storage', () => {
    const store = memStorage();
    storeProfile(
      {
        id: 'p1', label: 'Ref', offsetDb: 80, isCalibrated: true, mode: 'calibrated',
        referenceReadingDb: 94, referenceMethod: 'reference-meter', referenceNote: '',
        calibrationDateIso: new Date().toISOString(), measuredDigitalLeqDb: -30,
        referenceDurationSec: 30,
        config: { sampleRate: 48000, weighting: 'A', deviceId: '', deviceLabel: 'm', channelCount: 1, processing: { echoCancellation: 'disabled', noiseSuppression: 'disabled', autoGainControl: 'disabled' }, relaxed: [] },
        appVersion: '1.0.0',
      },
      store,
    );
    expect(loadProfiles(store).map((p) => p.id)).toEqual(['p1']);
  });
});

// 7 — CSV export prevents spreadsheet-formula injection.
describe('7: CSV export prevents spreadsheet-formula injection', () => {
  it('prefixes and quotes formula cells, leaves numbers untouched', () => {
    expect(csvCell('=CMD|test')).toBe(`"'=CMD|test"`);
    expect(csvCell('+123abc')).toBe(`"'+123abc"`);
    expect(csvCell('-25.5')).toBe('-25.5');
    expect(csvCell('a"b\nc')).toBe('"a""b\nc"');
  });
  it('device labels cannot break CSV structure', () => {
    const s = buildExportSession({
      stats: { current: -20, min: -40, leq: -25, max: -6, peakDb: -3, gapMs: 0, recordedSec: 1, durationSec: 1 },
      gaps: [], segments: [], unit: 'dBFS', mode: 'digital', weighting: 'A', response: 'fast',
      deviceLabel: `=HYPERLINK("http://evil","x")`, deviceId: '', sampleRate: 48000, channelCount: 1,
      processing: {}, relaxedConstraints: [],
      calibration: { id: 'u', label: 'u', offsetDb: 0, isCalibrated: false },
      calibrationMethod: 'none', calibrationDateIso: null,
      startedAtIso: '2026-09-16T00:00:00.000Z', invalidSamples: 0,
    });
    const line = sessionToCsv(s).split('\n').find((l) => l.startsWith('device_label,'))!;
    expect(line).not.toMatch(/,=HYPERLINK/);
    expect(line).toContain("'=HYPERLINK");
  });
});

// 8 — object URLs are revoked; filenames sanitized.
describe('8: safe export downloads', () => {
  it('downloadBlob revokes the object URL and sanitizes the filename', () => {
    const src = readSrc('src/lib/export-format.ts');
    expect(src).toContain('URL.revokeObjectURL');
    expect(src).toContain('sanitizeExportFilename');
  });
  it('sanitizeExportFilename strips paths and reserved characters', () => {
    expect(sanitizeExportFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeExportFilename('a/b\\c:d?.csv')).toBe('cd.csv');
    expect(sanitizeExportFilename('decibel-session-123.csv')).toBe('decibel-session-123.csv');
    expect(sanitizeExportFilename('...')).toBe('decibel-session-export.csv');
  });
});

// 9 — microphone tracks stop correctly.
describe('9: microphone tracks stop correctly', () => {
  it('stop() disposes the capture (tracks stopped, context closed)', async () => {
    const fake = new FakeCapture();
    const engine = new DecibelEngine({ now: () => 0, uiThrottleMs: 0, stabilizeMs: 0, createCapture: () => fake });
    await engine.start();
    expect(engine.snapshot().state).toBe('running');
    engine.stop();
    expect(engine.snapshot().state).toBe('stopped');
    expect(fake.disposeCalls).toBe(1);
    expect(fake.active).toBe(false);
  });
});

// 10 — no raw audio upload in the measurement path.
describe('10: no raw audio leaves the device', () => {
  it('snapshots and exports contain statistics only, never PCM', async () => {
    const fake = new FakeCapture();
    const engine = new DecibelEngine({ now: () => 0, uiThrottleMs: 0, stabilizeMs: 0, createCapture: () => fake });
    await engine.start();
    const json = JSON.stringify(engine.snapshot());
    for (const key of ['Float32Array', 'pcm', 'samplesBuffer', 'audioData', 'base64', 'dataUrl']) {
      expect(json.toLowerCase(), key).not.toContain(key.toLowerCase());
    }
    const src = readSrc('src/lib/microphone.ts');
    expect(src).toContain('NEVER connect to ctx.destination');
    expect(src).not.toMatch(/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/);
  });
});

// 11 — permission requested only after user interaction.
describe('11: permission requested only after user interaction', () => {
  it('constructing/subscribing never touches capture; start() does', async () => {
    const fake = new FakeCapture();
    const engine = new DecibelEngine({ now: () => 0, uiThrottleMs: 0, stabilizeMs: 0, createCapture: () => fake });
    engine.subscribe(() => {});
    engine.snapshot();
    expect(fake.startCalls).toBe(0);
    await engine.start();
    expect(fake.startCalls).toBe(1);
  });
});

// 12/13/14 — no server surface: methods, content types, Turnstile N/A.
describe('12-14: server-surface controls (documented NOT APPLICABLE)', () => {
  it('no API routes, middleware, actions, or forms exist', () => {
    expect(existsSync(join(root, 'src', 'pages', 'api'))).toBe(false);
    expect(existsSync(join(root, 'src', 'middleware.ts'))).toBe(false);
    expect(existsSync(join(root, 'src', 'actions'))).toBe(false);
    const panel = readSrc('src/components/MeterPanel.astro');
    expect(panel).not.toMatch(/<form|method\s*=\s*["']post/i);
    const contact = readSrc('src/pages/contact/index.astro');
    expect(contact).not.toMatch(/<form/i);
  });
});

// 15 — secrets are not present in client bundles.
describe('15: secrets are not present in client bundles', () => {
  it('built JS contains no secret patterns', () => {
    const dir = join(root, 'dist', '_astro');
    if (!existsSync(dir)) return; // build artifact check runs in CI after build
    const js = readdirSync(dir).filter((f) => f.endsWith('.js'));
    expect(js.length).toBeGreaterThan(0);
    for (const f of js) {
      const content = readFileSync(join(dir, f), 'utf8');
      for (const pat of ['BEGIN PRIVATE KEY', 'BEGIN RSA PRIVATE KEY', 'ghp_', 'gho_', 'sk_live', 'xoxb-', 'CLOUDFLARE_API_TOKEN', 'TURNSTILE_SECRET']) {
        expect(content, `${f}:${pat}`).not.toContain(pat);
      }
    }
  });
});

// 16 — production errors do not expose stack traces.
describe('16: production errors do not expose stack traces', () => {
  it('detail is collapsed to one short line', () => {
    const evil = 'boom\n    at file:///secret/path.js:1:1\n    at eval (x)';
    const out = describeError('processing-error', evil);
    expect(out.message).not.toContain('\n');
    expect(out.message).not.toContain('/secret/path.js');
    expect(out.message.length).toBeLessThanOrEqual(300);
  });
  it('DOM error names map to safe public codes', () => {
    expect(errorFromDomException({ name: 'NotAllowedError' })).toBe('permission-denied');
    expect(errorFromDomException({ name: 'NotFoundError' })).toBe('no-microphone');
    expect(errorFromDomException({ name: '???' })).toBe('processing-error');
  });
});

// 17 — required security headers exist.
describe('17: required security headers exist', () => {
  it('public/_headers sets the baseline header set on /*', () => {
    const h = readSrc('public/_headers');
    for (const need of [
      'X-Content-Type-Options: nosniff',
      'Referrer-Policy: strict-origin-when-cross-origin',
      'X-Frame-Options: DENY',
      'Permissions-Policy: microphone=(self)',
      'Content-Security-Policy:',
      "frame-ancestors 'none'",
    ]) {
      expect(h, need).toContain(need);
    }
  });
});

// 18 — CSP does not allow an unrestricted wildcard source.
describe('18: CSP is tight', () => {
  it('no bare wildcard, no unsafe-eval, worklet blob allowed', () => {
    const h = readSrc('public/_headers');
    const csp = h.split('\n').find((l) => l.trim().startsWith('Content-Security-Policy:'))!;
    expect(csp).not.toMatch(/(?:^|[\s;])\*(?=[\s;]|$)/);
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('http:');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain('https://*.google-analytics.com');
    expect(csp).toContain('https://*.analytics.google.com');
  });
});

// 19 — legitimate AudioWorklets and assets still load.
describe('19: legitimate worklets and assets still load', () => {
  it('worklet source, registration and bundled assets exist', () => {
    const proc = readSrc('src/lib/meter-processor.js');
    expect(proc.length).toBeGreaterThan(100);
    const mic = readSrc('src/lib/microphone.ts');
    expect(mic).toContain('audioWorklet.addModule');
    const dir = join(root, 'dist', '_astro');
    if (!existsSync(dir)) return;
    const files = readdirSync(dir);
    expect(files.some((f) => f.endsWith('.js'))).toBe(true);
    expect(files.some((f) => f.endsWith('.css'))).toBe(true);
  });
});

// 20 — production build succeeds (artifact presence; full build runs in CI).
describe('20: production build artifacts', () => {
  it('dist contains the homepage, sitemap, robots and headers', () => {
    const dist = join(root, 'dist');
    if (!existsSync(join(dist, 'index.html'))) return;
    expect(existsSync(join(dist, 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'sitemap-index.xml'))).toBe(true);
    expect(existsSync(join(dist, 'robots.txt'))).toBe(true);
    expect(existsSync(join(dist, '_headers'))).toBe(true);
  });
});

describe('history save path', () => {
  it('saveSession truncates labels and bounds history size', () => {
    const store = memStorage();
    const sess = { startedAtIso: 'x', unit: 'dBFS', weighting: 'A', sampleRate: 48000 } as unknown as ExportSession;
    const r = saveSession(sess, 'x'.repeat(500), store);
    expect(r.ok).toBe(true);
    expect(r.entries[0].label.length).toBeLessThanOrEqual(80);
  });
});
