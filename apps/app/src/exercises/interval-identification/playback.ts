import type { NoteEvent } from '@polyhymnia/audio';
import { toneEvents } from '../shared/playback.js';
import type { Tempo } from '../shared/playing.js';
import type { Question } from './generator.js';

export function buildQuestionEvents(question: Question, tempo: Tempo): NoteEvent[] {
  const { from, to } = question.tones;
  return toneEvents([from, to], question.mode === 'harmonic' ? 'harmonic' : 'melodic', tempo);
}
