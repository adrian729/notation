import { harmonic, melodic } from '@polyhymnia/audio';
import type { NoteEvent } from '@polyhymnia/audio';
import { TEMPO_NOTE_DURATION, type Tempo } from './playing.js';

export type Texture = 'melodic' | 'harmonic';

export function toneEvents(pitches: readonly string[], texture: Texture, tempo: Tempo): NoteEvent[] {
  const noteDuration = TEMPO_NOTE_DURATION[tempo];
  return texture === 'harmonic'
    ? harmonic(pitches, { duration: noteDuration * 2 })
    : melodic(pitches, { noteDuration, gap: 0 });
}
