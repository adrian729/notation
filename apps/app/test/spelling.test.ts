import { describe, expect, it } from 'vitest';
import { pitchToToken, spellRelative, writtenIntervalName, type SpelledPitch } from '@/exercises/shared/spelling';

function pitch(token: string): SpelledPitch {
  const match = /^([A-G])(#|b)?(-?\d+)$/.exec(token)!;
  const [, step, acc, octave] = match;
  const alter = acc === '#' ? 1 : acc === 'b' ? -1 : 0;
  return { step: step as SpelledPitch['step'], alter, octave: Number(octave) };
}

interface Case {
  root: string;
  degreeOptions: number[];
  semitones: number;
  direction: 1 | -1;
  expectedOther: string;
  label: string;
}

const CASES: Case[] = [
  { label: 'C4 M3 up', root: 'C4', degreeOptions: [3], semitones: 4, direction: 1, expectedOther: 'E4' },
  { label: 'Eb4 M3 up', root: 'Eb4', degreeOptions: [3], semitones: 4, direction: 1, expectedOther: 'G4' },
  { label: 'C4 m3 down', root: 'C4', degreeOptions: [3], semitones: 3, direction: -1, expectedOther: 'A3' },
  { label: 'C4 M3 down', root: 'C4', degreeOptions: [3], semitones: 4, direction: -1, expectedOther: 'Ab3' },
  { label: 'C4 M9 up (compound)', root: 'C4', degreeOptions: [9], semitones: 14, direction: 1, expectedOther: 'D5' },
  { label: 'F#4 m2 up', root: 'F#4', degreeOptions: [2], semitones: 1, direction: 1, expectedOther: 'G4' },
  {
    label: 'C4 tritone up prefers A4',
    root: 'C4',
    degreeOptions: [4, 5],
    semitones: 6,
    direction: 1,
    expectedOther: 'F#4',
  },
  {
    label: 'F#4 tritone up prefers d5',
    root: 'F#4',
    degreeOptions: [4, 5],
    semitones: 6,
    direction: 1,
    expectedOther: 'C5',
  },
  {
    label: 'Ab4 M7 up avoids double accidental',
    root: 'Ab4',
    degreeOptions: [7],
    semitones: 11,
    direction: 1,
    expectedOther: 'G5',
  },
  {
    label: 'G#4 M7 up respells root to avoid F##',
    root: 'G#4',
    degreeOptions: [7],
    semitones: 11,
    direction: 1,
    expectedOther: 'G5',
  },
];

describe('spellRelative', () => {
  it.each(CASES)('$label', ({ root, degreeOptions, semitones, direction, expectedOther }) => {
    const result = spellRelative(pitch(root), [{ degreeOptions, semitones }], direction, 2)!;
    expect(pitchToToken(result.members[0]!.pitch)).toBe(expectedOther);
    expect(Math.abs(result.members[0]!.pitch.alter)).toBeLessThanOrEqual(1);
    expect(Math.abs(result.pinned.alter)).toBeLessThanOrEqual(1);
  });

  it('respells the root when the given spelling needs double accidentals', () => {
    const result = spellRelative(
      pitch('D#4'),
      [
        { degreeOptions: [3], semitones: 4 },
        { degreeOptions: [5], semitones: 7 },
        { degreeOptions: [7], semitones: 11 },
      ],
      1,
      2,
    )!;
    expect([pitchToToken(result.pinned), ...result.members.map((m) => pitchToToken(m.pitch))]).toEqual([
      'Eb4',
      'G4',
      'Bb4',
      'D5',
    ]);
  });
});

describe('writtenIntervalName', () => {
  it.each([
    ['F#3', 'C5', 'Diminished 12th'],
    ['C4', 'F#5', 'Augmented 11th'],
    ['F#4', 'C5', 'Diminished 5th'],
    ['C4', 'F#4', 'Augmented 4th'],
    ['C4', 'Eb5', 'Minor 10th'],
  ])('%s to %s is %s', (lower, upper, name) => {
    expect(writtenIntervalName(lower, upper)).toBe(name);
  });
});
