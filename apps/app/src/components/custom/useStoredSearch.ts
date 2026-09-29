import { useEffect, useMemo, useRef } from 'react';
import { readJson, writeJson } from '@/lib/storage';

interface StoredSearchOptions<S extends object> {
  prefsKey: string;
  parse: (search: Record<string, unknown>) => S;
  search: S;
  navigate: (search: S) => void;
}

function storedFields(stored: unknown): Record<string, unknown> | undefined {
  if (typeof stored !== 'object' || stored === null) return undefined;
  const { search, ...rest } = stored as Record<string, unknown>;
  return { ...rest, ...(typeof search === 'object' && search !== null ? search : {}) };
}

export function useStoredSearch<S extends object>({ prefsKey, parse, search, navigate }: StoredSearchOptions<S>) {
  const defaults = useMemo(() => parse({}), [parse]);
  const initialSearchRef = useRef(search);

  useEffect(() => {
    if (JSON.stringify(initialSearchRef.current) !== JSON.stringify(defaults)) return;
    const fields = storedFields(readJson(prefsKey));
    if (fields) navigate(parse(fields));
  }, []);

  const commit = (next: S) => {
    writeJson(prefsKey, { search: next });
    navigate(next);
  };

  return {
    update: (patch: Partial<S>) => commit({ ...search, ...patch }),
    reset: () => commit(defaults),
  };
}
