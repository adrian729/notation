import { INTERVAL_FAMILIES, type IntervalId } from '../shared/intervals.js';
import { validateRange } from '../shared/range.js';
import type { PlayingMode, RangeOption } from '../shared/playing.js';
import {
  DEFAULT_SESSION,
  normalizeSession,
  validateSession,
  validationResult,
  type SessionOptions,
} from '../shared/session.js';

export type ToneRelationship = 'common-first' | 'common-either' | 'nearby' | 'random';

export interface ExerciseOptions extends SessionOptions {
  intervals: readonly IntervalId[];
  playingModes: readonly PlayingMode[];
  toneRelationship: ToneRelationship;
  range: RangeOption;
}

export const DEFAULT_OPTIONS: ExerciseOptions = {
  intervals: INTERVAL_FAMILIES.simple,
  playingModes: ['asc', 'desc', 'harmonic'],
  toneRelationship: 'common-first',
  range: { low: 'C3', high: 'C6' },
  ...DEFAULT_SESSION,
};

const PLAYING_MODES: readonly PlayingMode[] = ['asc', 'desc', 'harmonic'];
const TONE_RELATIONSHIPS: readonly ToneRelationship[] = ['common-first', 'common-either', 'nearby', 'random'];
const ALL_INTERVAL_IDS = new Set<IntervalId>(Object.values(INTERVAL_FAMILIES).flat() as IntervalId[]);

export function validateOptions(options: Partial<ExerciseOptions>) {
  const errors: string[] = [];
  const intervals = (options.intervals ?? []).filter((id) => ALL_INTERVAL_IDS.has(id));
  if (intervals.length < 2) errors.push('Select at least two interval sizes.');
  const playingModes = (options.playingModes ?? []).filter((m) => PLAYING_MODES.includes(m));
  if (playingModes.length < 1) errors.push('Select at least one playing mode.');
  if (!options.toneRelationship || !TONE_RELATIONSHIPS.includes(options.toneRelationship)) {
    errors.push('Select a tone relationship.');
  }
  errors.push(...validateSession(options));
  errors.push(...validateRange(options.range));
  return validationResult(errors);
}

export function normalizeOptions(options: Partial<ExerciseOptions>): ExerciseOptions {
  const merged: ExerciseOptions = { ...DEFAULT_OPTIONS, ...options };
  const intervals = merged.intervals.filter((id) => ALL_INTERVAL_IDS.has(id));
  const playingModes = merged.playingModes.filter((m) => PLAYING_MODES.includes(m));
  return {
    ...merged,
    ...normalizeSession(merged),
    intervals: intervals.length >= 2 ? intervals : DEFAULT_OPTIONS.intervals,
    playingModes: playingModes.length >= 1 ? playingModes : DEFAULT_OPTIONS.playingModes,
    toneRelationship: TONE_RELATIONSHIPS.includes(merged.toneRelationship)
      ? merged.toneRelationship
      : DEFAULT_OPTIONS.toneRelationship,
  };
}

export { PLAYING_MODES, TONE_RELATIONSHIPS };
