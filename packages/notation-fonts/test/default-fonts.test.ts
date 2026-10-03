import { describe, expect, it } from 'vitest';
import notation from '../fonts/polyhymnia-notation/metadata.json' with { type: 'json' };
import mensural from '../fonts/polyhymnia-mensural/metadata.json' with { type: 'json' };
import manuscript from '../fonts/polyhymnia-manuscript/metadata.json' with { type: 'json' };
import { fontFaceCss, glyphStyles, type GlyphStyleName, type SmuflMetadata } from '../src/index.js';

describe('shipped fonts', () => {
  it.each<[string, SmuflMetadata, GlyphStyleName]>([
    ['PolyhymniaNotation', notation as unknown as SmuflMetadata, 'modern'],
    ['PolyhymniaMensural', mensural as unknown as SmuflMetadata, 'mensural'],
    ['PolyhymniaManuscript', manuscript as unknown as SmuflMetadata, 'mensural'],
  ])('%s has metrics for every declared glyph of its style', (name, metadata, style) => {
    expect(metadata.fontName).toBe(name);
    const missing = Object.keys(glyphStyles[style].glyphs).filter(
      (glyph) => !(glyph in metadata.glyphAdvanceWidths) || !(glyph in metadata.glyphBBoxes),
    );
    expect(missing).toEqual([]);
  });
});

describe('fontFaceCss', () => {
  it.each([
    ['./fonts/a.woff2?v=1', "url('./fonts/a.woff2?v=1') format('woff2')"],
    ['data:font/ttf;base64,AAAA', "url('data:font/ttf;base64,AAAA') format('truetype')"],
    ['/fonts/unknown', "url('/fonts/unknown');"],
  ])('declares %s with its format', (src, expected) => {
    const css = fontFaceCss({ name: "O'Font", metadata: notation as unknown as SmuflMetadata, src });
    expect(css).toContain("font-family: 'O\\'Font';");
    expect(css).toContain(expected);
  });
});
