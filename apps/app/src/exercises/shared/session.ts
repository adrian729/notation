import { countParam, enumParam, flagParam } from './customSearch.js';
import {
  DEFAULT_QUESTION_COUNT,
  normalizeQuestionCount,
  QUESTION_COUNT_MAX,
  QUESTION_COUNT_MIN,
  type QuestionCount,
} from './lessonFlow.js';
import { TEMPOS, type Tempo } from './playing.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validationResult(errors: string[]): ValidationResult {
  return { valid: errors.length === 0, errors };
}

export interface SessionOptions {
  tempo: Tempo;
  questionCount: QuestionCount;
  autoNext: boolean;
}

export const DEFAULT_SESSION: SessionOptions = {
  tempo: 'medium',
  questionCount: DEFAULT_QUESTION_COUNT,
  autoNext: false,
};

export function validateSession(options: Partial<SessionOptions>): string[] {
  const errors: string[] = [];
  if (!options.tempo || !TEMPOS.includes(options.tempo)) errors.push('Select a tempo.');
  const count = options.questionCount;
  if (count === undefined) {
    errors.push('Select a question count.');
  } else if (
    count !== 'endless' &&
    (!Number.isInteger(count) || count < QUESTION_COUNT_MIN || count > QUESTION_COUNT_MAX)
  ) {
    errors.push(
      `Question count must be a whole number between ${QUESTION_COUNT_MIN} and ${QUESTION_COUNT_MAX}, or endless.`,
    );
  }
  return errors;
}

export function normalizeSession(options: Partial<SessionOptions>): SessionOptions {
  const merged = { ...DEFAULT_SESSION, ...options };
  return {
    tempo: TEMPOS.includes(merged.tempo) ? merged.tempo : DEFAULT_SESSION.tempo,
    questionCount: normalizeQuestionCount(merged.questionCount),
    autoNext: merged.autoNext,
  };
}

export interface SessionSearch {
  tempo: Tempo;
  count: string;
  endless: '0' | '1';
  auto: '0' | '1';
}

export function parseSessionSearch(search: Record<string, unknown>): SessionSearch {
  return {
    tempo: enumParam(search.tempo, TEMPOS, DEFAULT_SESSION.tempo),
    count: countParam(search.count, DEFAULT_QUESTION_COUNT),
    endless: flagParam(search.endless),
    auto: flagParam(search.auto),
  };
}

export function sessionFromSearch(search: SessionSearch): SessionOptions {
  return {
    tempo: search.tempo,
    questionCount: search.endless === '1' ? 'endless' : Number(search.count),
    autoNext: search.auto === '1',
  };
}

export function describeQuestions(search: SessionSearch): string {
  return search.endless === '1' ? 'endless' : `${search.count} question${search.count === '1' ? '' : 's'}`;
}
