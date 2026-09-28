import { INTERVAL_FAMILIES, type IntervalId } from './intervals.js';
import { tokenMidi } from './spelling.js';

export type PlayingMode = 'asc' | 'desc' | 'harmonic';
export type ToneRelationship = 'common-first' | 'common-either' | 'nearby' | 'no-common';
export type Tempo = 'slow' | 'medium' | 'fast';
export type QuestionCount = number | 'endless';

export interface RangeOption {
  low: string;
  high: string;
}

export interface ExerciseOptions {
  intervals: readonly IntervalId[];
  playingModes: readonly PlayingMode[];
  toneRelationship: ToneRelationship;
  range: RangeOption;
  tempo: Tempo;
  questionCount: QuestionCount;
  autoNext: boolean;
}

export const TEMPO_NOTE_DURATION: Record<Tempo, number> = {
  slow: 1.0,
  medium: 0.7,
  fast: 0.45,
};

export const AUTO_NEXT_DELAY_MS = 1500;
export const QUESTION_COUNT_MIN = 1;
export const QUESTION_COUNT_MAX = 200;

export const DEFAULT_OPTIONS: ExerciseOptions = {
  intervals: INTERVAL_FAMILIES.simple,
  playingModes: ['asc', 'desc', 'harmonic'],
  toneRelationship: 'common-first',
  range: { low: 'C3', high: 'C6' },
  tempo: 'medium',
  questionCount: 10,
  autoNext: false,
};

const PLAYING_MODES: readonly PlayingMode[] = ['asc', 'desc', 'harmonic'];
const TONE_RELATIONSHIPS: readonly ToneRelationship[] = [
  'common-first',
  'common-either',
  'nearby',
  'no-common',
];
const TEMPOS: readonly Tempo[] = ['slow', 'medium', 'fast'];
const ALL_INTERVAL_IDS = new Set<IntervalId>(
  Object.values(INTERVAL_FAMILIES).flat() as IntervalId[],
);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateOptions(options: Partial<ExerciseOptions>): ValidationResult {
  const errors: string[] = [];
  const intervals = (options.intervals ?? []).filter((id) => ALL_INTERVAL_IDS.has(id));
  if (intervals.length < 2) errors.push('Select at least two interval sizes.');
  const playingModes = (options.playingModes ?? []).filter((m) => PLAYING_MODES.includes(m));
  if (playingModes.length < 1) errors.push('Select at least one playing mode.');
  if (!options.toneRelationship || !TONE_RELATIONSHIPS.includes(options.toneRelationship)) {
    errors.push('Select a tone relationship.');
  }
  if (!options.tempo || !TEMPOS.includes(options.tempo)) errors.push('Select a tempo.');
  if (options.questionCount === undefined) {
    errors.push('Select a question count.');
  } else if (options.questionCount !== 'endless') {
    const count = options.questionCount;
    if (!Number.isInteger(count) || count < QUESTION_COUNT_MIN || count > QUESTION_COUNT_MAX) {
      errors.push(`Question count must be a whole number between ${QUESTION_COUNT_MIN} and ${QUESTION_COUNT_MAX}, or endless.`);
    }
  }
  const range = options.range;
  if (!range || !range.low || !range.high) {
    errors.push('Select a range.');
  } else {
    const lowMidi = tokenMidi(range.low);
    const highMidi = tokenMidi(range.high);
    if (lowMidi === undefined || highMidi === undefined) {
      errors.push('Enter a valid range.');
    } else if (lowMidi >= highMidi) {
      errors.push('The low end of the range must be lower than the high end.');
    }
  }
  return { valid: errors.length === 0, errors };
}

export function normalizeOptions(options: Partial<ExerciseOptions>): ExerciseOptions {
  const merged: ExerciseOptions = { ...DEFAULT_OPTIONS, ...options };
  const intervals = merged.intervals.filter((id) => ALL_INTERVAL_IDS.has(id));
  const playingModes = merged.playingModes.filter((m) => PLAYING_MODES.includes(m));
  return {
    ...merged,
    intervals: intervals.length >= 2 ? intervals : DEFAULT_OPTIONS.intervals,
    playingModes: playingModes.length >= 1 ? playingModes : DEFAULT_OPTIONS.playingModes,
    toneRelationship: TONE_RELATIONSHIPS.includes(merged.toneRelationship)
      ? merged.toneRelationship
      : DEFAULT_OPTIONS.toneRelationship,
    tempo: TEMPOS.includes(merged.tempo) ? merged.tempo : DEFAULT_OPTIONS.tempo,
    questionCount: normalizeQuestionCount(merged.questionCount),
  };
}

function normalizeQuestionCount(count: QuestionCount): QuestionCount {
  if (count === 'endless') return count;
  if (!Number.isFinite(count)) return DEFAULT_OPTIONS.questionCount;
  return Math.min(QUESTION_COUNT_MAX, Math.max(QUESTION_COUNT_MIN, Math.round(count)));
}

export { PLAYING_MODES, TONE_RELATIONSHIPS, TEMPOS, normalizeQuestionCount };
