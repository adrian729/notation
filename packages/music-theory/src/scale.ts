import { pitchToMidi, STEP_LETTERS, stepNumberOf } from './pitch.js';
import type { Pitch, StepLetter } from './pitch.js';

export type ScaleName = 'major' | 'naturalMinor' | 'harmonicMinor' | 'melodicMinor';

const PATTERNS: Record<ScaleName, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10, 12],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11, 12],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11, 12],
};

const MAJOR_FIFTHS_BASE = [0, 2, 4, -1, 1, 3, 5] as const;

export const SHARP_ORDER: readonly StepLetter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
export const FLAT_ORDER: readonly StepLetter[] = [...SHARP_ORDER].reverse();

function letterOf(n: number): StepLetter {
  return STEP_LETTERS[((n % 7) + 7) % 7]!;
}

function clampAlter(alter: number): number {
  return Math.max(-2, Math.min(2, alter));
}

export function scalePitches(root: Pitch, scale: ScaleName, descending = false): Pitch[] {
  const pattern = scale === 'melodicMinor' && descending ? PATTERNS.naturalMinor : PATTERNS[scale];
  const rootStep = stepNumberOf(root.step);
  const rootSemitone = pitchToMidi(root);

  const ascending = pattern.map((semitones, degree): Pitch => {
    const letterIndex = rootStep + degree;
    const step = letterOf(letterIndex);
    const octave = root.octave + Math.floor(letterIndex / 7);
    const natural = pitchToMidi({ step, octave });
    const alter = clampAlter(rootSemitone + semitones - natural);
    return alter === 0 ? { step, octave } : { step, alter, octave };
  });

  return descending ? ascending.reverse() : ascending;
}

export function scaleFifths(root: Pitch, scale: ScaleName): number {
  const majorFifths = MAJOR_FIFTHS_BASE[stepNumberOf(root.step)]! + 7 * (root.alter ?? 0);
  const fifths = scale === 'major' ? majorFifths : majorFifths - 3;
  return Math.max(-7, Math.min(7, fifths));
}

export function keyAlterations(fifths: number): ReadonlyMap<StepLetter, -1 | 1> {
  const map = new Map<StepLetter, -1 | 1>();
  const count = Math.min(7, Math.abs(fifths));
  const order = fifths >= 0 ? SHARP_ORDER : FLAT_ORDER;
  for (let i = 0; i < count; i += 1) map.set(order[i]!, fifths >= 0 ? 1 : -1);
  return map;
}

export function keyAlterOf(fifths: number, step: StepLetter): -1 | 0 | 1 {
  return keyAlterations(fifths).get(step) ?? 0;
}
