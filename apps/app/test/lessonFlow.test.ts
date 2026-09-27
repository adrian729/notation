import { describe, expect, it } from 'vitest';
import { createLessonFlow, recordAnswer, scoreOf, passedLesson } from '@/exercises/interval-comparison/lessonFlow';

function runAnswers(pattern: boolean[]) {
  let state = createLessonFlow({ questionCount: 10 });
  for (const correct of pattern) state = recordAnswer(state, correct);
  return state;
}

describe('lesson flow reducer', () => {
  it('passes at exactly 80% after 10 questions with no supplementary questions', () => {
    const state = runAnswers([true, true, true, true, true, true, true, true, false, false]);
    expect(state.finished).toBe(true);
    expect(state.supplementApplied).toBe(false);
    expect(scoreOf(state.answered)).toBeCloseTo(0.8);
    expect(passedLesson(state)).toBe(true);
  });

  it('adds 5 supplementary questions when below 80% after 10', () => {
    const state = runAnswers([true, true, true, true, true, true, false, false, false, false]);
    expect(state.finished).toBe(false);
    expect(state.supplementApplied).toBe(true);
    expect(state.targetCount).toBe(15);
  });

  it('scores the whole session, including supplementary questions, at the end', () => {
    const belowThreshold = [true, true, true, true, true, true, false, false, false, false];
    let state = runAnswers(belowThreshold);
    for (const correct of [true, true, true, true, true]) state = recordAnswer(state, correct);
    expect(state.finished).toBe(true);
    expect(state.answered).toHaveLength(15);
    expect(scoreOf(state.answered)).toBeCloseTo(11 / 15);
  });

  it('never applies supplementary questions twice', () => {
    const belowThreshold = [true, true, true, true, true, true, false, false, false, false];
    let state = runAnswers(belowThreshold);
    for (const correct of [false, false, false, false, false]) state = recordAnswer(state, correct);
    expect(state.targetCount).toBe(15);
    expect(passedLesson(state)).toBe(false);
  });

  it('does not apply supplementary questions in endless mode', () => {
    let state = createLessonFlow({ questionCount: 'endless' });
    for (let i = 0; i < 12; i++) state = recordAnswer(state, i % 2 === 0);
    expect(state.finished).toBe(false);
    expect(state.supplementApplied).toBe(false);
  });
});
