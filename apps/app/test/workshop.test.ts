import { describe, expect, it } from 'vitest';
import { LESSONS } from '@/exercises/interval-comparison/workshop';
import { generateQuestion } from '@/exercises/interval-comparison/generator';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('workshop lessons', () => {
  it('every lesson can generate a batch of questions', () => {
    for (const lesson of LESSONS) {
      const rng = mulberry32(lesson.id.length * 1000 + lesson.id.charCodeAt(0));
      expect(() => {
        let last;
        for (let i = 0; i < 20; i++) {
          const question = generateQuestion(lesson.options, rng, last);
          last = { mode: question.mode, sizeA: question.a.size, sizeB: question.b.size };
        }
      }, `lesson ${lesson.id}`).not.toThrow();
    }
  });
});
