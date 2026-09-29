import { INTERVAL_FAMILIES, INTERVAL_SIZES, rangeForIntervals, type IntervalId } from '../shared/intervals.js';
import type { PlayingMode, RangeOption } from '../shared/playing.js';
import {
  DEFAULT_SESSION,
  normalizeSession,
  validateSession,
  validationResult,
  type SessionOptions,
  type ValidationResult,
} from '../shared/session.js';
import { tokenMidi } from '../shared/spelling.js';

export const PLAYING_MODES: readonly PlayingMode[] = ['asc', 'desc', 'harmonic'];

export interface IdentificationOptions extends SessionOptions {
  intervals: readonly IntervalId[];
  playingModes: readonly PlayingMode[];
  range: RangeOption;
}

export const DEFAULT_OPTIONS: IdentificationOptions = {
  intervals: INTERVAL_FAMILIES.simple,
  playingModes: PLAYING_MODES,
  range: rangeForIntervals(INTERVAL_FAMILIES.simple),
  ...DEFAULT_SESSION,
};

function validIntervals(ids: readonly IntervalId[] | undefined): IntervalId[] {
  return (ids ?? []).filter((id) => INTERVAL_SIZES.some((size) => size.id === id));
}

export function validateOptions(options: Partial<IdentificationOptions>): ValidationResult {
  const errors: string[] = [];
  if (validIntervals(options.intervals).length < 2) errors.push('Select at least two intervals.');
  if ((options.playingModes ?? []).filter((m) => PLAYING_MODES.includes(m)).length < 1) {
    errors.push('Select at least one playing mode.');
  }
  errors.push(...validateSession(options));
  const range = options.range;
  const lowMidi = range && tokenMidi(range.low);
  const highMidi = range && tokenMidi(range.high);
  if (lowMidi === undefined || highMidi === undefined || lowMidi >= highMidi) errors.push('Select a valid range.');
  return validationResult(errors);
}

export function normalizeOptions(options: Partial<IdentificationOptions>): IdentificationOptions {
  const merged: IdentificationOptions = { ...DEFAULT_OPTIONS, ...options };
  const chosen = validIntervals(merged.intervals);
  const playingModes = merged.playingModes.filter((m) => PLAYING_MODES.includes(m));
  return {
    ...merged,
    ...normalizeSession(merged),
    intervals: chosen.length >= 2 ? chosen : DEFAULT_OPTIONS.intervals,
    playingModes: playingModes.length >= 1 ? playingModes : DEFAULT_OPTIONS.playingModes,
  };
}
