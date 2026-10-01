import type { PlayingMode, RangeOption } from '../shared/playing.js';
import {
  DEFAULT_SESSION,
  normalizeSession,
  validateSession,
  validationResult,
  type SessionOptions,
  type ValidationResult,
} from '../shared/session.js';
import { INTERVAL_SIZES, widestSemitones, type IntervalId } from '@polyhymnia/music-theory';
import { rangeForIntervals } from '../shared/intervals.js';
import { validateRange } from '../shared/range.js';
import { setById } from './sets.js';

export type NoteCount = 3 | 4 | 5;
export const NOTE_COUNTS: readonly NoteCount[] = [3, 4, 5];
export type MultiPlayingMode = PlayingMode | 'random';
export const PLAYING_MODES: readonly MultiPlayingMode[] = ['asc', 'desc', 'harmonic', 'random'];
const DEFAULT_PLAYING_MODES: readonly MultiPlayingMode[] = ['asc', 'desc', 'harmonic'];

export interface MultiIntervalOptions extends SessionOptions {
  intervals: readonly IntervalId[];
  noteCounts: readonly NoteCount[];
  playingModes: readonly MultiPlayingMode[];
  range: RangeOption;
}

const CORE = setById('core');

export const DEFAULT_OPTIONS: MultiIntervalOptions = {
  intervals: CORE.intervals,
  noteCounts: [3],
  playingModes: DEFAULT_PLAYING_MODES,
  range: rangeForIntervals(CORE.intervals),
  ...DEFAULT_SESSION,
};

function validIntervals(ids: readonly IntervalId[] | undefined): IntervalId[] {
  return (ids ?? []).filter((id) => INTERVAL_SIZES.some((size) => size.id === id));
}

export function validateOptions(options: Partial<MultiIntervalOptions>): ValidationResult {
  const errors: string[] = [];
  const noteCounts = (options.noteCounts ?? []).filter((n) => NOTE_COUNTS.includes(n));
  if (noteCounts.length < 1) errors.push('Select at least one number of notes.');
  const needed = Math.max(2, ...noteCounts) - 1;
  if (validIntervals(options.intervals).length < needed) {
    errors.push(`Select at least ${needed} intervals for the chosen number of notes.`);
  }
  if ((options.playingModes ?? []).filter((m) => PLAYING_MODES.includes(m)).length < 1) {
    errors.push('Select at least one playing mode.');
  }
  errors.push(...validateSession(options));
  errors.push(
    ...validateRange(options.range, {
      semitones: widestSemitones(validIntervals(options.intervals)),
      of: 'intervals',
    }),
  );
  return validationResult(errors);
}

export function normalizeOptions(options: Partial<MultiIntervalOptions>): MultiIntervalOptions {
  const merged: MultiIntervalOptions = { ...DEFAULT_OPTIONS, ...options };
  const chosen = validIntervals(merged.intervals);
  const intervals = chosen.length >= 2 ? chosen : DEFAULT_OPTIONS.intervals;
  const noteCounts = merged.noteCounts.filter((n) => NOTE_COUNTS.includes(n) && n - 1 <= intervals.length);
  const playingModes = merged.playingModes.filter((m) => PLAYING_MODES.includes(m));
  return {
    ...merged,
    ...normalizeSession(merged),
    intervals,
    noteCounts: noteCounts.length >= 1 ? noteCounts : DEFAULT_OPTIONS.noteCounts,
    playingModes: playingModes.length >= 1 ? playingModes : DEFAULT_OPTIONS.playingModes,
  };
}
