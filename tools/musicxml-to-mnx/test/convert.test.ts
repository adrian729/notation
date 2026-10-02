import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { check } from '../src/check.js';
import { convert } from '../src/convert.js';
import { assignIds } from '../src/ids.js';

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url));
const read = (name: string) => readFileSync(`${FIXTURES}${name}`, 'utf8');

describe('convert', () => {
  it('yields schema-valid, id-assigned output with no warnings for a supported file', () => {
    const result = convert(read('basic.musicxml'));
    if (!result.ok) throw new Error(result.error);
    expect(result.warnings).toEqual([]);
    const doc = assignIds(result.mnx) as any;
    expect(check(doc)).toEqual({ ok: true, problems: [] });
    expect(doc.parts[0].measures[0].sequences[0].content[0].id).toBe('e0-0');
  });

  it('surfaces converter warnings', () => {
    const result = convert(read('simple-repeat.musicxml'));
    expect(result.ok).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatchObject({ code: expect.stringMatching(/^unrepresentable:/) });
  });

  it('returns an error result instead of throwing on an input the converter refuses', () => {
    const composite = read('basic.musicxml')
      .replace('<beats>4</beats>', '<beats>3+2</beats>')
      .replace('<beat-type>4', '<beat-type>8');
    const result = convert(composite);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toBe('');
  });

  it('returns an error result for malformed XML', () => {
    expect(convert('<score-partwise>').ok).toBe(false);
  });
});

describe('check', () => {
  it('reports schema problems', () => {
    const result = check({ not: 'an mnx document' });
    expect(result.ok).toBe(false);
    expect(result.problems.length).toBeGreaterThan(0);
  });
});
