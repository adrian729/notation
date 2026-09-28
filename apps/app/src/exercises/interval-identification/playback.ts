import type { NoteEvent } from '@polyhymnia/audio';
import { intervalEvents } from '../shared/playback.js';
import type { Tempo } from '../shared/playing.js';
import type { Question } from './generator.js';

export function buildQuestionEvents(question: Question, tempo: Tempo): NoteEvent[] {
  return intervalEvents(question.tones, question.mode, tempo);
}
