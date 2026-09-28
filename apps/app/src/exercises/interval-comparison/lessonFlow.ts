import type { Question } from './generator.js';

export const PASS_THRESHOLD = 0.8;

export interface AnsweredQuestion {
  question: Question;
  correct: boolean;
}

export interface LessonFlowState {
  answered: AnsweredQuestion[];
  targetCount: number;
  finished: boolean;
  endless: boolean;
  graded: boolean;
}

export function createLessonFlow(options: { questionCount: number | 'endless'; graded?: boolean }): LessonFlowState {
  const endless = options.questionCount === 'endless';
  return {
    answered: [],
    targetCount: endless ? Infinity : (options.questionCount as number),
    finished: false,
    endless,
    graded: options.graded ?? false,
  };
}

export function recordAnswer(state: LessonFlowState, question: Question, correct: boolean): LessonFlowState {
  if (state.finished) return state;
  const answered = [...state.answered, { question, correct }];
  const finished = !state.endless && answered.length >= state.targetCount;
  return { ...state, answered, finished };
}

export function finishFlow(state: LessonFlowState): LessonFlowState {
  if (!state.endless || state.finished) return state;
  return { ...state, finished: true };
}

export function scoreOf(answered: readonly AnsweredQuestion[]): number {
  if (answered.length === 0) return 0;
  const right = answered.filter((a) => a.correct).length;
  return right / answered.length;
}

export function passedLesson(state: LessonFlowState): boolean {
  return !state.endless && state.graded && state.finished && scoreOf(state.answered) >= PASS_THRESHOLD;
}

export function progressSegments(state: LessonFlowState): ('upcoming' | 'right' | 'wrong')[] {
  const total = state.endless ? state.answered.length : state.targetCount;
  const segments: ('upcoming' | 'right' | 'wrong')[] = [];
  for (let i = 0; i < total; i++) {
    const a = state.answered[i];
    segments.push(a ? (a.correct ? 'right' : 'wrong') : 'upcoming');
  }
  return segments;
}
