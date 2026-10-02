import { readFileSync } from 'node:fs';
import type { MnxDocument } from '@polyhymnia/mnx';
import type { NotationFont, SmuflMetadata } from '@polyhymnia/notation-fonts';
import leland from '@polyhymnia/notation-fonts/fonts/polyhymnia-muse/metadata.json' with { type: 'json' };
import rism from '@polyhymnia/notation-fonts/fonts/polyhymnia-rism/metadata.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';
import { layoutScore } from '../src/index.js';

const doc = JSON.parse(
  readFileSync(new URL('./fixtures/golden-scale-treble.json', import.meta.url), 'utf8'),
) as MnxDocument;

const lelandFont: NotationFont = {
  name: 'PolyhymniaMuse',
  metadata: leland as unknown as SmuflMetadata,
  src: 'polyhymnia-muse.woff2',
};
const ttfFont: NotationFont = {
  name: 'PolyhymniaRism',
  metadata: rism as unknown as SmuflMetadata,
  src: 'polyhymnia-rism.woff2',
};

function round(value: unknown): unknown {
  if (typeof value === 'number') return Math.round(value * 1000) / 1000;
  if (Array.isArray(value)) return value.map(round);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, round(v)]));
  }
  return value;
}

describe('font proof', () => {
  it('lays out with Leland metrics', async () => {
    const layout = layoutScore(doc, { style: 'modern', font: lelandFont });
    const { timeline: _timeline, placements: _placements, ...rest } = layout;
    const json = `${JSON.stringify(round(rest), null, 2)}\n`;
    await expect(json).toMatchFileSnapshot('__golden__/font-leland.json');
  });

  it('lays out with a TrueType font without SMuFL metadata', () => {
    const layout = layoutScore(doc, { style: 'modern', font: ttfFont });
    expect(layout.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
    expect(layout.glyphs.length).toBeGreaterThan(0);
    expect(layout.glyphs.every((g) => g.cp > 0)).toBe(true);
  });
});
