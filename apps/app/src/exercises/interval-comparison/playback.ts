import { shift } from '@polyhymnia/audio';
import type { NoteEvent } from '@polyhymnia/audio';
import { toneEvents } from '../shared/playback.js';
import { TEMPO_NOTE_DURATION, type Tempo } from '../shared/playing.js';
import type { IntervalTones } from '../shared/tones.js';
import type { Question } from './generator.js';

function pairEvents(tones: IntervalTones, question: Question, tempo: Tempo): NoteEvent[] {
  return toneEvents([tones.from, tones.to], question.mode === 'harmonic' ? 'harmonic' : 'melodic', tempo);
}

export function buildQuestionEvents(question: Question, tempo: Tempo): NoteEvent[] {
  const noteDuration = TEMPO_NOTE_DURATION[tempo];
  const intervalDuration = noteDuration * 2;
  const silence = noteDuration;

  const aEvents = pairEvents(question.a, question, tempo);
  const bEvents = shift(pairEvents(question.b, question, tempo), intervalDuration + silence);
  return [...aEvents, ...bEvents];
}
