import { describe, expect, it } from 'vitest';
import {
  consonanceOf,
  formatPitch,
  intervalBetween,
  intervalDisplayName,
  keyAlterations,
  keyAlterOf,
  midiOf,
  midiToPitch,
  parsePitch,
  scaleFifths,
  scalePitches,
  spellRelative,
  toMnxPitch,
  transpose,
  tryMidiOf,
} from '../src/index.js';

describe('parsePitch', () => {
  it.each([
    ['C4', { step: 'C', octave: 4 }],
    ['c4', { step: 'C', octave: 4 }],
    ['Bb3', { step: 'B', alter: -1, octave: 3 }],
    ['F##5', { step: 'F', alter: 2, octave: 5 }],
    ['Gbb2', { step: 'G', alter: -2, octave: 2 }],
  ] as const)('parses %s', (token, expected) => {
    expect(parsePitch(token)).toEqual(expected);
  });

  it.each(['CB4', 'H4', 'C', 'C#b4'])('rejects %s', (token) => {
    expect(() => parsePitch(token)).toThrow();
  });

  it('omits alter when natural', () => {
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

  it.each([
    ['F#3', 'C5', 'Diminished 12th'],
    ['C4', 'F#5', 'Augmented 11th'],
    ['F#4', 'C5', 'Diminished 5th'],
    ['C4', 'Eb5', 'Minor 10th'],
  ])('names %s to %s %s', (lower, upper, name) => {
    const { degree, quality } = intervalBetween(parsePitch(lower), parsePitch(upper));
    expect(intervalDisplayName(degree, quality)).toBe(name);
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

describe('spellRelative', () => {
  it.each([
    ['C4', [3], 4, 1, 'E4'],
    ['Eb4', [3], 4, 1, 'G4'],
    ['C4', [3], 3, -1, 'A3'],
    ['C4', [3], 4, -1, 'Ab3'],
    ['C4', [9], 14, 1, 'D5'],
    ['F#4', [2], 1, 1, 'G4'],
    ['C4', [4, 5], 6, 1, 'F#4'],
    ['F#4', [4, 5], 6, 1, 'C5'],
    ['Ab4', [7], 11, 1, 'G5'],
    ['G#4', [7], 11, 1, 'G5'],
  ] as const)('%s %o %i semitones dir %i is %s', (root, degreeOptions, semitones, direction, expected) => {
    const result = spellRelative(parsePitch(root), [{ degreeOptions, semitones }], direction, 2)!;
    expect(formatPitch(result.members[0]!.pitch)).toBe(expected);
    expect(Math.abs(result.members[0]!.pitch.alter)).toBeLessThanOrEqual(1);
    expect(Math.abs(result.pinned.alter)).toBeLessThanOrEqual(1);
  });

  it('respells the root when the given spelling needs double accidentals', () => {
    const specs = [
      { degreeOptions: [3], semitones: 4 },
      { degreeOptions: [5], semitones: 7 },
      { degreeOptions: [7], semitones: 11 },
    ];
    const result = spellRelative(parsePitch('D#4'), specs, 1, 2)!;
    expect([result.pinned, ...result.members.map((m) => m.pitch)].map(formatPitch)).toEqual(['Eb4', 'G4', 'Bb4', 'D5']);
  });
});

describe('scalePitches', () => {
  it.each([
    ['D4', 'major', false, 'D4 E4 F#4 G4 A4 B4 C#5 D5'],
    ['A3', 'harmonicMinor', false, 'A3 B3 C4 D4 E4 F4 G#4 A4'],
    ['A3', 'melodicMinor', false, 'A3 B3 C4 D4 E4 F#4 G#4 A4'],
    ['A3', 'melodicMinor', true, 'A4 G4 F4 E4 D4 C4 B3 A3'],
    ['C4', 'major', true, 'C5 B4 A4 G4 F4 E4 D4 C4'],
  ] as const)('%s %s descending=%s', (root, scale, descending, expected) => {
    expect(scalePitches(parsePitch(root), scale, descending).map(formatPitch).join(' ')).toBe(expected);
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
