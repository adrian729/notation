import { harmonic, melodic } from '@polyhymnia/audio';
import type { NoteEvent } from '@polyhymnia/audio';
import { TEMPO_NOTE_DURATION, type PlayingMode, type Tempo } from './playing.js';

export function intervalEvents(tones: { from: string; to: string }, mode: PlayingMode, tempo: Tempo): NoteEvent[] {
  const noteDuration = TEMPO_NOTE_DURATION[tempo];
  const intervalDuration = noteDuration * 2;
  return mode === 'harmonic'
    ? harmonic([tones.from, tones.to], { duration: intervalDuration })
    : melodic([tones.from, tones.to], { noteDuration, gap: 0 });
}
