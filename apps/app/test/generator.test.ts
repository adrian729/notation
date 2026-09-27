import { describe, expect, it } from 'vitest';
import { generateQuestion, validateExerciseOptions } from '@/exercises/interval-comparison/generator';
import { intervalById } from '@/exercises/interval-comparison/intervals';
import { pitchMidi } from '@/exercises/interval-comparison/spelling';
import { normalizeOptions } from '@/exercises/interval-comparison/options';
import { parsePitch } from '@polyhymnia/notation-model';

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

function midiOfToken(token: string): number {
  const p = parsePitch(token);
  return 12 * (p.octave + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[p.step] + (p.alter ?? 0);
}

const RELATIONSHIPS = ['common-first', 'common-either', 'nearby', 'no-common'] as const;

describe('generateQuestion invariants', () => {
  for (const toneRelationship of RELATIONSHIPS) {
    it(`holds for ${toneRelationship} over many seeded runs`, () => {
      const options = normalizeOptions({
        intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5'],
        playingModes: ['asc', 'desc', 'harmonic'],
        toneRelationship,
        range: { low: 'C3', high: 'C6' },
        tempo: 'medium',
        questionCount: 10,
        autoNext: false,
      });
      const low = midiOfToken(options.range.low);
      const high = midiOfToken(options.range.high);
      const rng = mulberry32(toneRelationship.length * 1000 + 7);

      for (let i = 0; i < 200; i++) {
        const q = generateQuestion(options, rng);
        const specA = intervalById(q.a.size);
        const specB = intervalById(q.b.size);

        expect(specA.semitones).not.toBe(specB.semitones);
        expect(options.intervals).toContain(q.a.size);
        expect(options.intervals).toContain(q.b.size);

        const aRoot = pitchMidi(q.a.root);
        const aOther = pitchMidi(q.a.other);
        const bRoot = pitchMidi(q.b.root);
        const bOther = pitchMidi(q.b.other);
        for (const m of [aRoot, aOther, bRoot, bOther]) {
          expect(m).toBeGreaterThanOrEqual(low);
          expect(m).toBeLessThanOrEqual(high);
        }

        expect(Math.abs(aOther - aRoot)).toBe(specA.semitones);
        expect(Math.abs(bOther - bRoot)).toBe(specB.semitones);

        expect(Math.abs(q.a.root.alter)).toBeLessThanOrEqual(1);
        expect(Math.abs(q.a.other.alter)).toBeLessThanOrEqual(1);
        expect(Math.abs(q.b.root.alter)).toBeLessThanOrEqual(1);
        expect(Math.abs(q.b.other.alter)).toBeLessThanOrEqual(1);

        if (toneRelationship === 'common-first') {
          expect(aRoot).toBe(bRoot);
          expect(q.a.root.step).toBe(q.b.root.step);
          expect(q.a.root.alter).toBe(q.b.root.alter);
        }
        if (toneRelationship === 'no-common') {
          const usedA = new Set([aRoot, aOther]);
          expect(usedA.has(bRoot)).toBe(false);
          expect(usedA.has(bOther)).toBe(false);
        }
        if (toneRelationship === 'nearby') {
          expect(Math.abs(aRoot - bRoot)).toBeGreaterThanOrEqual(1);
          expect(Math.abs(aRoot - bRoot)).toBeLessThanOrEqual(4);
        }

        const correctSpec = q.correct === 'A' ? specA : specB;
        const otherSpec = q.correct === 'A' ? specB : specA;
        expect(correctSpec.semitones).toBeGreaterThan(otherSpec.semitones);
      }
    });
  }

  it('regression: common-first with only m2+P5 can produce an Ab/G# common tone spelled identically in A and B', () => {
    const options = normalizeOptions({
      intervals: ['m2', 'P5'],
      playingModes: ['asc'],
      toneRelationship: 'common-first',
      range: { low: 'C2', high: 'C7' },
      tempo: 'medium',
      questionCount: 10,
      autoNext: false,
    });
    const rng = mulberry32(4242);
    let found = false;
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion(options, rng);
      const pitchClass = ((pitchMidi(q.a.root) % 12) + 12) % 12;
      if (pitchClass === 8) {
        found = true;
        expect(['A', 'G']).toContain(q.a.root.step);
        expect(q.a.root.step).toBe(q.b.root.step);
        expect(q.a.root.alter).toBe(q.b.root.alter);
        for (const tone of [q.a.root, q.a.other, q.b.root, q.b.other]) expect(Math.abs(tone.alter ?? 0)).toBeLessThanOrEqual(1);
        break;
      }
    }
    expect(found).toBe(true);
  });
});

describe('validateExerciseOptions', () => {
  const base = {
    intervals: ['m2', 'M2'] as const,
    playingModes: ['asc'] as const,
    toneRelationship: 'common-first' as const,
    tempo: 'medium' as const,
    questionCount: 10 as const,
    autoNext: false,
  };

  it('rejects low >= high without throwing', () => {
    expect(() => validateExerciseOptions({ ...base, range: { low: 'C6', high: 'C3' } })).not.toThrow();
    expect(validateExerciseOptions({ ...base, range: { low: 'C6', high: 'C3' } }).valid).toBe(false);
  });

  it('rejects an unparseable pitch token without throwing', () => {
    expect(() => validateExerciseOptions({ ...base, range: { low: 'not-a-pitch', high: 'C6' } })).not.toThrow();
    expect(validateExerciseOptions({ ...base, range: { low: 'not-a-pitch', high: 'C6' } }).valid).toBe(false);
  });

  it('rejects a range too narrow for the selected intervals without throwing', () => {
    const options = { ...base, intervals: ['M2', 'M9'] as const, range: { low: 'C4', high: 'D4' } };
    expect(() => validateExerciseOptions(options)).not.toThrow();
    expect(validateExerciseOptions(options).valid).toBe(false);
  });

  it('accepts a normal range', () => {
    expect(validateExerciseOptions({ ...base, range: { low: 'C3', high: 'C6' } }).valid).toBe(true);
  });
});
