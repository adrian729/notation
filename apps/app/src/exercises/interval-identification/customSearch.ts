import { enumParam, listParam, NAME_STYLES, type NameStyle } from '../shared/customSearch.js';
import type { PlayingMode } from '../shared/playing.js';
import { parseSessionSearch, sessionFromSearch, type SessionSearch } from '../shared/session.js';
import { INTERVAL_SIZES, rangeForIntervals, type IntervalId } from '../shared/intervals.js';
import { DEFAULT_OPTIONS, PLAYING_MODES, type IdentificationOptions } from './options.js';

export interface CustomSearch extends SessionSearch {
  intervals: string;
  modes: string;
  names: NameStyle;
}

export function parseCustomSearch(search: Record<string, unknown>): CustomSearch {
  return {
    intervals: listParam(search.intervals, DEFAULT_OPTIONS.intervals),
    modes: listParam(search.modes, DEFAULT_OPTIONS.playingModes),
    ...parseSessionSearch(search),
    names: enumParam(search.names, NAME_STYLES, 'full'),
  };
}

export function searchIntervals(search: CustomSearch): IntervalId[] {
  const ids = search.intervals.split(',');
  return INTERVAL_SIZES.map((size) => size.id).filter((id) => ids.includes(id));
}

export function searchModes(search: CustomSearch): PlayingMode[] {
  return PLAYING_MODES.filter((m) => search.modes.split(',').includes(m));
}

export function optionsFromSearch(search: CustomSearch): Partial<IdentificationOptions> {
  const intervals = searchIntervals(search);
  return {
    intervals,
    range: rangeForIntervals(intervals),
    playingModes: searchModes(search),
    ...sessionFromSearch(search),
  };
}
