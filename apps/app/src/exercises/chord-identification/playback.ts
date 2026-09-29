import { shift } from '@polyhymnia/audio';
import type { NoteEvent } from '@polyhymnia/audio';
import { toneEvents } from '../shared/playback.js';
import { TEMPO_NOTE_DURATION, type Tempo } from '../shared/playing.js';

export type ChordPlayback = 'arp-asc' | 'arp-desc' | 'arp-harmonic-asc' | 'arp-harmonic-desc' | 'harmonic';
export type Execution = 'arpeggio' | 'arpeggio-harmonic' | 'harmonic';
export type ArpeggioDirection = 'asc' | 'desc';

export const EXECUTIONS: readonly Execution[] = ['arpeggio', 'arpeggio-harmonic', 'harmonic'];
export const DIRECTIONS: readonly ArpeggioDirection[] = ['asc', 'desc'];

export function playbacksFor(
  executions: readonly Execution[],
  directions: readonly ArpeggioDirection[],
): ChordPlayback[] {
  const playbacks: ChordPlayback[] = [];
  for (const execution of EXECUTIONS) {
    if (!executions.includes(execution)) continue;
    if (execution === 'harmonic') {
      playbacks.push('harmonic');
      continue;
    }
    const prefix = execution === 'arpeggio' ? 'arp' : 'arp-harmonic';
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
  const harmonic = toneEvents(pitches, 'harmonic', tempo);
  if (playback === 'harmonic') return harmonic;

  const descending = playback.endsWith('desc');
  const arpeggio = toneEvents(descending ? [...pitches].reverse() : pitches, 'melodic', tempo);
  if (!playback.startsWith('arp-harmonic')) return arpeggio;

  return [...arpeggio, ...shift(harmonic, (pitches.length + 1) * noteDuration)];
}
