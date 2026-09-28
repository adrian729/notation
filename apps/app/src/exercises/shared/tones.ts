import { pitchToMidi } from '@polyhymnia/notation-model';
import { intervalById, intervalDisplayName, type IntervalId } from './intervals.js';
import {
  pickPreferredRoot,
  pitchToToken,
  qualityForIntervalId,
  spellInterval,
  tokenMidi,
  type SpelledPitch,
} from './spelling.js';
import type { PlayingMode } from './playing.js';

export type Rng = () => number;

export interface IntervalTones {
  size: IntervalId;
  from: string;
  to: string;
  root: SpelledPitch;
  other: SpelledPitch;
  name: string;
}

export function direction(mode: PlayingMode): 1 | -1 {
  return mode === 'desc' ? -1 : 1;
}

function toneName(mode: PlayingMode, degree: number, size: IntervalId): string {
  const quality = qualityForIntervalId(size, degree);
  return `${intervalDisplayName(degree, quality)}, ${mode === 'harmonic' ? 'harmonic' : mode === 'asc' ? 'ascending' : 'descending'}`;
}

export function toTones(
  size: IntervalId,
  mode: PlayingMode,
  dir: 1 | -1,
  root: SpelledPitch,
  other: SpelledPitch,
  degree: number,
): IntervalTones {
  const lower = dir === 1 ? root : other;
  const upper = dir === 1 ? other : root;
  return {
    size,
    from: pitchToToken(mode === 'desc' ? root : lower),
    to: pitchToToken(mode === 'desc' ? other : upper),
    root,
    other,
    name: toneName(mode, degree, size),
  };
}

export function buildTones(size: IntervalId, root: SpelledPitch, mode: PlayingMode): IntervalTones {
  const spec = intervalById(size);
  const dir = direction(mode);
  const { root: spelledRoot, other, degree } = spellInterval(root, spec.degreeOptions, spec.semitones, dir);
  return toTones(size, mode, dir, spelledRoot, other, degree);
}

export function midiOfToken(token: string): number {
  const midi = tokenMidi(token);
  if (midi === undefined) throw new SyntaxError(`Invalid pitch token: ${JSON.stringify(token)}`);
  return midi;
}

export function withinRange(tones: IntervalTones, lowMidi: number, highMidi: number): boolean {
  const rootMidi = pitchToMidi(tones.root);
  const otherMidi = pitchToMidi(tones.other);
  return rootMidi >= lowMidi && rootMidi <= highMidi && otherMidi >= lowMidi && otherMidi <= highMidi;
}

export function randomInt(rng: Rng, minInclusive: number, maxInclusive: number): number {
  return minInclusive + Math.floor(rng() * (maxInclusive - minInclusive + 1));
}

export function midiToPitch(midi: number, rng: Rng): SpelledPitch {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return pickPreferredRoot(pitchClass, octave, rng);
}

export function randomRootInRange(rng: Rng, low: number, high: number): SpelledPitch {
  const midi = randomInt(rng, low, Math.max(low, high));
  return midiToPitch(midi, rng);
}

export function deterministicRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
