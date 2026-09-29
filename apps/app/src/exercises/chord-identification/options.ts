import type { RangeOption } from '../shared/playing.js';
import { validateRange } from '../shared/range.js';
import {
  DEFAULT_SESSION,
  normalizeSession,
  validateSession,
  validationResult,
  type SessionOptions,
} from '../shared/session.js';
import { chordById, chordSpan, isChordId, type ChordId } from './chords.js';
import {
  DIRECTIONS,
  EXECUTIONS,
  playbacksFor,
  type ArpeggioDirection,
  type ChordPlayback,
  type Execution,
} from './playback.js';
import { CHORD_SETS } from './sets.js';

export const DEFAULT_RANGE: RangeOption = { low: 'C3', high: 'C6' };

export interface ChordOptions extends SessionOptions {
  chords: readonly ChordId[];
  range: RangeOption;
  playbacks: readonly ChordPlayback[];
}

export interface CustomOptions extends SessionOptions {
  chords: readonly ChordId[];
  range: RangeOption;
  executions: readonly Execution[];
  directions: readonly ArpeggioDirection[];
}

const TRIADS = CHORD_SETS.find((set) => set.id === 'triads')!.chords;

export const DEFAULT_CUSTOM_OPTIONS: CustomOptions = {
  chords: TRIADS,
  range: DEFAULT_RANGE,
  executions: ['arpeggio-harmonic', 'harmonic'],
  directions: ['asc', 'desc'],
  ...DEFAULT_SESSION,
};

function keep<T extends string>(values: readonly T[] | undefined, allowed: readonly T[]): T[] {
  return allowed.filter((value) => values?.includes(value));
}

export function validateCustomOptions(options: Partial<CustomOptions>) {
  const errors: string[] = [];
  if ((options.chords ?? []).filter(isChordId).length < 2) errors.push('Select at least two chords.');
  const executions = keep(options.executions, EXECUTIONS);
  if (executions.length < 1) errors.push('Select at least one execution.');
  if (executions.some((execution) => execution !== 'harmonic') && keep(options.directions, DIRECTIONS).length < 1) {
    errors.push('Select at least one direction.');
  }
  errors.push(...validateSession(options));
  errors.push(
    ...validateRange(options.range, {
      semitones: Math.max(0, ...(options.chords ?? []).filter(isChordId).map((id) => chordSpan(chordById(id)))),
      of: 'chords',
    }),
  );
  return validationResult(errors);
}

export function toChordOptions(options: Partial<CustomOptions>): ChordOptions {
  const merged: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, ...options };
  const chords = merged.chords.filter(isChordId);
  const executions = keep(merged.executions, EXECUTIONS);
  const directions = keep(merged.directions, DIRECTIONS);
  const playbacks = playbacksFor(
    executions.length >= 1 ? executions : DEFAULT_CUSTOM_OPTIONS.executions,
    directions.length >= 1 ? directions : DEFAULT_CUSTOM_OPTIONS.directions,
  );
  return {
    range: merged.range,
    chords: chords.length >= 2 ? chords : DEFAULT_CUSTOM_OPTIONS.chords,
    playbacks:
      playbacks.length >= 1
        ? playbacks
        : playbacksFor(DEFAULT_CUSTOM_OPTIONS.executions, DEFAULT_CUSTOM_OPTIONS.directions),
    ...normalizeSession(merged),
  };
}
