import { intervalDisplayName } from './intervals.js';
import { parsePitch, pitchToMidi, STEP_LETTERS, stepNumberOf, type Pitch } from '@polyhymnia/notation-model';

export type SpelledPitch = Pick<Required<Pitch>, 'step' | 'alter' | 'octave'>;

const ACCIDENTAL_TOKEN: Record<number, string> = {
  '-2': 'bb',
  '-1': 'b',
  '0': '',
  '1': '#',
  '2': '##',
};

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

const ENHARMONIC_ALTERNATE: Partial<Record<string, { step: SpelledPitch['step']; alter: number }>> = {
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

export function pitchToToken(pitch: SpelledPitch): string {
  const acc = ACCIDENTAL_TOKEN[pitch.alter];
  if (acc === undefined) throw new RangeError(`unrepresentable accidental: ${pitch.alter}`);
  return `${pitch.step}${acc}${pitch.octave}`;
}

export function tokenMidi(token: string): number | undefined {
  try {
    return pitchToMidi(parsePitch(token));
  } catch {
    return undefined;
  }
}

export function chromaticTokens(lowMidi: number, highMidi: number): string[] {
  const tokens: string[] = [];
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    const pitchClass = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    tokens.push(pitchToToken({ ...PREFERRED_ROOT_PITCHES[pitchClass]!, octave }));
  }
  return tokens;
}

export function enharmonicAlternate(pitch: SpelledPitch): SpelledPitch | undefined {
  const key = `${pitch.step}${pitch.alter === 1 ? '#' : pitch.alter === -1 ? 'b' : ''}`;
  const alt = ENHARMONIC_ALTERNATE[key];
  if (!alt || pitch.alter === 0) return undefined;
  const rootMidi = pitchToMidi(pitch);
  const naturalMidi = pitchToMidi({ step: alt.step, alter: alt.alter, octave: pitch.octave });
  const octaveShift = Math.round((rootMidi - naturalMidi) / 12);
  return { step: alt.step, alter: alt.alter, octave: pitch.octave + octaveShift };
}

function spellAtDegree(root: SpelledPitch, degree: number, semitones: number, direction: 1 | -1): SpelledPitch {
  const letterSteps = (degree - 1) * direction;
  const rootLI = stepNumberOf(root.step);
  const rawLI = rootLI + letterSteps;
  const targetLI = ((rawLI % 7) + 7) % 7;
  const octaveAdd = Math.floor(rawLI / 7);
  const targetLetter = STEP_LETTERS[targetLI]!;
  const targetOctave = root.octave + octaveAdd;
  const rootMidi = pitchToMidi(root);
  const targetMidi = rootMidi + semitones * direction;
  const targetNatural = pitchToMidi({ step: targetLetter, octave: targetOctave });
  const alter = targetMidi - targetNatural;
  return { step: targetLetter, alter, octave: targetOctave };
}

export interface IntervalSpec {
  degreeOptions: readonly number[];
  semitones: number;
}

export interface SpelledMember {
  pitch: SpelledPitch;
  degree: number;
}

export interface RelativeSpelling {
  pinned: SpelledPitch;
  members: SpelledMember[];
}

function spellMember(
  pinned: SpelledPitch,
  spec: IntervalSpec,
  direction: 1 | -1,
  maxAlter: number,
): SpelledMember | undefined {
  let best: SpelledMember | undefined;
  let bestAbs = Infinity;
  for (const degree of spec.degreeOptions) {
    const pitch = spellAtDegree(pinned, degree, spec.semitones, direction);
    if (Math.abs(pitch.alter) <= maxAlter && Math.abs(pitch.alter) < bestAbs) {
      bestAbs = Math.abs(pitch.alter);
      best = { pitch, degree };
    }
  }
  return best;
}

export function spellRelative(
  pinned: SpelledPitch,
  specs: readonly IntervalSpec[],
  direction: 1 | -1,
  maxAlter: number,
): RelativeSpelling | undefined {
  const candidates = [pinned, enharmonicAlternate(pinned)].filter((p): p is SpelledPitch => p !== undefined);
  let best: RelativeSpelling | undefined;
  let bestCost = Infinity;
  for (const candidate of candidates) {
    const members: SpelledMember[] = [];
    let accidentals = 0;
    for (const spec of specs) {
      const member = spellMember(candidate, spec, direction, maxAlter);
      if (!member) break;
      members.push(member);
      accidentals += Math.abs(member.pitch.alter);
    }
    if (members.length < specs.length) continue;
    const cost = accidentals + Math.abs(candidate.alter) * 0.01;
    if (cost < bestCost) {
      bestCost = cost;
      best = { pinned: candidate, members };
    }
  }
  return best;
}

const MAJOR_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

function letterIndex(pitch: Pitch): number {
  return (pitch.octave ?? 4) * 7 + stepNumberOf(pitch.step);
}

export function writtenIntervalName(lowerToken: string, upperToken: string): string {
  const lower = parsePitch(lowerToken);
  const upper = parsePitch(upperToken);
  const degree = letterIndex(upper) - letterIndex(lower) + 1;
  const simple = (degree - 1) % 7;
  const octaves = Math.floor((degree - 1) / 7);
  const offset = pitchToMidi(upper) - pitchToMidi(lower) - MAJOR_SCALE_SEMITONES[simple]! - 12 * octaves;
  const perfect = simple === 0 || simple === 3 || simple === 4;
  const quality =
    offset > 0 ? 'A' : perfect ? (offset === 0 ? 'P' : 'd') : offset === 0 ? 'M' : offset === -1 ? 'm' : 'd';
  return intervalDisplayName(degree, quality);
}

export function pickPreferredRoot(pitchClass: number, octave: number, rng: () => number): SpelledPitch {
  const options = PREFERRED_ROOT_PITCHES.filter((p) => ((pitchToMidi(p) % 12) + 12) % 12 === pitchClass);
  const chosen = options[Math.floor(rng() * options.length)] ?? PREFERRED_ROOT_PITCHES[0]!;
  return { ...chosen, octave };
}
