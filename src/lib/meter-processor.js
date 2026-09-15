/**
 * AudioWorkletProcessor for contiguous Float32 PCM measurement.
 *
 * Self-contained on purpose: it is loaded as a module into the audio thread
 * and must not import bundler-managed code. The algorithm mirrors the pure
 * functions in src/lib/dsp.ts (analyzeBlock + SosFilter); software arithmetic
 * is verified by vitest suites against that module.
 *
 * Per 128-frame quantum it posts:
 *   { type:'quantum', seq, frames, sumSq, n, peak, clipped, dcSum, nan, inf }
 * where sumSq/n/peak/clipped/dcSum describe the FREQUENCY-WEIGHTED signal
 * (SOS cascade set via processorOptions or the 'set-sos' port message).
 * Filter state persists across quanta (contiguous processing). It NEVER
 * connects to any output — measurement only.
 */

class MeterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.sos = Array.isArray(opts.sos) ? opts.sos : [];
    this.gain = typeof opts.gain === 'number' && isFinite(opts.gain) ? opts.gain : 1;
    this.states = new Float64Array(this.sos.length * 2);
    this.seq = 0;
    this.framesTotal = 0;
    this.port.onmessage = (e) => {
      const msg = (e && e.data) || {};
      if (msg.type === 'set-sos') {
        this.sos = Array.isArray(msg.sos) ? msg.sos : [];
        this.gain = typeof msg.gain === 'number' && isFinite(msg.gain) ? msg.gain : 1;
        this.states = new Float64Array(this.sos.length * 2);
      } else if (msg.type === 'reset-filter') {
        this.states.fill(0);
      }
    };
  }

  process(inputs) {
    const ch = (inputs && inputs[0]) || [];
    // Mono measurement: first channel only; channelCount reported separately.
    const x = ch.length > 0 ? ch[0] : null;
    if (!x || x.length === 0) {
      this.port.postMessage({ type: 'quantum', seq: this.seq++, frames: 0, sumSq: 0, n: 0, peak: 0, clipped: 0, dcSum: 0, nan: 0, inf: 0, framesTotal: this.framesTotal });
      return true;
    }
    let sumSq = 0;
    let n = 0;
    let peak = 0;
    let clipped = 0;
    let dcSum = 0;
    let nan = 0;
    let inf = 0;
    const sos = this.sos;
    const states = this.states;
    for (let i = 0; i < x.length; i++) {
      let v = x[i];
      if (typeof v !== 'number' || Number.isNaN(v)) { nan++; continue; }
      if (!isFinite(v)) { inf++; continue; }
      // Weighting cascade, Direct Form II transposed.
      let sample = v;
      for (let s = 0; s < sos.length; s++) {
        const sec = sos[s];
        const s0 = states[s * 2];
        const s1 = states[s * 2 + 1];
        const out = sec[0] * sample + s0;
        states[s * 2] = sec[1] * sample - sec[4] * out + s1;
        states[s * 2 + 1] = sec[2] * sample - sec[5] * out;
        sample = out;
      }
      const y = sample * this.gain;
      if (!isFinite(y)) { inf++; continue; }
      n++;
      sumSq += y * y;
      dcSum += y;
      const a = Math.abs(y);
      if (a > peak) peak = a;
      if (a >= 0.999) clipped++;
    }
    this.framesTotal += x.length;
    this.port.postMessage({
      type: 'quantum', seq: this.seq++, frames: x.length,
      sumSq, n, peak, clipped, dcSum, nan, inf, framesTotal: this.framesTotal,
    });
    return true;
  }
}

registerProcessor('rdm-meter', MeterProcessor);
