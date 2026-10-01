import type { RangeOption } from './playing.js';
import { chromaticRange, formatPitch, tryMidiOf } from '@polyhymnia/music-theory';

export interface RangeSearch {
  low: string;
  high: string;
}

export const RANGE_TOKENS = chromaticRange(tryMidiOf('E2')!, tryMidiOf('C7')!).map(formatPitch);

export function parseRangeSearch(search: Record<string, unknown>, fallback: RangeOption): RangeSearch {
  return {
    low: typeof search.low === 'string' ? search.low : fallback.low,
    high: typeof search.high === 'string' ? search.high : fallback.high,
  };
}

export function validateRange(range: Partial<RangeOption> | undefined, widest?: { semitones: number; of: string }) {
  const errors: string[] = [];
  if (!range || !range.low || !range.high) {
    errors.push('Select a range.');
    return errors;
  }
  const lowMidi = tryMidiOf(range.low);
  const highMidi = tryMidiOf(range.high);
  if (lowMidi === undefined || highMidi === undefined) {
    errors.push('Enter a valid range.');
  } else if (lowMidi >= highMidi) {
    errors.push('The low end of the range must be lower than the high end.');
  } else if (widest && widest.semitones > highMidi - lowMidi) {
    errors.push(`Range too narrow for the selected ${widest.of}.`);
  }
  return errors;
}
