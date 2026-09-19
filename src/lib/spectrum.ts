/**
 * Frequency-spectrum estimate helpers (display only, not a compliant
 * octave-band analyzer).
 *
 * The live spectrum tap produces 10 log-spaced DIGITAL dBFS bands from
 * ~60 Hz to ~12 kHz (see dsp.spectrumBandsDb). These helpers summarize them
 * for the UI: low/mid/high averages, dominant-band estimate and an
 * accessible text description. Never use for measurement or dose math.
 */

export const SPECTRUM_LO_HZ = 60;
export const SPECTRUM_HI_HZ = 12000;
export const SPECTRUM_BANDS = 10;

/** Frequency range [f0, f1) in Hz for band index b of N log-spaced bands. */
export function bandRange(b: number, bands = SPECTRUM_BANDS): [number, number] {
  const lo = SPECTRUM_LO_HZ;
  const hi = SPECTRUM_HI_HZ;
  const f0 = lo * Math.pow(hi / lo, b / bands);
  const f1 = lo * Math.pow(hi / lo, (b + 1) / bands);
  return [f0, f1];
}

export interface SpectrumSummary {
  lowDb: number | null; // bands 0–2 (≈60–300 Hz)
  midDb: number | null; // bands 3–6 (≈300–1900 Hz)
  highDb: number | null; // bands 7–9 (≈1.9–12 kHz)
  dominantBand: number | null;
  dominantRange: [number, number] | null;
  dominantDb: number | null;
  /** 'low' | 'mid' | 'high' region of the dominant band (for a11y text). */
  dominantRegion: 'low' | 'mid' | 'high' | null;
}

function avg(vals: (number | null)[]): number | null {
  const finite = vals.filter((v): v is number => v != null && Number.isFinite(v));
  if (!finite.length) return null;
  return finite.reduce((a, b) => a + b, 0) / finite.length;
}

export function summarizeSpectrum(bandsDb: (number | null)[]): SpectrumSummary {
  const bands = bandsDb.slice(0, SPECTRUM_BANDS);
  while (bands.length < SPECTRUM_BANDS) bands.push(null);
  const lowDb = avg(bands.slice(0, 3));
  const midDb = avg(bands.slice(3, 7));
  const highDb = avg(bands.slice(7, 10));
  let dominantBand: number | null = null;
  let dominantDb: number | null = null;
  for (let i = 0; i < bands.length; i++) {
    const v = bands[i];
    if (v != null && Number.isFinite(v) && (dominantDb == null || v > dominantDb)) {
      dominantDb = v;
      dominantBand = i;
    }
  }
  const dominantRange = dominantBand == null ? null : bandRange(dominantBand);
  const dominantRegion: SpectrumSummary['dominantRegion'] =
    dominantBand == null ? null : dominantBand <= 2 ? 'low' : dominantBand <= 6 ? 'mid' : 'high';
  return { lowDb, midDb, highDb, dominantBand, dominantRange, dominantDb, dominantRegion };
}

/** Compact "60–120 Hz"-style label for a band range. */
export function formatBandRange(range: [number, number] | null): string {
  if (!range) return '--';
  const f = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${Math.round(v)} Hz`);
  return `${f(range[0])}–${f(range[1])}`;
}
