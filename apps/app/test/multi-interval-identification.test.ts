import { describe, expect, it } from 'vitest';
import { intervalById, STEP_LETTERS, tryMidiOf } from '@polyhymnia/music-theory';
import {
  generateQuestion,
  normalizeOptions,
  setById,
  type MultiIntervalOptions,
  validateOptions,
} from '@/exercises/multi-interval-identification';
import { deterministicRng, rangeForIntervals } from '@/exercises/shared';

function letterIndex(token: string): number {
  const letter = token[0]!;
  const octave = Number(token.match(/-?\d+$/)![0]);
  return STEP_LETTERS.indexOf(letter as (typeof STEP_LETTERS)[number]) + 7 * octave;
}

const base = { tempo: 'medium', questionCount: 10, autoNext: false } as const;

const CASES: { label: string; options: MultiIntervalOptions }[] = [
  {
    label: 'ascending, simple, 3 notes',
    options: {
      ...base,
      intervals: setById('simple').intervals,
      range: rangeForIntervals(setById('simple').intervals),
      noteCounts: [3],
      playingModes: ['asc'],
    },
  },
  {
    label: 'descending, sevenths, 3 notes',
    options: {
      ...base,
      intervals: setById('sevenths').intervals,
      range: rangeForIntervals(setById('sevenths').intervals),
      noteCounts: [3],
      playingModes: ['desc'],
    },
  },
  {
    label: 'ascending, compound, 4 notes',
    options: {
      ...base,
      intervals: setById('compound').intervals,
      range: rangeForIntervals(setById('compound').intervals),
      noteCounts: [4],
      playingModes: ['asc'],
    },
  },
  {
    label: 'mixed, 3-5 notes, all intervals',
    options: {
      ...base,
      intervals: setById('all').intervals,
      range: rangeForIntervals(setById('all').intervals),
      noteCounts: [3, 4, 5],
      playingModes: ['asc', 'desc', 'harmonic', 'random'],
    },
  },
];

describe('multi-interval generateQuestion', () => {
  for (const { label, options } of CASES) {
    it(label, () => {
      const rng = deterministicRng(7);
      const low = tryMidiOf(options.range.low)!;
      const high = tryMidiOf(options.range.high)!;
      let last: string | undefined;
      for (let i = 0; i < 200; i++) {
        const q = generateQuestion(options, rng, last);
        last = q.rows.map((row) => row.size).join(',');
        const ref = tryMidiOf(q.reference)!;
        const midis = q.rows.map((row) => tryMidiOf(row.pitch)!);
        expect(options.noteCounts).toContain(q.rows.length + 1);
        expect(options.playingModes).toContain(q.mode);
        expect(midis.every((m) => m > ref)).toBe(true);
        expect(midis).toEqual([...midis].sort((a, b) => a - b));
        expect(new Set(midis).size).toBe(midis.length);
        q.rows.forEach((row, k) => {
          const spec = intervalById(row.size);
          expect(midis[k]).toBe(ref + spec.semitones);
          expect(spec.degreeOptions).toContain(letterIndex(row.pitch) - letterIndex(q.reference) + 1);
        });
        const ascending = [q.reference, ...q.rows.map((row) => row.pitch)];
        if (q.mode === 'desc') expect(q.sounding).toEqual([...ascending].reverse());
        else if (q.mode === 'random') {
          expect(q.sounding[0]).toBe(q.reference);
          expect([...q.sounding].sort()).toEqual([...ascending].sort());
        } else expect(q.sounding).toEqual(ascending);
        expect(Math.min(ref, ...midis)).toBeGreaterThanOrEqual(low);
        expect(Math.max(...midis)).toBeLessThanOrEqual(high);
      }
    });
  }
});

describe('custom interval picking', () => {
  it('widens the range as soon as one picked interval is compound', () => {
    expect(rangeForIntervals(['m2', 'P8'])).toEqual({ low: 'C3', high: 'C6' });
    expect(rangeForIntervals(['m2', 'P15'])).toEqual({ low: 'G2', high: 'C6' });
  });

  it('needs one distinct interval per note above the lowest', () => {
    const options = {
      intervals: ['m3', 'P5'] as const,
      noteCounts: [5] as const,
      playingModes: ['asc'] as const,
      range: rangeForIntervals(['m3']),
      tempo: 'medium' as const,
      questionCount: 10 as const,
    };
    expect(validateOptions(options).errors).toEqual(['Select at least 4 intervals for the chosen number of notes.']);
    expect(validateOptions({ ...options, noteCounts: [3] }).valid).toBe(true);
  });

  it('never normalizes to a note count the picked intervals cannot fill', () => {
    const options = {
      intervals: ['m3', 'P5'] as const,
      noteCounts: [3, 5] as const,
      playingModes: ['asc'] as const,
      range: rangeForIntervals(['m3']),
    };
    const normalized = normalizeOptions(options);
    expect(normalized.noteCounts).toEqual([3]);
    expect(() => generateQuestion(normalized, deterministicRng(3))).not.toThrow();
  });
});
