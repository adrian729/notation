import { enumParam, listParam, NAME_STYLES, type NameStyle } from '../shared/customSearch.js';
import { parseSessionSearch, type SessionSearch } from '../shared/session.js';
import { DEFAULT_OPTIONS, TONE_RELATIONSHIPS, type ToneRelationship } from './options.js';

export interface CustomSearch extends SessionSearch {
  intervals: string;
  modes: string;
  rel: ToneRelationship;
  low: string;
  high: string;
  names: NameStyle;
}

function legacyNames(longNames: unknown): NameStyle {
  if (typeof longNames !== 'boolean') return 'full';
  return longNames ? 'full' : 'short';
}

export function parseCustomSearch(search: Record<string, unknown>): CustomSearch {
  return {
    intervals: listParam(search.intervals, DEFAULT_OPTIONS.intervals),
    modes: listParam(search.modes, DEFAULT_OPTIONS.playingModes),
    rel: enumParam(search.rel, TONE_RELATIONSHIPS, DEFAULT_OPTIONS.toneRelationship),
    low: typeof search.low === 'string' ? search.low : DEFAULT_OPTIONS.range.low,
    high: typeof search.high === 'string' ? search.high : DEFAULT_OPTIONS.range.high,
    ...parseSessionSearch(search),
    names: enumParam(search.names, NAME_STYLES, legacyNames(search.longNames)),
  };
}
