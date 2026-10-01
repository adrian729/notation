import { enharmonicAlternate, midiToPitch, pitchToMidi, spelled, STEP_LETTERS, stepNumberOf } from './pitch.js';
import type { Pitch, SpelledPitch } from './pitch.js';

export type IntervalId =
  | 'm2'
  | 'M2'
  | 'm3'
  | 'M3'
  | 'P4'
  | 'TT'
  | 'P5'
  | 'm6'
  | 'M6'
  | 'm7'
  | 'M7'
  | 'P8'
  | 'm9'
  | 'M9'
  | 'm10'
  | 'M10'
  | 'P11'
  | 'A11'
  | 'P12'
  | 'm13'
  | 'M13'
  | 'm14'
  | 'M14'
  | 'P15';

export type IntervalQuality = 'm' | 'M' | 'P' | 'A' | 'd';

export type ConsonanceClass = 'perfect' | 'imperfect' | 'dissonant';

export interface IntervalSpec {
  degreeOptions: readonly number[];
  semitones: number;
}

export interface IntervalSize extends IntervalSpec {
  id: IntervalId;
  compound: boolean;
}

export interface IntervalBetween {
  degree: number;
  quality: IntervalQuality;
  semitones: number;
  direction: 1 | -1;
}

export interface SpelledMember {
  pitch: SpelledPitch;
  degree: number;
}

export interface RelativeSpelling {
  pinned: SpelledPitch;
  members: SpelledMember[];
}

export const INTERVAL_SIZES: readonly IntervalSize[] = [
  { id: 'm2', semitones: 1, degreeOptions: [2], compound: false },
  { id: 'M2', semitones: 2, degreeOptions: [2], compound: false },
  { id: 'm3', semitones: 3, degreeOptions: [3], compound: false },
  { id: 'M3', semitones: 4, degreeOptions: [3], compound: false },
  { id: 'P4', semitones: 5, degreeOptions: [4], compound: false },
  { id: 'TT', semitones: 6, degreeOptions: [4, 5], compound: false },
  { id: 'P5', semitones: 7, degreeOptions: [5], compound: false },
  { id: 'm6', semitones: 8, degreeOptions: [6], compound: false },
  { id: 'M6', semitones: 9, degreeOptions: [6], compound: false },
  { id: 'm7', semitones: 10, degreeOptions: [7], compound: false },
  { id: 'M7', semitones: 11, degreeOptions: [7], compound: false },
  { id: 'P8', semitones: 12, degreeOptions: [8], compound: false },
  { id: 'm9', semitones: 13, degreeOptions: [9], compound: true },
  { id: 'M9', semitones: 14, degreeOptions: [9], compound: true },
  { id: 'm10', semitones: 15, degreeOptions: [10], compound: true },
  { id: 'M10', semitones: 16, degreeOptions: [10], compound: true },
  { id: 'P11', semitones: 17, degreeOptions: [11], compound: true },
  { id: 'A11', semitones: 18, degreeOptions: [11, 12], compound: true },
  { id: 'P12', semitones: 19, degreeOptions: [12], compound: true },
  { id: 'm13', semitones: 20, degreeOptions: [13], compound: true },
  { id: 'M13', semitones: 21, degreeOptions: [13], compound: true },
  { id: 'm14', semitones: 22, degreeOptions: [14], compound: true },
  { id: 'M14', semitones: 23, degreeOptions: [14], compound: true },
  { id: 'P15', semitones: 24, degreeOptions: [15], compound: true },
];

const BY_ID = new Map(INTERVAL_SIZES.map((size) => [size.id, size]));
const BY_SEMITONES = new Map(INTERVAL_SIZES.map((size) => [size.semitones, size]));

export function intervalById(id: IntervalId): IntervalSize {
  const size = BY_ID.get(id);
  if (!size) throw new RangeError(`unknown interval id: ${id}`);
  return size;
}

export function intervalBySemitones(semitones: number): IntervalSize {
  const size = BY_SEMITONES.get(semitones);
  if (!size) throw new RangeError(`unknown interval semitones: ${semitones}`);
  return size;
}

export function widestSemitones(intervals: readonly IntervalId[]): number {
  return Math.max(0, ...intervals.map((id) => intervalById(id).semitones));
}

export function simpleSemitones(semitones: number): number {
  const abs = Math.abs(semitones);
  return abs > 12 ? ((abs - 1) % 12) + 1 : abs;
}

