import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readMnx } from '@polyhymnia/mnx';
import { layoutScore } from '@polyhymnia/notation-engine';

const SCORES_DIR = fileURLToPath(new URL('../src/assets/scores/', import.meta.url));
const UNSUPPORTED_ALLOWLIST: Readonly<Record<string, readonly string[]>> = {};
const EXPECTED_CODES: Readonly<Record<string, readonly string[]>> = {};

const files = readdirSync(SCORES_DIR).filter((f) => f.endsWith('.mnx.json'));

describe('committed scores render', () => {
  it.each(files)('%s', (file) => {
    const read = readMnx(JSON.parse(readFileSync(SCORES_DIR + file, 'utf8')));
    expect(read.doc).not.toBeNull();
    const { diagnostics } = layoutScore(read.doc!, 800);
    const all = [...read.diagnostics, ...diagnostics];
    const expected = EXPECTED_CODES[file] ?? [];
    expect(all.filter((d) => d.severity === 'error' && !expected.includes(d.code))).toEqual([]);
    const allowed = UNSUPPORTED_ALLOWLIST[file] ?? [];
    expect(all.filter((d) => d.code === 'mnx-unsupported' && !allowed.some((m) => d.message.includes(m)))).toEqual([]);
    for (const code of expected) {
      expect(all.map((d) => d.code)).toContain(code);
    }
  });
});
