import type { NoteEvent } from '@polyhymnia/web-audio';
import { toneEvents } from '../shared/playback.js';
import type { Tempo } from '../shared/playing.js';
import type { Question } from './generator.js';

export function buildQuestionEvents(question: Question, tempo: Tempo): NoteEvent[] {
  return toneEvents(question.sounding, question.mode === 'harmonic' ? 'harmonic' : 'melodic', tempo);
}
