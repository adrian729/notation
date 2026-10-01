import {
  formatPitch,
  intervalById,
  midiOf,
  parseSpelledPitch,
  pitchToMidi,
  spellRelative,
  transpose,
  type IntervalId,
} from '@polyhymnia/music-theory';
import { clefForMidis, midiToPitchRng, pickOne, randomInt, type Rng } from '../shared/tones.js';
import type { MultiIntervalOptions, MultiPlayingMode } from './options.js';

export interface StackRow {
  size: IntervalId;
  pitch: string;
}

export interface Question {
  mode: MultiPlayingMode;
  reference: string;
  rows: readonly StackRow[];
  sounding: readonly string[];
  clef: 'treble' | 'bass';
}

export function questionSignature(q: Question): string {
  return q.rows.map((row) => row.size).join(',');
}

export function withAnswer(question: Question, rowIndex: number, size: IntervalId): Question {
  const replaced = question.rows[rowIndex]!.pitch;
  const pitch = formatPitch(transpose(parseSpelledPitch(question.reference), intervalById(size)));
  return {
    ...question,
    rows: question.rows.map((row, i) => (i === rowIndex ? { size, pitch } : row)),
    sounding: question.sounding.map((token) => (token === replaced ? pitch : token)),
  };
}

const MAX_ATTEMPTS = 400;

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  return sampleDistinct(items, items.length, rng);
}

function soundingOrder(mode: MultiPlayingMode, ascending: readonly string[], rng: Rng): string[] {
  if (mode === 'desc') return [...ascending].reverse();
  if (mode === 'random') return [ascending[0]!, ...shuffle(ascending.slice(1), rng)];
  return [...ascending];
}

function sampleDistinct<T>(items: readonly T[], count: number, rng: Rng): T[] {
  const pool = [...items];
  const picked: T[] = [];
  for (let i = 0; i < count; i++) picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
  return picked;
}

export function generateQuestion(options: MultiIntervalOptions, rng: Rng = Math.random, last?: string): Question {
  const low = midiOf(options.range.low);
  const high = midiOf(options.range.high);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const mode = pickOne(options.playingModes, rng);
    const noteCount = pickOne(options.noteCounts, rng);
    const specs = sampleDistinct(options.intervals, noteCount - 1, rng)
      .map((size) => ({ size, ...intervalById(size) }))
      .sort((a, b) => a.semitones - b.semitones);

    const rootHigh = high - specs[specs.length - 1]!.semitones;
    if (low > rootHigh) continue;

    const referenceMidi = randomInt(rng, low, rootHigh);
    const spelled = spellRelative(midiToPitchRng(referenceMidi, rng), specs, 1, 2);
    if (!spelled) continue;

    const reference = formatPitch(spelled.pinned);
    const rows = specs.map((spec, i) => ({ size: spec.size, pitch: formatPitch(spelled.members[i]!.pitch) }));
    const ascending = [reference, ...rows.map((row) => row.pitch)];
    const clef = clefForMidis([pitchToMidi(spelled.pinned), ...spelled.members.map((m) => pitchToMidi(m.pitch))]);
    const question: Question = {
      mode,
      reference,
      rows,
      sounding: soundingOrder(mode, ascending, rng),
      clef,
    };
    if (last !== undefined && questionSignature(question) === last && attempt < MAX_ATTEMPTS - 1) continue;

    return question;
  }

  throw new Error('multi-interval-identification: could not generate a question satisfying the options');
}
