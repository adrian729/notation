import { shift } from '@polyhymnia/audio';
import type { NoteEvent } from '@polyhymnia/audio';
import { toneEvents } from '../shared/playback.js';
import { TEMPO_NOTE_DURATION, type Tempo } from '../shared/playing.js';

export type ChordPlayback = 'arp-asc' | 'arp-desc' | 'arp-block-asc' | 'arp-block-desc' | 'block';
export type Execution = 'arpeggio' | 'arpeggio-block' | 'block';
export type ArpeggioDirection = 'asc' | 'desc';

export const EXECUTIONS: readonly Execution[] = ['arpeggio', 'arpeggio-block', 'block'];
export const DIRECTIONS: readonly ArpeggioDirection[] = ['asc', 'desc'];

export function playbacksFor(
  executions: readonly Execution[],
  directions: readonly ArpeggioDirection[],
): ChordPlayback[] {
  const playbacks: ChordPlayback[] = [];
  for (const execution of EXECUTIONS) {
    if (!executions.includes(execution)) continue;
    if (execution === 'block') {
      playbacks.push('block');
      continue;
    }
    const prefix = execution === 'arpeggio' ? 'arp' : 'arp-block';
    for (const direction of DIRECTIONS) {
      if (directions.includes(direction)) playbacks.push(`${prefix}-${direction}` as ChordPlayback);
    }
  }
  return playbacks;
}

export function buildQuestionEvents(
  question: { pitches: readonly string[]; playback: ChordPlayback },
  tempo: Tempo,
): NoteEvent[] {
  const { pitches, playback } = question;
  const noteDuration = TEMPO_NOTE_DURATION[tempo];
  const block = toneEvents(pitches, 'harmonic', tempo);
  if (playback === 'block') return block;

  const descending = playback.endsWith('desc');
  const arpeggio = toneEvents(descending ? [...pitches].reverse() : pitches, 'melodic', tempo);
  if (!playback.startsWith('arp-block')) return arpeggio;

  return [...arpeggio, ...shift(block, (pitches.length + 1) * noteDuration)];
}
