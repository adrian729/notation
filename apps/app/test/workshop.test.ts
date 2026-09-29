import { describe, expect, it } from 'vitest';
import * as chord from '@/exercises/chord-identification';
import * as comparison from '@/exercises/interval-comparison';
import * as identification from '@/exercises/interval-identification';
import * as multi from '@/exercises/multi-interval-identification';

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

interface Lesson {
  id: string;
  options: unknown;
}

function row<O, Q, S>(
  name: string,
  count: number,
  lessons: readonly { id: string; options: O }[],
  generate: (options: O, rng: () => number, last?: S) => Q,
  signature: (q: Q) => S,
) {
  const run = (lesson: Lesson) => {
    const rng = mulberry32(lesson.id.length * 1000 + lesson.id.charCodeAt(0));
    let last: S | undefined;
    for (let i = 0; i < 20; i++) {
      last = signature(generate(lesson.options as O, rng, last));
    }
  };
  return [name, count, lessons as readonly Lesson[], run] as const;
}

const rows = [
  row('interval-comparison', 80, comparison.LESSONS, comparison.generateQuestion, comparison.questionSignature),
  row(
    'interval-identification',
    20,
    identification.LESSONS,
    identification.generateQuestion,
    identification.questionSignature,
  ),
  row('multi-interval-identification', 36, multi.LESSONS, multi.generateQuestion, multi.questionSignature),
  row('chord-identification', 36, chord.LESSONS, chord.generateQuestion, chord.questionSignature),
];

describe.each(rows)('%s workshop lessons', (_name, count, lessons, run) => {
  it('has the expected unique lessons, each generating a batch of questions', () => {
    expect(lessons).toHaveLength(count);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(count);
    for (const lesson of lessons) {
      expect(() => run(lesson), `lesson ${lesson.id}`).not.toThrow();
    }
  });
});
