import { harmonic, melodic } from '@polyhymnia/web-audio';
import type { NoteEvent } from '@polyhymnia/web-audio';
import { midiOf } from '@polyhymnia/music-theory';
import { TEMPO_NOTE_DURATION, type Tempo } from './playing.js';

export type Texture = 'melodic' | 'harmonic';

export function toneEvents(pitches: readonly string[], texture: Texture, tempo: Tempo): NoteEvent[] {
  const noteDuration = TEMPO_NOTE_DURATION[tempo];
  const midis = pitches.map(midiOf);
  return texture === 'harmonic'
    ? harmonic(midis, { duration: noteDuration * 2 })
    : melodic(midis, { noteDuration, gap: 0 });
}
