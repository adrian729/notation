import type { IntervalId } from '@polyhymnia/music-theory';
import type { RangeOption } from './playing.js';

export { intervalById, intervalBySemitones, intervalIdDisplayName, type IntervalId } from '@polyhymnia/music-theory';

export type IntervalFamilyId = 'perfect' | 'imperfect' | 'dissonant' | 'simple' | 'compound';

export const INTERVAL_FAMILIES: Record<IntervalFamilyId, readonly IntervalId[]> = {
  perfect: ['P4', 'P5', 'P8'],
  imperfect: ['m3', 'M3', 'm6', 'M6'],
  dissonant: ['m2', 'M2', 'TT', 'm7', 'M7'],
  simple: ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
  compound: ['m9', 'M9', 'm10', 'M10', 'P11', 'A11', 'P12', 'm13', 'M13', 'm14', 'M14', 'P15'],
};

export const INTERVAL_FAMILY_ORDER: readonly IntervalFamilyId[] = [
  'perfect',
  'imperfect',
  'dissonant',
  'simple',
  'compound',
];

const FIRST_OCTAVE_RANGE: RangeOption = { low: 'C3', high: 'C6' };
const SECOND_OCTAVE_RANGE: RangeOption = { low: 'G2', high: 'C6' };

export function rangeForIntervals(intervals: readonly IntervalId[]): RangeOption {
  return intervals.some((id) => INTERVAL_FAMILIES.compound.includes(id)) ? SECOND_OCTAVE_RANGE : FIRST_OCTAVE_RANGE;
}
