import type { ErrorCode } from './types.js';

export interface UiError {
  code: ErrorCode;
  title: string;
  message: string;
  recovery: string;
}

const MAP: Record<Exclude<ErrorCode, 'none'>, Omit<UiError, 'code'>> = {
  'unsupported-browser': {
    title: 'Browser not supported',
    message: 'This browser does not expose microphone audio through Web Audio API / getUserMedia.',
    recovery: 'Open this page in a recent Chrome, Edge, Firefox, or Safari release, on HTTPS or localhost.',
  },
  'permission-denied': {
    title: 'Microphone permission denied',
    message: 'The browser blocked microphone access, so no audio is measured or recorded.',
    recovery: 'Open the site permission icon in the address bar, allow the microphone, then press Start again.',
  },
  'no-microphone': {
    title: 'No microphone detected',
    message: 'No audio input device was found.',
    recovery: 'Connect a microphone, check the OS sound settings, then reload and press Start.',
  },
  'device-disconnected': {
    title: 'Microphone disconnected',
    message: 'The selected input stopped delivering audio mid-session.',
    recovery: 'Reconnect the device, choose it in the microphone selector, then press Start.',
  },
  'microphone-busy': {
    title: 'Microphone is busy',
    message: 'Another app or tab is already using the microphone exclusively.',
    recovery: 'Close the other app or tab (video calls, recorders), then press Start again.',
  },
  'calibration-invalid': {
    title: 'Calibration invalid',
    message: 'The stored calibration offset is missing or outside the plausible range.',
    recovery: 'Re-enter the reference offset in Advanced controls, or reset to the uncalibrated estimate.',
  },
  'storage-unavailable': {
    title: 'Session history unavailable',
    message: 'Local storage is blocked, so past sessions cannot be saved on this device.',
    recovery: 'Measurement still works. Allow site storage, or export each session as CSV instead.',
  },
  'processing-error': {
    title: 'Audio processing error',
    message: 'The analyser stopped unexpectedly.',
    recovery: 'Press Stop, then Start again. If it persists, reload the page and try another microphone.',
  },
};

export function describeError(code: ErrorCode, detail = ''): UiError {
  if (code === 'none') {
    return { code, title: '', message: '', recovery: '' };
  }
  const base = MAP[code];
  return {
    code,
    title: base.title,
    message: detail ? `${base.message} Detail: ${detail}` : base.message,
    recovery: base.recovery,
  };
}

export function errorFromDomException(err: unknown): ErrorCode {
  const name = (err as { name?: string } | null)?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'permission-denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no-microphone';
  if (name === 'NotReadableError') return 'microphone-busy';
  if (name === 'AbortError') return 'device-disconnected';
  return 'processing-error';
}
