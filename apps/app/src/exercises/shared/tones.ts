import {
  formatPitch,
  intervalBetween,
  intervalById,
  intervalDisplayName,
  midiToPitch,
  pitchClass,
  pitchToMidi,
  spellRelative,
  type IntervalId,
  type SpelledPitch,
} from '@polyhymnia/music-theory';
import { pickPreferredRoot } from './spelling.js';
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

function toneName(mode: PlayingMode, lower: SpelledPitch, upper: SpelledPitch): string {
  const { degree, quality } = intervalBetween(lower, upper);
  return `${intervalDisplayName(degree, quality)}, ${mode === 'harmonic' ? 'harmonic' : mode === 'asc' ? 'ascending' : 'descending'}`;
}

export function toTones(
  size: IntervalId,
  mode: PlayingMode,
  dir: 1 | -1,
  root: SpelledPitch,
  other: SpelledPitch,
): IntervalTones {
  const lower = dir === 1 ? root : other;
  const upper = dir === 1 ? other : root;
  return {
    size,
    from: formatPitch(mode === 'desc' ? root : lower),
    to: formatPitch(mode === 'desc' ? other : upper),
    root,
    other,
    name: toneName(mode, lower, upper),
  };
}

export function buildTones(size: IntervalId, root: SpelledPitch, mode: PlayingMode): IntervalTones {
  const spec = intervalById(size);
  const dir = direction(mode);
  const spelled = spellRelative(root, [spec], dir, 2);
  if (!spelled) throw new RangeError('could not spell interval without a double accidental');
  return toTones(size, mode, dir, spelled.pinned, spelled.members[0]!.pitch);
}

export function clefForMidis(midis: readonly number[]): 'treble' | 'bass' {
  return (Math.min(...midis) + Math.max(...midis)) / 2 < 60 ? 'bass' : 'treble';
}

export function withinRange(tones: IntervalTones, lowMidi: number, highMidi: number): boolean {
  const rootMidi = pitchToMidi(tones.root);
  const otherMidi = pitchToMidi(tones.other);
  return rootMidi >= lowMidi && rootMidi <= highMidi && otherMidi >= lowMidi && otherMidi <= highMidi;
}

export function randomInt(rng: Rng, minInclusive: number, maxInclusive: number): number {
  return minInclusive + Math.floor(rng() * (maxInclusive - minInclusive + 1));
}

export function pickOne<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function midiToPitchRng(midi: number, rng: Rng): SpelledPitch {
  return pickPreferredRoot(pitchClass(midi), midiToPitch(midi).octave, rng);
}

export function randomRootInRange(rng: Rng, low: number, high: number): SpelledPitch {
  const midi = randomInt(rng, low, Math.max(low, high));
  return midiToPitchRng(midi, rng);
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
