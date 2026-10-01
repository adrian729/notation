import { describe, expect, it } from 'vitest';
import { generateQuestion, type IdentificationOptions } from '@/exercises/interval-identification';
import { intervalById, tokenMidi } from '@/exercises/shared';
import { pitchToMidi } from '@polyhymnia/mnx';

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

interface Case {
  label: string;
  options: IdentificationOptions;
}

const CASES: Case[] = [
  {
    label: 'ascending, simple range',
    options: {
      intervals: ['m2', 'M3', 'P5', 'M7'],
      playingModes: ['asc'],
      range: { low: 'C3', high: 'C6' },
      tempo: 'medium',
      questionCount: 10,
      autoNext: false,
    },
  },
  {
    label: 'descending, simple range',
    options: {
      intervals: ['m2', 'M3', 'P5', 'M7'],
      playingModes: ['desc'],
      range: { low: 'C3', high: 'C6' },
      tempo: 'medium',
      questionCount: 10,
      autoNext: false,
    },
  },
  {
    label: 'harmonic, simple range',
    options: {
      intervals: ['m3', 'M6', 'TT'],
      playingModes: ['harmonic'],
      range: { low: 'C3', high: 'C6' },
      tempo: 'medium',
      questionCount: 10,
      autoNext: false,
    },
  },
  {
    label: 'mixed modes, compound range',
    options: {
      intervals: ['m9', 'M9', 'P11'],
      playingModes: ['asc', 'desc', 'harmonic'],
      range: { low: 'G2', high: 'C6' },
      tempo: 'medium',
      questionCount: 10,
      autoNext: false,
    },
  },
];

describe('interval identification generateQuestion', () => {
  it.each(CASES)('$label', ({ options }) => {
    const low = tokenMidi(options.range.low)!;
    const high = tokenMidi(options.range.high)!;
    const rng = mulberry32(options.range.low.length * 1000 + options.range.high.charCodeAt(0));
    let last;
    for (let i = 0; i < 20; i++) {
      const question = generateQuestion(options, rng, last);
      const spec = intervalById(question.size);
      const fromMidi = tokenMidi(question.tones.from)!;
      const toMidi = tokenMidi(question.tones.to)!;

      expect(Math.abs(toMidi - fromMidi)).toBe(spec.semitones);
      expect(pitchToMidi(question.tones.root)).toBeGreaterThanOrEqual(low);
      expect(pitchToMidi(question.tones.root)).toBeLessThanOrEqual(high);
      expect(pitchToMidi(question.tones.other)).toBeGreaterThanOrEqual(low);
      expect(pitchToMidi(question.tones.other)).toBeLessThanOrEqual(high);

      if (question.mode === 'asc') expect(toMidi).toBeGreaterThan(fromMidi);
      if (question.mode === 'desc') expect(toMidi).toBeLessThan(fromMidi);

      last = { mode: question.mode, from: question.tones.from, to: question.tones.to };
    }
  });
});
