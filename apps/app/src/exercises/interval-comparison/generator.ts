import { intervalById, intervalDisplayName, type IntervalId } from './intervals.js';
import {
  pickPreferredRoot,
  pitchMidi,
  pitchToToken,
  qualityForIntervalId,
  spellInterval,
  spellSharedPair,
  tokenMidi,
  type SpelledPitch,
} from './spelling.js';
import { validateOptions, normalizeOptions, type ExerciseOptions, type PlayingMode, type ValidationResult } from './options.js';

export type Rng = () => number;

export interface IntervalTones {
  size: IntervalId;
  from: string;
  to: string;
  root: SpelledPitch;
  other: SpelledPitch;
  name: string;
}

export interface Question {
  mode: PlayingMode;
  a: IntervalTones;
  b: IntervalTones;
  correct: 'A' | 'B';
  clef: 'treble' | 'bass';
}

function direction(mode: PlayingMode): 1 | -1 {
  return mode === 'desc' ? -1 : 1;
}

function pitchToken(pitch: SpelledPitch): string {
  return pitchToToken(pitch);
}

function buildTones(size: IntervalId, root: SpelledPitch, mode: PlayingMode): IntervalTones {
  const spec = intervalById(size);
  const dir = direction(mode);
  const { root: spelledRoot, other, degree } = spellInterval(root, spec.degreeOptions, spec.semitones, dir);
  return toTones(size, mode, dir, spelledRoot, other, degree);
}

function toneName(mode: PlayingMode, degree: number, size: IntervalId): string {
  const quality = qualityForIntervalId(size, degree);
  return `${intervalDisplayName(degree, quality)}, ${mode === 'harmonic' ? 'harmonic' : mode === 'asc' ? 'ascending' : 'descending'}`;
}

function toTones(size: IntervalId, mode: PlayingMode, dir: 1 | -1, root: SpelledPitch, other: SpelledPitch, degree: number): IntervalTones {
  const lower = dir === 1 ? root : other;
  const upper = dir === 1 ? other : root;
  return {
    size,
    from: pitchToken(mode === 'desc' ? root : lower),
    to: pitchToken(mode === 'desc' ? other : upper),
    root,
    other,
    name: toneName(mode, degree, size),
  };
}

function buildSharedTones(
  sizeA: IntervalId,
  sizeB: IntervalId,
  pinned: SpelledPitch,
  pinnedRole: 'root' | 'other',
  mode: PlayingMode,
): { tonesA: IntervalTones; tonesB: IntervalTones } | undefined {
  const specA = intervalById(sizeA);
  const specB = intervalById(sizeB);
  const dir = direction(mode);
  const result = spellSharedPair(pinned, pinnedRole, specA, specB, dir);
  if (!result) return undefined;
  const rootA = pinnedRole === 'root' ? result.pinned : result.a.computed;
  const otherA = pinnedRole === 'root' ? result.a.computed : result.pinned;
  const rootB = pinnedRole === 'root' ? result.pinned : result.b.computed;
  const otherB = pinnedRole === 'root' ? result.b.computed : result.pinned;
  return {
    tonesA: toTones(sizeA, mode, dir, rootA, otherA, result.a.degree),
    tonesB: toTones(sizeB, mode, dir, rootB, otherB, result.b.degree),
  };
}

function midiOfToken(token: string): number {
  const midi = tokenMidi(token);
  if (midi === undefined) throw new SyntaxError(`Invalid pitch token: ${JSON.stringify(token)}`);
  return midi;
}

function withinRange(tones: IntervalTones, lowMidi: number, highMidi: number): boolean {
  const rootMidi = pitchMidi(tones.root);
  const otherMidi = pitchMidi(tones.other);
  return rootMidi >= lowMidi && rootMidi <= highMidi && otherMidi >= lowMidi && otherMidi <= highMidi;
}

function randomInt(rng: Rng, minInclusive: number, maxInclusive: number): number {
  return minInclusive + Math.floor(rng() * (maxInclusive - minInclusive + 1));
}

function pickTwoSizes(intervals: readonly IntervalId[], rng: Rng): [IntervalId, IntervalId] {
  const pairs: [IntervalId, IntervalId][] = [];
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      pairs.push([intervals[i]!, intervals[j]!]);
    }
  }
  const [x, y] = pairs[Math.floor(rng() * pairs.length)]!;
  return rng() < 0.5 ? [x, y] : [y, x];
}

export interface LastQuestionSignature {
  mode: PlayingMode;
  sizeA: IntervalId;
  sizeB: IntervalId;
}

export function questionSignature(q: Question): LastQuestionSignature {
  return { mode: q.mode, sizeA: q.a.size, sizeB: q.b.size };
}

