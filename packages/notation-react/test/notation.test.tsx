import { createRef } from 'react';
import type { JSX } from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { layoutScore, positionAtTick } from '@polyhymnia/notation-engine';
import type { Event, MnxDocument, NoteValue, Pitch } from '@polyhymnia/mnx';
import { Notation } from '../src/Notation.js';
import type { NotationHandle } from '../src/Notation.js';
import type { PlaybackView } from '../src/Notation.js';

afterEach(cleanup);

const TREBLE_CLEF = 0xe050;
const NOTEHEAD_QUARTER = 0xe93d;

const QUARTER: NoteValue = { base: 'quarter' };
const HALF: NoteValue = { base: 'half' };

function noteEvent(pitch: Pitch, duration: NoteValue): Event {
  return { duration, notes: [{ pitch }] };
}

function restEvent(duration: NoteValue): Event {
  return { duration, rest: {} };
}

function simpleScore(): MnxDocument {
  return {
    mnx: { version: 1 },
    global: {
      measures: [{ time: { count: 4, unit: 4 } }, {}],
    },
    parts: [
      {
        measures: [
          {
            clefs: [{ clef: { sign: 'G', staffPosition: -2 } }],
            sequences: [
              {
                content: [
                  noteEvent({ step: 'C', octave: 4 }, QUARTER),
                  noteEvent({ step: 'E', octave: 4 }, QUARTER),
                  noteEvent({ step: 'G', octave: 4 }, HALF),
                ],
              },
            ],
          },
          {
            sequences: [
              {
                content: [
                  noteEvent({ step: 'A', octave: 5 }, QUARTER),
                  restEvent(QUARTER),
                  noteEvent({ step: 'C', octave: 3 }, HALF),
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('<Notation>', () => {
  it('renders one <svg> with the sp-unit viewBox layout reports', () => {
    const doc = simpleScore();
    const layout = layoutScore(doc);
    const { container } = render(<Notation score={doc} />);
    const svg = container.querySelector('svg')!;

    expect(svg.getAttribute('viewBox')).toBe(
      `${layout.viewBox.x} ${layout.viewBox.y} ${layout.viewBox.w} ${layout.viewBox.h}`,
    );
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.classList.contains('pn-notation')).toBe(true);
  });

  it('emits one <text> per notehead at the codepoint and coordinates layout computed', () => {
    const doc = simpleScore();
    const layout = layoutScore(doc);
    const { container } = render(<Notation score={doc} />);

    const heads = [...container.querySelectorAll('[data-pn="notehead"]')];
    const expected = layout.glyphs.filter((g) => g.cls === 'notehead');
    expect(heads).toHaveLength(expected.length);
    expect(expected).not.toHaveLength(0);

    heads.forEach((head, i) => {
      const g = expected[i]!;
      expect(head.tagName.toLowerCase()).toBe('text');
      expect(head.getAttribute('x')).toBe(String(g.x));
      expect(head.getAttribute('y')).toBe(String(g.y));
      expect(head.textContent).toBe(String.fromCodePoint(g.cp));
      expect(head.getAttribute('fill')).toBe('currentColor');
    });

    expect(heads[0]!.textContent!.codePointAt(0)).toBe(NOTEHEAD_QUARTER);
    expect(container.querySelector('[data-pn="clef"]')!.textContent!.codePointAt(0)).toBe(TREBLE_CLEF);
  });

  it('scales a glyph with GlyphRun.scale, such as the brace of a two-staff part', () => {
    const base = simpleScore();
    const doc: MnxDocument = { ...base, parts: [{ ...base.parts[0]!, staves: 2 }] };
    const brace = layoutScore(doc).glyphs.find((g) => g.cls === 'brace')!;
    const { container } = render(<Notation score={doc} />);

    expect(brace.scale).toBeGreaterThan(1);
    expect(container.querySelector('[data-pn="brace"]')!.getAttribute('font-size')).toBe(String(4 * brace.scale!));
    expect(container.querySelector('[data-pn="notehead"]')!.hasAttribute('font-size')).toBe(false);
  });

  it('wraps each element in a <g> labelled from ElementBox.label', () => {
    const doc = simpleScore();
    const layout = layoutScore(doc);
    const { container } = render(<Notation score={doc} />);

    const groups = [...container.querySelectorAll('[data-pn="element"]')];
    expect(groups.length).toBe(Object.keys(layout.elements).length);
    for (const group of groups) {
      const id = group.getAttribute('data-pn-el')!;
      expect(group.getAttribute('aria-label')).toBe(layout.elements[id]!.label);
    }
    expect(groups[0]!.getAttribute('aria-label')).toBe('C 4, quarter note, measure 1');
  });

  it("keeps an element's DOM node stable when an earlier event shifts its position", () => {
    const noteA: Event = { id: 'note-a', duration: QUARTER, notes: [{ pitch: { step: 'C', octave: 4 } }] };
    const noteB: Event = { id: 'note-b', duration: QUARTER, notes: [{ pitch: { step: 'E', octave: 4 } }] };
    const noteC: Event = { id: 'note-c', duration: QUARTER, notes: [{ pitch: { step: 'G', octave: 4 } }] };
    const restFill = restEvent(HALF);
    const measureShell = { clefs: [{ clef: { sign: 'G' as const, staffPosition: -2 } }] };
    const before: MnxDocument = {
      mnx: { version: 1 },
      global: { measures: [{ time: { count: 4, unit: 4 } }] },
      parts: [{ measures: [{ ...measureShell, sequences: [{ content: [noteA, noteB, restFill] }] }] }],
    };
    const after: MnxDocument = {
      mnx: { version: 1 },
      global: { measures: [{ time: { count: 4, unit: 4 } }] },
      parts: [{ measures: [{ ...measureShell, sequences: [{ content: [noteC, noteA, noteB] }] }] }],
    };

    const { container, rerender } = render(<Notation score={before} />);
    const before_a = container.querySelector('g[data-pn="element"][data-pn-el="note-a"]')!;
    rerender(<Notation score={after} />);
    const after_a = container.querySelector('g[data-pn="element"][data-pn-el="note-a"]')!;
    expect(after_a).toBe(before_a);
  });
});

describe('NotationHandle', () => {
  it('exposes layout, timeline, and SVG export; throws only for the unbuilt cursor', () => {
    const ref = createRef<NotationHandle>();
    render(<Notation score={simpleScore()} ref={ref} />);
    const handle = ref.current!;

    expect(handle.getLayout().version).toBe(1);
    expect(handle.getTimeline()).toBe(handle.getLayout().timeline);
    expect(handle.getTimeline().entries.length).toBeGreaterThan(0);

    const svg = handle.exportSVG();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('http://www.w3.org/2000/svg');

    expect(() => handle.focus('n1')).not.toThrow();
    expect(() => handle.setPlaybackTick(0)).not.toThrow();
  });
});

function beamAndTieScore(): MnxDocument {
  return {
    mnx: { version: 1 },
    global: { measures: [{ time: { count: 4, unit: 4 } }] },
    parts: [
      {
        measures: [
          {
            clefs: [{ clef: { sign: 'G', staffPosition: -2 } }],
            sequences: [
              {
                content: [
                  { duration: { base: 'eighth' }, notes: [{ pitch: { step: 'C', octave: 4 }, id: 'bn1' }] },
                  { duration: { base: 'eighth' }, notes: [{ pitch: { step: 'D', octave: 4 }, id: 'bn2' }] },
                  {
                    duration: { base: 'quarter' },
                    notes: [{ pitch: { step: 'E', octave: 4 }, id: 'bn3', ties: [{ target: 'bn4' }] }],
                  },
                  { duration: { base: 'quarter' }, notes: [{ pitch: { step: 'E', octave: 4 }, id: 'bn4' }] },
                  restEvent(QUARTER),
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('playback highlighting', () => {
  it('mode "notes" sets data-pn-playing on exactly the given ids', () => {
    const doc = beamAndTieScore();
    const { container } = render(
      <Notation score={doc}>
        <Notation.Playback view={{ mode: 'notes', activeIds: ['bn1', 'bn3'] }} />
      </Notation>,
    );

    expect(container.querySelector('g[data-pn="element"][data-pn-el="bn1"]')?.getAttribute('data-pn-playing')).toBe(
      'true',
    );
    expect(container.querySelector('g[data-pn="element"][data-pn-el="bn3"]')?.getAttribute('data-pn-playing')).toBe(
      'true',
    );
    expect(container.querySelector('g[data-pn="element"][data-pn-el="bn2"]')?.hasAttribute('data-pn-playing')).toBe(
      false,
    );
    expect(container.querySelector('g[data-pn="element"][data-pn-el="bn4"]')?.hasAttribute('data-pn-playing')).toBe(
      false,
    );
  });

  it('setPlaybackTick highlights exactly the notes sounding at a tick, via the timeline', () => {
    const doc = beamAndTieScore();
    const ref = createRef<NotationHandle>();
    const { container } = render(<Notation score={doc} ref={ref} />);
    const handle = ref.current!;
    const timeline = handle.getTimeline();

    handle.setPlaybackTick(timeline.byId('bn1')!.tick + 10);
    expect(container.querySelector('g[data-pn="element"][data-pn-el="bn1"]')?.getAttribute('data-pn-playing')).toBe(
      'true',
    );
    expect(container.querySelector('g[data-pn="element"][data-pn-el="bn2"]')?.hasAttribute('data-pn-playing')).toBe(
      false,
    );

    const bn4 = timeline.byId('bn4')!;
    handle.setPlaybackTick(bn4.tick + bn4.durationTicks - 10);
    expect(container.querySelector('g[data-pn="element"][data-pn-el="bn4"]')?.getAttribute('data-pn-playing')).toBe(
      'true',
    );
    expect(container.querySelector('g[data-pn="element"][data-pn-el="bn3"]')?.hasAttribute('data-pn-playing')).toBe(
      false,
    );
    expect(container.querySelector('g[data-pn="element"][data-pn-el="bn1"]')?.hasAttribute('data-pn-playing')).toBe(
      false,
    );
  });

  it('reapplies highlights when the score re-lays out and the highlighted element gets a new DOM node', () => {
    const oneNote: MnxDocument = {
      mnx: { version: 1 },
      global: { measures: [{ time: { count: 4, unit: 4 } }] },
      parts: [
        {
          measures: [
            {
              clefs: [{ clef: { sign: 'G', staffPosition: -2 } }],
              sequences: [
                { content: [{ duration: { base: 'quarter' }, notes: [{ pitch: { step: 'C', octave: 4 }, id: 'x' }] }] },
              ],
            },
          ],
        },
      ],
    };
    const twoNotes: MnxDocument = {
      ...oneNote,
      parts: [
        {
          measures: [
            {
              clefs: [{ clef: { sign: 'G', staffPosition: -2 } }],
              sequences: [
                {
                  content: [
                    { duration: { base: 'quarter' }, notes: [{ pitch: { step: 'D', octave: 4 }, id: 'y' }] },
                    { duration: { base: 'quarter' }, notes: [{ pitch: { step: 'C', octave: 4 }, id: 'x' }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const view: PlaybackView = { mode: 'notes', activeIds: ['x'] };
    const { container, rerender } = render(
      <Notation score={oneNote}>
        <Notation.Playback view={view} />
      </Notation>,
    );
    expect(container.querySelector('g[data-pn="element"][data-pn-el="x"]')?.getAttribute('data-pn-playing')).toBe(
      'true',
    );

    rerender(
      <Notation score={twoNotes}>
        <Notation.Playback view={view} />
      </Notation>,
    );
    expect(container.querySelector('g[data-pn="element"][data-pn-el="x"]')?.getAttribute('data-pn-playing')).toBe(
      'true',
    );
  });
});

describe('playback cursor', () => {
  const NARROW = { widthSp: 20 };

  it('draws the cursor at positionAtTick on the right system, moves via handle, absent when off', () => {
    const ref = createRef<NotationHandle>();
    const { container, rerender } = render(
      <Notation score={simpleScore()} options={NARROW} ref={ref}>
        <Notation.Playback view={{ mode: 'cursor', position: { tick: 0 } }} />
      </Notation>,
    );
    const handle = ref.current!;
    const layout = handle.getLayout();
    expect(layout.systems.length).toBeGreaterThan(1);
    const rect = (): Element => container.querySelector('[data-pn-cursor] rect')!;
    const group = (): Element => container.querySelector('[data-pn-cursor]')!;

    const last = layout.timeline.entries[layout.timeline.entries.length - 1]!;
    const first = positionAtTick(layout, 0)!;
    expect(group().getAttribute('data-pn-system')).toBe(String(first.systemIndex));

    handle.setPlaybackTick(last.tick);
    const pos = positionAtTick(layout, last.tick)!;
    expect(pos.systemIndex).toBe(layout.systems.length - 1);
    expect(group().getAttribute('data-pn-system')).toBe(String(pos.systemIndex));
    expect(Number(rect().getAttribute('x'))).toBeLessThan(pos.x);
    expect(Number(rect().getAttribute('x')) + Number(rect().getAttribute('width') ?? 0.3) / 2).toBeCloseTo(pos.x);
    expect(Number(rect().getAttribute('y'))).toBeCloseTo(pos.yTop);
    expect(Number(rect().getAttribute('height'))).toBeCloseTo(pos.yBottom - pos.yTop);

    rerender(
      <Notation score={simpleScore()} options={NARROW} ref={ref}>
        <Notation.Playback view={{ mode: 'off' }} />
      </Notation>,
    );
    expect(container.querySelector('[data-pn-cursor]')).toBeNull();
  });

  it('keeps the imperatively driven cursor across parent re-renders with an inline view', () => {
    const ref = createRef<NotationHandle>();
    const score = simpleScore();
    const tree = (): JSX.Element => (
      <Notation score={score} options={NARROW} ref={ref}>
        <Notation.Playback view={{ mode: 'cursor' }} />
      </Notation>
    );
    const { container, rerender } = render(tree());
    const last = ref.current!.getLayout().timeline.entries.at(-1)!;
    ref.current!.setPlaybackTick(last.tick);
    const x = container.querySelector('[data-pn-cursor] rect')!.getAttribute('x');
    rerender(tree());
    expect(container.querySelector('[data-pn-cursor] rect')!.getAttribute('x')).toBe(x);
  });
});
