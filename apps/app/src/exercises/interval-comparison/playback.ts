import { harmonic, melodic, shift } from '@polyhymnia/audio';
import type { NoteEvent } from '@polyhymnia/audio';
import type { Question } from './generator.js';
import { TEMPO_NOTE_DURATION, type Tempo } from './options.js';

export function buildQuestionEvents(question: Question, tempo: Tempo): NoteEvent[] {
  const noteDuration = TEMPO_NOTE_DURATION[tempo];
  const intervalDuration = noteDuration * 2;
  const silence = noteDuration;

  const eventsFor = (tones: { from: string; to: string }) =>
    question.mode === 'harmonic'
      ? harmonic([tones.from, tones.to], { duration: intervalDuration })
      : melodic([tones.from, tones.to], { noteDuration, gap: 0 });

  const aEvents = eventsFor(question.a);
  const bEvents = shift(eventsFor(question.b), intervalDuration + silence);
  return [...aEvents, ...bEvents];
}
