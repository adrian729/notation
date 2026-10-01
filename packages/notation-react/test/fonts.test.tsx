import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { NotationFont } from '@polyhymnia/notation-fonts';
import { parsePitch } from '@polyhymnia/mnx';
import type { MnxDocument } from '@polyhymnia/mnx';
import { Notation } from '../src/Notation.js';

afterEach(cleanup);

const score: MnxDocument = {
  mnx: { version: 1 },
  global: { measures: [{ time: { count: 4, unit: 4 } }] },
  parts: [
    {
      measures: [
        {
          clefs: [{ clef: { sign: 'G', staffPosition: -2 } }],
          sequences: [{ content: [{ duration: { base: 'whole' }, notes: [{ pitch: parsePitch('C4') }] }] }],
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
});
