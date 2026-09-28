import { shift } from '@polyhymnia/audio';
import type { NoteEvent } from '@polyhymnia/audio';
import { intervalEvents } from '../shared/playback.js';
import { TEMPO_NOTE_DURATION, type Tempo } from '../shared/playing.js';
import type { Question } from './generator.js';

export function buildQuestionEvents(question: Question, tempo: Tempo): NoteEvent[] {
  const noteDuration = TEMPO_NOTE_DURATION[tempo];
  const intervalDuration = noteDuration * 2;
  const silence = noteDuration;

  const aEvents = intervalEvents(question.a, question.mode, tempo);
  const bEvents = shift(intervalEvents(question.b, question.mode, tempo), intervalDuration + silence);
  return [...aEvents, ...bEvents];
}
