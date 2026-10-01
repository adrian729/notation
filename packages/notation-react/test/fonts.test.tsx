import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { NotationFont, SmuflMetadata } from '@polyhymnia/notation-fonts';
import defaultMetadata from '@polyhymnia/notation-fonts/fonts/polyhymnia-notation/metadata.json' with { type: 'json' };
import { layoutScore } from '@polyhymnia/notation-engine';
import type { MnxDocument } from '@polyhymnia/mnx';
import { Notation } from '../src/Notation.js';

afterEach(() => {
  cleanup();
  document.head.innerHTML = '';
});

const score: MnxDocument = {
  mnx: { version: 1 },
  global: { measures: [{ time: { count: 4, unit: 4 } }] },
  parts: [
    {
      measures: [
        {
          clefs: [{ clef: { sign: 'G', staffPosition: -2 } }],
          sequences: [{ content: [{ duration: { base: 'whole' }, notes: [{ pitch: { step: 'C', octave: 4 } }] }] }],
        },
      ],
    },
  ],
};

const customFont = {
  name: 'TestScoreFont',
  src: 'data:font/woff2;base64,AAAA',
  metadata: {},
} as unknown as NotationFont;

function glyphFamily(container: HTMLElement): string | null {
  return container.querySelector('[data-pn="glyphs"]')!.getAttribute('font-family');
}

describe('<Notation> fonts', () => {
  it.each([
    [undefined, 'mensural', 'PolyhymniaMensural'],
    [{ style: 'modern' as const }, 'modern', 'PolyhymniaNotation'],
  ])('default fonts keep their family for options %j', (options, style, family) => {
    const { container } = render(<Notation score={score} options={options} />);
    expect(container.querySelector('svg')!.getAttribute('data-pn-style')).toBe(style);
    expect(glyphFamily(container)).toBe(family);
  });

  it('applies a custom font family to glyph text and declares its @font-face', () => {
    const { container } = render(<Notation score={score} options={{ font: customFont }} />);
    expect(glyphFamily(container)).toBe('TestScoreFont');
    expect(document.head.innerHTML).toContain("font-family: 'TestScoreFont'");
  });

  it('falls back per glyph across a font list and declares every @font-face', () => {
    const base = defaultMetadata as unknown as SmuflMetadata;
    const without = <T,>(record: Readonly<Record<string, T>>, name: string): Record<string, T> =>
      Object.fromEntries(Object.entries(record).filter(([key]) => key !== name));
    const fontA: NotationFont = {
      name: 'A',
      src: 'data:font/woff2;base64,AAAA',
      metadata: {
        ...base,
        glyphAdvanceWidths: without(base.glyphAdvanceWidths, 'noteheadWhole'),
        glyphBBoxes: without(base.glyphBBoxes, 'noteheadWhole'),
      },
    };
    const fontB: NotationFont = { name: 'B', src: 'data:font/woff2;base64,BBBB', metadata: base };
    const options = { style: 'modern' as const, font: [fontA, fontB] };

    const layout = layoutScore(score, options);
    expect(layout.fonts?.slice(0, 2)).toEqual(['A', 'B']);
    const fallbackGlyphs = layout.glyphs.filter((g) => g.font === 1);
    expect(fallbackGlyphs.length).toBeGreaterThan(0);

    const { container } = render(<Notation score={score} options={options} />);
    expect(glyphFamily(container)).toBe('A');
    const texts = [...container.querySelectorAll('[data-pn="glyphs"] text')];
    const withFamily = texts.filter((t) => t.hasAttribute('font-family'));
    expect(withFamily).toHaveLength(fallbackGlyphs.length);
    expect(withFamily.every((t) => t.getAttribute('font-family') === 'B')).toBe(true);
    expect(texts.length - withFamily.length).toBeGreaterThan(0);
    expect(document.head.innerHTML).toContain("font-family: 'A'");
    expect(document.head.innerHTML).toContain("font-family: 'B'");
  });
});
