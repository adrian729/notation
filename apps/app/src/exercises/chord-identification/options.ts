import {
  DEFAULT_SESSION,
  normalizeSession,
  validateSession,
  validationResult,
  type SessionOptions,
} from '../shared/session.js';
import { isChordId, type ChordId } from './chords.js';
import {
  DIRECTIONS,
  EXECUTIONS,
  playbacksFor,
  type ArpeggioDirection,
  type ChordPlayback,
  type Execution,
} from './playback.js';
import { CHORD_SETS } from './sets.js';

export interface ChordOptions extends SessionOptions {
  chords: readonly ChordId[];
  playbacks: readonly ChordPlayback[];
}

export interface CustomOptions extends SessionOptions {
  chords: readonly ChordId[];
  executions: readonly Execution[];
  directions: readonly ArpeggioDirection[];
}

const TRIADS = CHORD_SETS.find((set) => set.id === 'triads')!.chords;

export const DEFAULT_CUSTOM_OPTIONS: CustomOptions = {
  chords: TRIADS,
  executions: ['arpeggio-block', 'block'],
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
  if (executions.some((execution) => execution !== 'block') && keep(options.directions, DIRECTIONS).length < 1) {
    errors.push('Select at least one direction.');
  }
  errors.push(...validateSession(options));
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
    chords: chords.length >= 2 ? chords : DEFAULT_CUSTOM_OPTIONS.chords,
    playbacks:
      playbacks.length >= 1
        ? playbacks
        : playbacksFor(DEFAULT_CUSTOM_OPTIONS.executions, DEFAULT_CUSTOM_OPTIONS.directions),
    ...normalizeSession(merged),
  };
}