function sameSignature(a: LastQuestionSignature, b: LastQuestionSignature): boolean {
  return a.mode === b.mode && a.sizeA === b.sizeA && a.sizeB === b.sizeB;
}

const MAX_ATTEMPTS = 400;

export function generateQuestion(
  options: ExerciseOptions,
  rng: Rng = Math.random,
  last?: LastQuestionSignature,
): Question {
  const low = midiOfToken(options.range.low);
  const high = midiOfToken(options.range.high);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const mode = options.playingModes[Math.floor(rng() * options.playingModes.length)]!;
    const [sizeA, sizeB] = pickTwoSizes(options.intervals, rng);
    if (last && sameSignature({ mode, sizeA, sizeB }, last) && attempt < MAX_ATTEMPTS - 1) continue;

    const specA = intervalById(sizeA);
    const specB = intervalById(sizeB);
    const maxExtent = Math.max(specA.semitones, specB.semitones);
    const safeHigh = Math.max(low, high - maxExtent);
    const relationship = options.toneRelationship;

    let question: Question | undefined;

    if (relationship === 'common-first') {
      const root = randomRootInRange(rng, low, safeHigh);
      const pair = buildSharedTones(sizeA, sizeB, root, 'root', mode);
      if (pair && withinRange(pair.tonesA, low, high) && withinRange(pair.tonesB, low, high)) {
        question = finishQuestion(mode, sizeA, sizeB, pair.tonesA, pair.tonesB);
      }
    } else if (relationship === 'common-either') {
      const shareSecond = rng() < 0.5;
      const pinned = randomRootInRange(rng, low, safeHigh);
      const pair = buildSharedTones(sizeA, sizeB, pinned, shareSecond ? 'other' : 'root', mode);
      if (pair && withinRange(pair.tonesA, low, high) && withinRange(pair.tonesB, low, high)) {
        question = finishQuestion(mode, sizeA, sizeB, pair.tonesA, pair.tonesB);
      }
    } else if (relationship === 'nearby') {
      const rootA = randomRootInRange(rng, low, safeHigh);
      const offset = randomInt(rng, -4, 4);
      const rootBMidi = pitchMidi(rootA) + offset;
      const rootB = midiToPitch(rootBMidi, rng);
      const tonesA = buildTones(sizeA, rootA, mode);
      const tonesB = buildTones(sizeB, rootB, mode);
      if (withinRange(tonesA, low, high) && withinRange(tonesB, low, high)) {
        question = finishQuestion(mode, sizeA, sizeB, tonesA, tonesB);
      }
    } else {
      const rootA = randomRootInRange(rng, low, safeHigh);
      const rootB = randomRootInRange(rng, low, safeHigh);
      const tonesA = buildTones(sizeA, rootA, mode);
      const tonesB = buildTones(sizeB, rootB, mode);
      if (withinRange(tonesA, low, high) && withinRange(tonesB, low, high)) {
        question = finishQuestion(mode, sizeA, sizeB, tonesA, tonesB);
      }
    }

    if (question) return question;
  }

  throw new Error('interval-comparison: could not generate a question satisfying the options');
}

function randomRootInRange(rng: Rng, low: number, high: number): SpelledPitch {
  const midi = randomInt(rng, low, Math.max(low, high));
  return midiToPitch(midi, rng);
}

function midiToPitch(midi: number, rng: Rng): SpelledPitch {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return pickPreferredRoot(pitchClass, octave, rng);
}

function finishQuestion(
  mode: PlayingMode,
  sizeA: IntervalId,
  sizeB: IntervalId,
  a: IntervalTones,
  b: IntervalTones,
): Question {
  const specA = intervalById(sizeA);
  const specB = intervalById(sizeB);
  const correct: 'A' | 'B' = specA.semitones > specB.semitones ? 'A' : 'B';
  const tones = [pitchMidi(a.root), pitchMidi(a.other), pitchMidi(b.root), pitchMidi(b.other)].sort(
    (x, y) => x - y,
  );
  const median = (tones[1]! + tones[2]!) / 2;
  const clef: 'treble' | 'bass' = median < 60 ? 'bass' : 'treble';
  return { mode, a, b, correct, clef };
}

function deterministicRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canGenerateQuestion(options: ExerciseOptions): boolean {
  try {
    for (let seed = 1; seed <= 5; seed++) {
      generateQuestion(options, deterministicRng(seed * 97 + 13));
    }
    return true;
  } catch {
    return false;
  }
}

export function validateExerciseOptions(raw: Partial<ExerciseOptions>): ValidationResult {
  const base = validateOptions(raw);
  if (!base.valid) return base;
  const options = normalizeOptions(raw);
  if (!canGenerateQuestion(options)) {
    return { valid: false, errors: [...base.errors, 'Range too narrow for the selected intervals.'] };
  }
  return base;
}
