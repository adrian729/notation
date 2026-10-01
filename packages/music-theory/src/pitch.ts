export type StepLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface Pitch {
  step: StepLetter;
  alter?: number;
  octave: number;
}

export type SpelledPitch = Required<Pitch>;

export type PitchLike = number | Pitch | string;

const PITCH_RE = /^([A-Ga-g])(##|#|bb|b)?(-?\d+)$/;

const ALTER_BY_TOKEN: Record<string, number> = {
  '': 0,
  '#': 1,
  '##': 2,
  b: -1,
  bb: -2,
};

const ACCIDENTAL_TOKEN: Record<number, string> = {
  '-2': 'bb',
  '-1': 'b',
  '0': '',
  '1': '#',
  '2': '##',
};

export const STEP_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const satisfies readonly StepLetter[];

const NATURAL_SEMITONES: Record<StepLetter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const PREFERRED_ROOT_PITCHES: readonly SpelledPitch[] = [
  { step: 'C', alter: 0, octave: 0 },
  { step: 'C', alter: 1, octave: 0 },
  { step: 'D', alter: 0, octave: 0 },
  { step: 'E', alter: -1, octave: 0 },
  { step: 'E', alter: 0, octave: 0 },
  { step: 'F', alter: 0, octave: 0 },
  { step: 'F', alter: 1, octave: 0 },
  { step: 'G', alter: 0, octave: 0 },
  { step: 'A', alter: -1, octave: 0 },
  { step: 'A', alter: 0, octave: 0 },
  { step: 'B', alter: -1, octave: 0 },
  { step: 'B', alter: 0, octave: 0 },
];

const ENHARMONIC_ALTERNATE: Partial<Record<string, { step: StepLetter; alter: number }>> = {
  'C#': { step: 'D', alter: -1 },
  'D#': { step: 'E', alter: -1 },
  'F#': { step: 'G', alter: -1 },
  'G#': { step: 'A', alter: -1 },
  'A#': { step: 'B', alter: -1 },
  Db: { step: 'C', alter: 1 },
  Eb: { step: 'D', alter: 1 },
  Gb: { step: 'F', alter: 1 },
  Ab: { step: 'G', alter: 1 },
  Bb: { step: 'A', alter: 1 },
};

export function parsePitch(token: string): Pitch {
  const match = PITCH_RE.exec(token);
  if (!match) throw new SyntaxError(`Invalid pitch token: ${JSON.stringify(token)}`);
  const [, letter, accidental, octave] = match;
  const alter = ALTER_BY_TOKEN[accidental ?? ''] ?? 0;
  const step = letter!.toUpperCase() as StepLetter;
  return alter === 0
    ? { step, octave: Number.parseInt(octave!, 10) }
    : { step, alter, octave: Number.parseInt(octave!, 10) };
}

export function parseSpelledPitch(token: string): SpelledPitch {
  return { alter: 0, ...parsePitch(token) };
}

export function toMnxPitch(pitch: Pitch): Pitch {
  return pitch.alter === 0 || pitch.alter === undefined
    ? { step: pitch.step, octave: pitch.octave }
    : { step: pitch.step, alter: pitch.alter, octave: pitch.octave };
}

export function spelled(pitch: Pitch): SpelledPitch {
  return { step: pitch.step, alter: pitch.alter ?? 0, octave: pitch.octave };
}

export function stepNumberOf(step: StepLetter): number {
  return STEP_LETTERS.indexOf(step);
}

export function pitchToMidi(pitch: Pitch): number {
  return 12 * (pitch.octave + 1) + NATURAL_SEMITONES[pitch.step] + (pitch.alter ?? 0);
}

export function midiOf(pitch: PitchLike): number {
  const midi = typeof pitch === 'number' ? pitch : pitchToMidi(typeof pitch === 'string' ? parsePitch(pitch) : pitch);
  if (!Number.isFinite(midi)) throw new RangeError('invalid pitch');
  return midi;
}

export function tryMidiOf(pitch: PitchLike): number | undefined {
  try {
    return midiOf(pitch);
  } catch {
    return undefined;
  }
}

export function formatPitch(pitch: Pitch): string {
  const acc = ACCIDENTAL_TOKEN[pitch.alter ?? 0];
  if (acc === undefined) throw new RangeError(`unrepresentable accidental: ${pitch.alter}`);
  return `${pitch.step}${acc}${pitch.octave}`;
}

export function pitchClass(pitch: PitchLike): number {
  return ((midiOf(pitch) % 12) + 12) % 12;
}

export function midiToPitch(midi: number): SpelledPitch {
  const octave = Math.floor(midi / 12) - 1;
  return { ...PREFERRED_ROOT_PITCHES[((midi % 12) + 12) % 12]!, octave };
}

export function chromaticRange(lowMidi: number, highMidi: number): SpelledPitch[] {
  const pitches: SpelledPitch[] = [];
  for (let midi = lowMidi; midi <= highMidi; midi++) pitches.push(midiToPitch(midi));
  return pitches;
}

export function enharmonicAlternate(pitch: Pitch): SpelledPitch | undefined {
  const root = spelled(pitch);
  const key = `${root.step}${root.alter === 1 ? '#' : root.alter === -1 ? 'b' : ''}`;
  const alt = ENHARMONIC_ALTERNATE[key];
  if (!alt || root.alter === 0) return undefined;
  const rootMidi = pitchToMidi(root);
  const naturalMidi = pitchToMidi({ step: alt.step, alter: alt.alter, octave: root.octave });
  const octaveShift = Math.round((rootMidi - naturalMidi) / 12);
  return { step: alt.step, alter: alt.alter, octave: root.octave + octaveShift };
}
