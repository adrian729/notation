import { DEFAULT_OPTIONS, TEMPOS, TONE_RELATIONSHIPS, normalizeQuestionCount, type ToneRelationship } from './options.js';
import type { Tempo } from '../shared/playing.js';

export interface CustomSearch {
  intervals: string;
  modes: string;
  rel: ToneRelationship;
  low: string;
  high: string;
  tempo: Tempo;
  count: string;
  endless: '0' | '1';
  auto: '0' | '1';
}

const DEFAULT_QUESTION_COUNT = DEFAULT_OPTIONS.questionCount === 'endless' ? 10 : DEFAULT_OPTIONS.questionCount;

export function parseCustomSearch(search: Record<string, unknown>): CustomSearch {
  const rel =
    typeof search.rel === 'string' && (TONE_RELATIONSHIPS as readonly string[]).includes(search.rel)
      ? (search.rel as ToneRelationship)
      : DEFAULT_OPTIONS.toneRelationship;
  const tempo =
    typeof search.tempo === 'string' && (TEMPOS as readonly string[]).includes(search.tempo)
      ? (search.tempo as Tempo)
      : DEFAULT_OPTIONS.tempo;
  const countRaw = typeof search.count === 'string' || typeof search.count === 'number' ? Number(search.count) : NaN;
  const count = Number.isFinite(countRaw) ? String(normalizeQuestionCount(countRaw)) : String(DEFAULT_QUESTION_COUNT);
  return {
    intervals: typeof search.intervals === 'string' ? search.intervals : DEFAULT_OPTIONS.intervals.join(','),
    modes: typeof search.modes === 'string' ? search.modes : DEFAULT_OPTIONS.playingModes.join(','),
    rel,
    low: typeof search.low === 'string' ? search.low : DEFAULT_OPTIONS.range.low,
    high: typeof search.high === 'string' ? search.high : DEFAULT_OPTIONS.range.high,
    tempo,
    count,
    endless: String(search.endless) === '1' ? '1' : '0',
    auto: String(search.auto) === '1' ? '1' : '0',
  };
}
