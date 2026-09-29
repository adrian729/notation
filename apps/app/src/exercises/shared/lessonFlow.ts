export const PASS_THRESHOLD = 0.8;

export type QuestionCount = number | 'endless';
export const QUESTION_COUNT_MIN = 1;
export const QUESTION_COUNT_MAX = 200;
export const DEFAULT_QUESTION_COUNT = 10;

export function normalizeQuestionCount(count: QuestionCount): QuestionCount {
  if (count === 'endless') return count;
  if (!Number.isFinite(count)) return DEFAULT_QUESTION_COUNT;
  return Math.min(QUESTION_COUNT_MAX, Math.max(QUESTION_COUNT_MIN, Math.round(count)));
}

export interface AnsweredQuestion<Q, A> {
  question: Q;
  answer: A;
  correct: boolean;
}

export interface LessonFlowState<Q, A> {
  answered: AnsweredQuestion<Q, A>[];
  targetCount: number;
  finished: boolean;
  endless: boolean;
  graded: boolean;
}

export function createLessonFlow<Q, A>(options: {
  questionCount: number | 'endless';
  graded?: boolean;
}): LessonFlowState<Q, A> {
  const endless = options.questionCount === 'endless';
  return {
    answered: [],
    targetCount: endless ? Infinity : (options.questionCount as number),
    finished: false,
    endless,
    graded: options.graded ?? false,
  };
}

export function recordAnswer<Q, A>(
  state: LessonFlowState<Q, A>,
  question: Q,
  answer: A,
  correct: boolean,
): LessonFlowState<Q, A> {
  if (state.finished) return state;
  const answered = [...state.answered, { question, answer, correct }];
  const finished = !state.endless && answered.length >= state.targetCount;
  return { ...state, answered, finished };
}

export function finishFlow<Q, A>(state: LessonFlowState<Q, A>): LessonFlowState<Q, A> {
  if (!state.endless || state.finished) return state;
  return { ...state, finished: true };
}

export function scoreOf<Q, A>(answered: readonly AnsweredQuestion<Q, A>[]): number {
  if (answered.length === 0) return 0;
  const right = answered.filter((a) => a.correct).length;
  return right / answered.length;
}

export function passedLesson<Q, A>(state: LessonFlowState<Q, A>): boolean {
  return !state.endless && state.graded && state.finished && scoreOf(state.answered) >= PASS_THRESHOLD;
}

export function progressSegments<Q, A>(state: LessonFlowState<Q, A>): ('upcoming' | 'right' | 'wrong')[] {
  const total = state.endless ? state.answered.length : state.targetCount;
  const segments: ('upcoming' | 'right' | 'wrong')[] = [];
  for (let i = 0; i < total; i++) {
    const a = state.answered[i];
    segments.push(a ? (a.correct ? 'right' : 'wrong') : 'upcoming');
  }
  return segments;
}
