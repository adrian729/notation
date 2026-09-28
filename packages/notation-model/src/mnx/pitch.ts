import type { Pitch } from './types.js';

const PITCH_RE = /^([A-Ga-g])(##|#|bb|b)?(-?\d+)$/;

const ALTER_BY_TOKEN: Record<string, number> = {
  '': 0,
  '#': 1,
  '##': 2,
  b: -1,
  bb: -2,
};

export function parsePitch(token: string): Pitch {
  const match = PITCH_RE.exec(token);
  if (!match) throw new SyntaxError(`Invalid pitch token: ${JSON.stringify(token)}`);
  const [, letter, accidental, octave] = match;
  const alter = ALTER_BY_TOKEN[accidental ?? ''] ?? 0;
  const step = letter!.toUpperCase() as Pitch['step'];
  return alter === 0
    ? { step, octave: Number.parseInt(octave!, 10) }
    : { step, alter, octave: Number.parseInt(octave!, 10) };
}

export const STEP_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const satisfies readonly Pitch['step'][];

const NATURAL_SEMITONES: Record<Pitch['step'], number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function stepNumberOf(step: Pitch['step']): number {
  return STEP_LETTERS.indexOf(step);
}

export function pitchToMidi(pitch: Pitch): number {
  return 12 * (pitch.octave + 1) + NATURAL_SEMITONES[pitch.step] + (pitch.alter ?? 0);
}
