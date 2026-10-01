import { readFileSync } from 'node:fs';
import type { MnxDocument } from '@polyhymnia/mnx';
import type { NotationFont, SmuflMetadata } from '@polyhymnia/notation-fonts';
import modern from '@polyhymnia/notation-fonts/fonts/polyhymnia-notation/metadata.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';
import { layoutScore, type NotationOptions } from '../src/index.js';

const doc = JSON.parse(
  readFileSync(new URL('./fixtures/golden-scale-treble.json', import.meta.url), 'utf8'),
) as MnxDocument;
const base = modern as unknown as SmuflMetadata;

function font(name: string, edit: (metadata: SmuflMetadata) => Partial<SmuflMetadata>): NotationFont {
  return { name, src: `${name}.woff2`, metadata: { ...base, ...edit(base) } };
}

const without = <T>(record: Readonly<Record<string, T>>, name: string): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([key]) => key !== name));

const doubled = font('Doubled', (m) => ({
  glyphAdvanceWidths: Object.fromEntries(Object.entries(m.glyphAdvanceWidths).map(([k, v]) => [k, v * 2])),
}));
const partial = font('Partial', (m) => ({
  glyphAdvanceWidths: without(m.glyphAdvanceWidths, 'noteheadBlack'),
  glyphBBoxes: without(m.glyphBBoxes, 'noteheadBlack'),
}));

describe('fonts', () => {
  it('reflows the layout from a font with wider glyphs', () => {
    const width = (font?: NotationFont): number =>
      layoutScore(doc, { style: 'modern', maxLastSystemFill: 0, ...(font ? { font } : {}) }).viewBox.w;
    expect(width(doubled)).toBeGreaterThan(width());
  });

  const rows: { options?: NotationOptions; fonts?: readonly string[] }[] = [
    {},
    { options: { style: 'modern', font: doubled } },
    { options: { style: 'modern', font: partial }, fonts: ['Partial', 'PolyhymniaNotation'] },
  ];
  it.each(rows)('lists fonts only when a glyph falls back: $fonts', ({ options, fonts }) => {
    const result = layoutScore(doc, options);
    expect(result.fonts).toEqual(fonts);
    expect(result.glyphs.map((g) => g.font)).toEqual(
      result.glyphs.map((g) => (fonts ? (g.cp === 0xe0a4 ? 1 : 0) : undefined)),
    );
  });
});
