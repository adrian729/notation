import { intervalById, type IntervalId } from '../shared/intervals.js';
import { pitchToMidi } from '@polyhymnia/notation-model';
import { spellRelative, type SpelledMember, type SpelledPitch } from '../shared/spelling.js';
import {
  buildTones,
  clefForMidis,
  direction,
  midiOfToken,
  midiToPitch,
  randomInt,
  randomRootInRange,
  toTones,
  withinRange,
  deterministicRng,
  type IntervalTones,
  type Rng,
} from '../shared/tones.js';
import { validateOptions, normalizeOptions, type ExerciseOptions } from './options.js';
import type { ValidationResult } from '../shared/session.js';
import type { PlayingMode } from '../shared/playing.js';

export type Answer = 'A' | 'B' | 'same';

export interface Question {
  mode: PlayingMode;
  a: IntervalTones;
  b: IntervalTones;
  correct: Answer;
  clef: 'treble' | 'bass';
}

function buildSharedTones(
  sizeA: IntervalId,
  sizeB: IntervalId,
  pinned: SpelledPitch,
  pinnedRole: 'root' | 'other',
  mode: PlayingMode,
): { tonesA: IntervalTones; tonesB: IntervalTones } | undefined {
  const dir = direction(mode);
  const spelled = spellRelative(
    pinned,
    [intervalById(sizeA), intervalById(sizeB)],
    pinnedRole === 'root' ? dir : (-dir as 1 | -1),
    1,
  );
  if (!spelled) return undefined;
  const [a, b] = spelled.members as [SpelledMember, SpelledMember];
  const rootA = pinnedRole === 'root' ? spelled.pinned : a.pitch;
  const otherA = pinnedRole === 'root' ? a.pitch : spelled.pinned;
  const rootB = pinnedRole === 'root' ? spelled.pinned : b.pitch;
  const otherB = pinnedRole === 'root' ? b.pitch : spelled.pinned;
  return {
    tonesA: toTones(sizeA, mode, dir, rootA, otherA),
    tonesB: toTones(sizeB, mode, dir, rootB, otherB),
  };
}

function pickSize(intervals: readonly IntervalId[], rng: Rng): IntervalId {
  return intervals[Math.floor(rng() * intervals.length)]!;
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
    const sizeA = pickSize(options.intervals, rng);
    let sizeB = pickSize(options.intervals, rng);
    if (sizeB === sizeA) sizeB = pickSize(options.intervals, rng);
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
      const rootBMidi = pitchToMidi(rootA) + offset;
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

function finishQuestion(
  mode: PlayingMode,
  sizeA: IntervalId,
  sizeB: IntervalId,
  a: IntervalTones,
  b: IntervalTones,
): Question {
  const specA = intervalById(sizeA);
  const specB = intervalById(sizeB);
  const correct: Answer = specA.semitones === specB.semitones ? 'same' : specA.semitones > specB.semitones ? 'A' : 'B';
  const clef = clefForMidis([a.root, a.other, b.root, b.other].map(pitchToMidi));
  return { mode, a, b, correct, clef };
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
  const widest = Math.max(...options.intervals.map((id) => intervalById(id).semitones));
  const span = midiOfToken(options.range.high) - midiOfToken(options.range.low);
  if (widest > span || !canGenerateQuestion(options)) {
    return { valid: false, errors: [...base.errors, 'Range too narrow for the selected intervals.'] };
  }
  return base;
}