export function isCompound(semitones: number): boolean {
  return Math.abs(semitones) > 12;
}

export function consonanceOf(semitones: number): ConsonanceClass {
  switch (simpleSemitones(semitones) % 12) {
    case 0:
    case 5:
    case 7:
      return 'perfect';
    case 3:
    case 4:
    case 8:
    case 9:
      return 'imperfect';
    default:
      return 'dissonant';
  }
}

const DEGREE_QUALITY_NAME: Record<string, string> = {
  '2m': 'Minor 2nd',
  '2M': 'Major 2nd',
  '3m': 'Minor 3rd',
  '3M': 'Major 3rd',
  '4P': 'Perfect 4th',
  '4A': 'Augmented 4th',
  '5P': 'Perfect 5th',
  '5d': 'Diminished 5th',
  '6m': 'Minor 6th',
  '6M': 'Major 6th',
  '7m': 'Minor 7th',
  '7M': 'Major 7th',
  '8P': 'Octave',
  '9m': 'Minor 9th',
  '9M': 'Major 9th',
  '10m': 'Minor 10th',
  '10M': 'Major 10th',
  '11P': 'Perfect 11th',
  '11A': 'Augmented 11th',
  '12P': 'Perfect 12th',
  '12d': 'Diminished 12th',
  '13m': 'Minor 13th',
  '13M': 'Major 13th',
  '14m': 'Minor 14th',
  '14M': 'Major 14th',
  '15P': 'Double octave',
};

export function intervalDisplayName(degree: number, quality: IntervalQuality): string {
  return DEGREE_QUALITY_NAME[`${degree}${quality}`] ?? `${degree}${quality}`;
}

export function intervalIdDisplayName(id: IntervalId): string {
  if (id === 'TT') return 'Tritone';
  const spec = intervalById(id);
  const quality = id[0] as 'm' | 'M' | 'P' | 'A';
  return intervalDisplayName(spec.degreeOptions[0]!, quality);
}

const MAJOR_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

function letterIndex(pitch: Pitch): number {
  return pitch.octave * 7 + stepNumberOf(pitch.step);
}

export function intervalBetween(from: Pitch, to: Pitch): IntervalBetween {
  const direction: 1 | -1 =
    letterIndex(to) < letterIndex(from) ||
    (letterIndex(to) === letterIndex(from) && pitchToMidi(to) < pitchToMidi(from))
      ? -1
      : 1;
  const lower = direction === 1 ? from : to;
  const upper = direction === 1 ? to : from;
  const degree = letterIndex(upper) - letterIndex(lower) + 1;
  const simple = (degree - 1) % 7;
  const octaves = Math.floor((degree - 1) / 7);
  const semitones = pitchToMidi(upper) - pitchToMidi(lower);
  const offset = semitones - MAJOR_SCALE_SEMITONES[simple]! - 12 * octaves;
  const perfect = simple === 0 || simple === 3 || simple === 4;
  const quality: IntervalQuality =
    offset > 0 ? 'A' : perfect ? (offset === 0 ? 'P' : 'd') : offset === 0 ? 'M' : offset === -1 ? 'm' : 'd';
  return { degree, quality, semitones, direction };
}

export function spellAtDegree(root: Pitch, degree: number, semitones: number, direction: 1 | -1): SpelledPitch {
  const start = spelled(root);
  const rawLI = stepNumberOf(start.step) + (degree - 1) * direction;
  const targetLetter = STEP_LETTERS[((rawLI % 7) + 7) % 7]!;
  const targetOctave = start.octave + Math.floor(rawLI / 7);
  const targetMidi = pitchToMidi(start) + semitones * direction;
  const targetNatural = pitchToMidi({ step: targetLetter, octave: targetOctave });
  return { step: targetLetter, alter: targetMidi - targetNatural, octave: targetOctave };
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
  pinned: Pitch,
  specs: readonly IntervalSpec[],
  direction: 1 | -1,
  maxAlter: number,
): RelativeSpelling | undefined {
  const start = spelled(pinned);
  const candidates = [start, enharmonicAlternate(start)].filter((p): p is SpelledPitch => p !== undefined);
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

export function transpose(root: Pitch, spec: IntervalSpec, direction: 1 | -1 = 1): SpelledPitch {
  const result = spellRelative(root, [spec], direction, 2);
  return result?.members[0]?.pitch ?? midiToPitch(pitchToMidi(root) + direction * spec.semitones);
}
