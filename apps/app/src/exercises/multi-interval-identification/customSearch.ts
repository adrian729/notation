import { enumParam, listParam, NAME_STYLES, type NameStyle } from '../shared/customSearch.js';
import type { PlayingMode } from '../shared/playing.js';
import { parseSessionSearch, sessionFromSearch, type SessionSearch } from '../shared/session.js';
import { INTERVAL_SIZES, rangeForIntervals, type IntervalId } from '../shared/intervals.js';
import { DEFAULT_OPTIONS, NOTE_COUNTS, PLAYING_MODES, type MultiIntervalOptions, type NoteCount } from './options.js';

export interface CustomSearch extends SessionSearch {
  intervals: string;
  notes: string;
  modes: string;
  names: NameStyle;
}

export function parseCustomSearch(search: Record<string, unknown>): CustomSearch {
  return {
    intervals: listParam(search.intervals, DEFAULT_OPTIONS.intervals),
    notes: listParam(search.notes, DEFAULT_OPTIONS.noteCounts.map(String)),
    modes: listParam(search.modes, DEFAULT_OPTIONS.playingModes),
    ...parseSessionSearch(search),
    names: enumParam(search.names, NAME_STYLES, 'full'),
  };
}

export function searchNoteCounts(search: CustomSearch): NoteCount[] {
  return NOTE_COUNTS.filter((n) => search.notes.split(',').includes(String(n)));
}

export function searchIntervals(search: CustomSearch): IntervalId[] {
  const ids = search.intervals.split(',');
  return INTERVAL_SIZES.map((size) => size.id).filter((id) => ids.includes(id));
}

export function searchModes(search: CustomSearch): PlayingMode[] {
  return PLAYING_MODES.filter((m) => search.modes.split(',').includes(m));
}

export function optionsFromSearch(search: CustomSearch): Partial<MultiIntervalOptions> {
  const intervals = searchIntervals(search);
  return {
    intervals,
    range: rangeForIntervals(intervals),
    noteCounts: searchNoteCounts(search),
    playingModes: searchModes(search),
    ...sessionFromSearch(search),
  };
}
