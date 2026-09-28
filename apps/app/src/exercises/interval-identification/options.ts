import type { IntervalId } from '../shared/intervals.js';
import type { PlayingMode, RangeOption, Tempo } from '../shared/playing.js';

export interface IdentificationOptions {
  intervals: readonly IntervalId[];
  playingModes: readonly PlayingMode[];
  range: RangeOption;
  tempo: Tempo;
  questionCount: number | 'endless';
  autoNext: boolean;
}
