import { MAX_DB, MIN_DB, clamp } from './dsp.js';

/** Final clamp for display. Single place where the meter range is enforced. */
export function clampLevel(db: number): number {
  return clamp(db, MIN_DB, MAX_DB);
}

/** Identity hook kept so the engine has one pipeline stage for future filters. */
export function applyWeightingPipeline(db: number): number {
  return db;
}
