import { enumParam, listParam, NAME_STYLES, type NameStyle } from '../shared/customSearch.js';
import { parseRangeSearch, type RangeSearch } from '../shared/range.js';
import { parseSessionSearch, type SessionSearch } from '../shared/session.js';
import { DEFAULT_OPTIONS, TONE_RELATIONSHIPS, type ToneRelationship } from './options.js';

export interface CustomSearch extends SessionSearch, RangeSearch {
  intervals: string;
  modes: string;
  rel: ToneRelationship;
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
    ...parseRangeSearch(search, DEFAULT_OPTIONS.range),
    ...parseSessionSearch(search),
    names: enumParam(search.names, NAME_STYLES, legacyNames(search.longNames)),
  };
}
