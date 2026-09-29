import type { PlayingMode } from '../shared/playing.js';
import {
  buildTones,
  clefForMidis,
  midiOfToken,
  midiToPitch,
  withinRange,
  type IntervalTones,
  type Rng,
} from '../shared/tones.js';
import { intervalById, type IntervalId } from '../shared/intervals.js';
import { pitchToMidi } from '@polyhymnia/notation-model';
import type { IdentificationOptions } from './options.js';

export interface Question {
  mode: PlayingMode;
  size: IntervalId;
  tones: IntervalTones;
  clef: 'treble' | 'bass';
}

export interface QuestionSignature {
  mode: PlayingMode;
  from: string;
  to: string;
}

export function questionSignature(q: Question): QuestionSignature {
  return { mode: q.mode, from: q.tones.from, to: q.tones.to };
}

function sameSignature(a: QuestionSignature, b: QuestionSignature): boolean {
  return a.mode === b.mode && a.from === b.from && a.to === b.to;
}

const MAX_ATTEMPTS = 400;

export function generateQuestion(
  options: IdentificationOptions,
  rng: Rng = Math.random,
  last?: QuestionSignature,
): Question {
  const low = midiOfToken(options.range.low);
  const high = midiOfToken(options.range.high);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const mode = options.playingModes[Math.floor(rng() * options.playingModes.length)]!;
    const size = options.intervals[Math.floor(rng() * options.intervals.length)]!;
    const semitones = intervalById(size).semitones;

    const rootLow = mode === 'desc' ? low + semitones : low;
    const rootHigh = mode === 'desc' ? high : high - semitones;
    if (rootLow > rootHigh) continue;

    const rootMidi = rootLow + Math.floor(rng() * (rootHigh - rootLow + 1));
    const root = midiToPitch(rootMidi, rng);
    const tones = buildTones(size, root, mode);
    if (!withinRange(tones, low, high)) continue;

    const clef = clefForMidis([pitchToMidi(tones.root), pitchToMidi(tones.other)]);
    const question: Question = { mode, size, tones, clef };
    const signature = questionSignature(question);
    if (last && sameSignature(signature, last) && attempt < MAX_ATTEMPTS - 1) continue;

    return question;
  }

  throw new Error('interval-identification: could not generate a question satisfying the options');
}
