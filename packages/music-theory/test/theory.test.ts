import { describe, expect, it } from 'vitest';
import {
  consonanceOf,
  intervalBetween,
  keyAlterations,
  keyAlterOf,
  midiOf,
  midiToPitch,
  parsePitch,
  scaleFifths,
  toMnxPitch,
  transpose,
  tryMidiOf,
} from '../src/index.js';

describe('parsePitch', () => {
  it('omits alter when natural', () => {
    expect(parsePitch('C4')).toEqual({ step: 'C', octave: 4 });
    expect(parsePitch('Bb3')).toEqual({ step: 'B', alter: -1, octave: 3 });
    expect(toMnxPitch({ step: 'D', alter: 0, octave: 2 })).toEqual({ step: 'D', octave: 2 });
  });
});

describe('midiOf / tryMidiOf', () => {
  it('accepts numbers, tokens and pitches', () => {
    expect(midiOf('C4')).toBe(60);
    expect(midiOf({ step: 'A', alter: 1, octave: 4 })).toBe(70);
    expect(midiOf(61)).toBe(61);
    expect(midiToPitch(61)).toEqual({ step: 'C', alter: 1, octave: 4 });
  });

  it('throws or returns undefined on bad input', () => {
    expect(() => midiOf('H4')).toThrow();
    expect(() => midiOf(Number.NaN)).toThrow();
    expect(tryMidiOf('H4')).toBeUndefined();
    expect(tryMidiOf(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(tryMidiOf('E2')).toBe(40);
  });
});

describe('intervalBetween', () => {
  it.each([
    ['C4', 'C4', { degree: 1, quality: 'P', semitones: 0, direction: 1 }],
    ['G4', 'C4', { degree: 5, quality: 'P', semitones: 7, direction: -1 }],
    ['C4', 'E5', { degree: 10, quality: 'M', semitones: 16, direction: 1 }],
    ['C#4', 'Db4', { degree: 2, quality: 'd', semitones: 0, direction: 1 }],
    ['C4', 'F#4', { degree: 4, quality: 'A', semitones: 6, direction: 1 }],
  ] as const)('%s to %s', (from, to, expected) => {
    expect(intervalBetween(parsePitch(from), parsePitch(to))).toEqual(expected);
  });

  it('classifies compounds through the simple reduction', () => {
    expect(consonanceOf(16)).toBe('imperfect');
    expect(consonanceOf(24)).toBe('perfect');
    expect(consonanceOf(14)).toBe('dissonant');
  });
});

describe('transpose', () => {
  it.each([
    ['B3', { degreeOptions: [2], semitones: 1 }, 1, 'C4'],
    ['F#4', { degreeOptions: [3], semitones: 4 }, 1, 'A#4'],
    ['Eb4', { degreeOptions: [5], semitones: 7 }, -1, 'Ab3'],
  ] as const)('%s', (root, spec, dir, expected) => {
    const result = transpose(parsePitch(root), spec, dir);
    expect(toMnxPitch(result)).toEqual(parsePitch(expected));
  });
});

describe('keys', () => {
  it('lists sharps and flats in order, clamped to seven', () => {
    expect([...keyAlterations(3)]).toEqual([
      ['F', 1],
      ['C', 1],
      ['G', 1],
    ]);
    expect([...keyAlterations(-2)]).toEqual([
      ['B', -1],
      ['E', -1],
    ]);
    expect(keyAlterations(9).size).toBe(7);
    expect(keyAlterOf(-1, 'B')).toBe(-1);
    expect(keyAlterOf(-1, 'F')).toBe(0);
  });

  it('derives fifths for a scale root', () => {
    expect(scaleFifths(parsePitch('D4'), 'major')).toBe(2);
    expect(scaleFifths(parsePitch('A4'), 'naturalMinor')).toBe(0);
    expect(scaleFifths(parsePitch('G#4'), 'major')).toBe(7);
  });
});
