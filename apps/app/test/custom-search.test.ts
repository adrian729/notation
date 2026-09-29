import { describe, expect, it } from 'vitest';
import { DEFAULT_CUSTOM_OPTIONS, validateCustomOptions } from '@/exercises/chord-identification';
import { DEFAULT_OPTIONS as IDENTIFICATION_DEFAULTS, validateOptions } from '@/exercises/interval-identification';
import { parseCustomSearch } from '@/exercises/interval-comparison/customSearch';

describe('parseCustomSearch', () => {
  it('fills every field with defaults when given an empty object', () => {
    const search = parseCustomSearch({});
    expect(search.rel).toBe('common-first');
    expect(search.tempo).toBe('medium');
    expect(search.count).toBe('10');
    expect(search.endless).toBe('0');
    expect(search.auto).toBe('0');
    expect(search.names).toBe('full');
  });

  it('falls back to defaults for stale or invalid enum and numeric values', () => {
    const search = parseCustomSearch({
      rel: 'not-a-relationship',
      tempo: 'ludicrous',
      count: 'not-a-number',
      endless: 'yes',
      auto: 'yes',
    });
    expect(search.rel).toBe('common-first');
    expect(search.tempo).toBe('medium');
    expect(search.count).toBe('10');
    expect(search.endless).toBe('0');
    expect(search.auto).toBe('0');
  });

  it('clamps a question count outside the allowed bounds instead of resetting to the default', () => {
    expect(parseCustomSearch({ count: '0' }).count).toBe('1');
    expect(parseCustomSearch({ count: '201' }).count).toBe('200');
    expect(parseCustomSearch({ count: '3.5' }).count).toBe('4');
    expect(parseCustomSearch({ count: '50' }).count).toBe('50');
  });

  it('passes through valid values unchanged', () => {
    const search = parseCustomSearch({
      rel: 'nearby',
      tempo: 'fast',
      count: '25',
      endless: '1',
      auto: '1',
    });
    expect(search.rel).toBe('nearby');
    expect(search.tempo).toBe('fast');
    expect(search.count).toBe('25');
    expect(search.endless).toBe('1');
    expect(search.auto).toBe('1');
  });

  it('maps the legacy longNames flag to names', () => {
    expect(parseCustomSearch({ longNames: false }).names).toBe('short');
    expect(parseCustomSearch({ longNames: false, names: 'full' }).names).toBe('full');
  });
});

describe('range fit validation', () => {
  it.each([
    [
      'chord',
      validateCustomOptions({ ...DEFAULT_CUSTOM_OPTIONS, chords: ['maj', 'dim7'], range: { low: 'C4', high: 'D4' } }),
    ],
    [
      'interval',
      validateOptions({ ...IDENTIFICATION_DEFAULTS, intervals: ['m2', 'P8'], range: { low: 'C4', high: 'E4' } }),
    ],
  ])('rejects a range narrower than the widest %s', (_, result) => {
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Range too narrow');
  });
});
