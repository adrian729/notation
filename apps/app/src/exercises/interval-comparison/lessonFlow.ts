export const BASE_QUESTION_COUNT = 10;
export const PASS_THRESHOLD = 0.8;
export const SUPPLEMENTARY_COUNT = 5;

export interface AnsweredQuestion {
  correct: boolean;
}

export interface LessonFlowState {
  answered: AnsweredQuestion[];
  targetCount: number;
  finished: boolean;
  supplementApplied: boolean;
  endless: boolean;
}

export function createLessonFlow(options: { questionCount: number | 'endless' }): LessonFlowState {
  const endless = options.questionCount === 'endless';
  return {
    answered: [],
    targetCount: endless ? Infinity : (options.questionCount as number),
    finished: false,
    supplementApplied: false,
    endless,
  };
}

export function recordAnswer(state: LessonFlowState, correct: boolean): LessonFlowState {
  if (state.finished) return state;
  const answered = [...state.answered, { correct }];
  let { targetCount, supplementApplied } = state;

  if (
    !state.endless &&
    !supplementApplied &&
    answered.length === BASE_QUESTION_COUNT &&
    targetCount === BASE_QUESTION_COUNT
  ) {
    const score = scoreOf(answered);
    if (score < PASS_THRESHOLD) {
      targetCount = BASE_QUESTION_COUNT + SUPPLEMENTARY_COUNT;
      supplementApplied = true;
    }
  }

  const finished = !state.endless && answered.length >= targetCount;
  return { ...state, answered, targetCount, supplementApplied, finished };
}

export function scoreOf(answered: readonly AnsweredQuestion[]): number {
  if (answered.length === 0) return 0;
  const right = answered.filter((a) => a.correct).length;
  return right / answered.length;
}

export function passedLesson(state: LessonFlowState): boolean {
  return !state.endless && state.finished && scoreOf(state.answered) >= PASS_THRESHOLD;
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
