import { listParam } from '../shared/customSearch.js';
import { parseSessionSearch, type SessionSearch } from '../shared/session.js';
import { DEFAULT_CUSTOM_OPTIONS } from './options.js';

export interface CustomSearch extends SessionSearch {
  chords: string;
  exec: string;
  dirs: string;
}

export function parseCustomSearch(search: Record<string, unknown>): CustomSearch {
  return {
    chords: listParam(search.chords, DEFAULT_CUSTOM_OPTIONS.chords),
    exec: listParam(search.exec, DEFAULT_CUSTOM_OPTIONS.executions),
    dirs: listParam(search.dirs, DEFAULT_CUSTOM_OPTIONS.directions),
    ...parseSessionSearch(search),
  };
}
