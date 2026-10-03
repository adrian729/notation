import { describe, expect, it } from 'vitest';
import { hitTest, layoutScore } from '../src/index.js';
import { fixture, measure, mnx, note, withPart } from './mnx.js';

const marks = new Set(['articulation', 'fermata', 'dynamic', 'hairpin']);

describe('mark targets and clearance', () => {
  it('gives every mark a stable, separate hit target, including a hairpin split across systems', () => {
    const doc = fixture('fermatas-hairpins');
    const layout = layoutScore(doc, { style: 'modern' });
    const wide = layoutScore(doc, { style: 'modern', widthSp: 120 });
    expect(layout.diagnostics).toEqual([
      { severity: 'warning', code: 'mnx-unsupported', message: 'Unsupported MNX: score name; not drawn.' },
    ]);
    const boxes = Object.values(layout.elements).filter((b) => marks.has(b.kind));
    expect(new Set(boxes.map((b) => b.kind))).toEqual(marks);
    expect(boxes.map((b) => b.id).sort()).toEqual(
      Object.values(wide.elements)
        .filter((b) => marks.has(b.kind))
        .map((b) => b.id)
        .sort(),
    );
    for (const box of boxes) {
      expect(
        hitTest(layout, { x: box.x + box.w / 2, y: box.y + box.h / 2 }, { kinds: ['element'], radius: 0 }),
      ).toMatchObject({
        id: box.id,
        part: box.kind,
        pitch: null,
      });
      expect(layout.glyphs.some((g) => g.el === box.id) || layout.paths.some((p) => p.el === box.id)).toBe(true);
    }
    const hairpins = boxes.filter((b) => b.kind === 'hairpin' && (b.id === 'm2.dyn0' || b.sourceId === 'm2.dyn0'));
    expect(hairpins).toHaveLength(2);
    expect(new Set(hairpins.map((b) => b.systemIndex)).size).toBe(2);
    const head = layout.elements.a!;
    expect(hitTest(layout, { x: head.x + head.w / 2, y: head.y + head.h / 2 })).toMatchObject({
      id: 'a',
      part: 'notehead',
    });
    expect(layout.elements['a.staccato']!.eventId).toBe('a');
  });

  it('preserves explicit ids and resolves synthetic mark collisions without hiding an existing target', () => {
    const doc = mnx(
      {},
      withPart(
        { dynamics: [{ id: 'loudness', type: 'immediate', value: 'p', position: { fraction: [0, 1] } }] },
        measure(
          note('B4', 'h', { id: 'n', markings: { staccato: { id: 'dot' }, accent: {} }, fermata: { id: 'hold' } }),
          note('C5', 'h', { id: 'n.accent' }),
        ),
      ),
    );
    const layout = layoutScore(doc);
    expect(layout.elements.dot).toMatchObject({ kind: 'articulation', eventId: 'n' });
    expect(layout.elements.hold).toMatchObject({ kind: 'fermata', eventId: 'n' });
    expect(layout.elements.loudness).toMatchObject({ kind: 'dynamic' });
    expect(layout.elements['n.accent']!.kind).toBe('note');
    expect(layout.elements['n.accent~2']!.kind).toBe('articulation');
    expect(layout.diagnostics.map((d) => d.code)).toEqual(['id-collision']);
    expect(
      hitTest(
        layout,
        { x: layout.elements.loudness!.x, y: layout.elements.loudness!.y },
        { kinds: ['element'], voice: 1 },
      ),
    ).toMatchObject({ id: 'loudness' });

    const grand = mnx({}, measure(note('B4', 'w', { id: 'm0.fermata' })));
    grand.global.measures[0]!.fermata = {};
    grand.parts[0]!.staves = 2;
    grand.parts[0]!.measures[0]!.sequences.push({ staff: 2, content: [note('C4', 'w', { id: 'm0.fermata~2.st2' })] });
    const grandLayout = layoutScore(grand);
    const fermatas = Object.values(grandLayout.elements).filter((b) => b.kind === 'fermata');
    expect(fermatas.map((b) => b.id)).toEqual(['m0.fermata~2', 'm0.fermata~2.st2~2']);
    expect(fermatas.every((b) => b.eventId === undefined && b.tick === 4 * grandLayout.timeline.divisions)).toBe(true);
    expect(fermatas[1]!.sourceId).toBe(fermatas[0]!.id);
    expect(grandLayout.glyphs.filter((g) => g.cls === 'fermata').map((g) => g.el)).toEqual(fermatas.map((b) => b.id));
    expect(grandLayout.diagnostics.map((d) => d.code)).toEqual(['id-collision', 'id-collision']);
  });

  it('does not displace an accent for neighboring ink that is horizontally clear', () => {
    const bare = mnx({}, measure(note('B4', 'w', { id: 'main', markings: { accent: { placement: 'above' } } })));
    const near = structuredClone(bare);
    near.parts[0]!.measures[0]!.sequences[0]!.content.unshift({
      type: 'grace',
      slash: false,
      content: [note('A5', 'q', { id: 'near' })],
    });
    const options = { style: 'modern' as const, widthSp: 40 };
    const control = layoutScore(bare, options).elements['main.accent']!;
    const layout = layoutScore(near, options);
    const accent = layout.elements['main.accent']!;
    const ledger = layout.rects.find((r) => r.el === 'near' && r.cls === 'ledger-line')!;
    expect(accent.x - (ledger.x + ledger.w)).toBeGreaterThan(0);
    expect(accent.staffPosition).toBeCloseTo(control.staffPosition);
  });

  it('reserves tie space and keeps voice markings attached while clearing actual neighboring ink', () => {
    const doc = fixture('mark-clearance');
    const untied = structuredClone(doc);
    for (const measure of untied.parts[0]!.measures) {
      for (const sequence of measure.sequences)
        for (const event of sequence.content) {
          if ('notes' in event) for (const note of event.notes ?? []) delete note.ties;
        }
    }
    const layout = layoutScore(doc, { style: 'modern' });
    const control = layoutScore(untied, { style: 'modern' });
    for (const [id, gap] of [
      ['bstaccato.staccato', 1],
      ['btenuto.tenuto', 0.6],
    ] as const) {
      const box = layout.elements[id]!;
      const other = control.elements[id]!;
      expect(box.staffPosition - other.staffPosition).toBeCloseTo(gap);
    }
    const accent = layout.elements['accentOwner.accent']!;
    const staccato = layout.elements['accentOwner.staccato']!;
    const owner = layout.elements.accentOwner!;
    expect(accent.y).toBeGreaterThan(owner.y + owner.h);
    expect(accent.y).toBeGreaterThan(staccato.y + staccato.h);
    const forced = structuredClone(doc);
    const event = forced.parts[0]!.measures[2]!.sequences[0]!.content[0];
    if ('markings' in event) event.markings!.accent!.placement = 'above';
    const forcedLayout = layoutScore(forced, { style: 'modern' });
    const raised = forcedLayout.elements['accentOwner.accent']!;
    const neighbor = forcedLayout.elements.neighbor!;
    expect(neighbor.y - (raised.y + raised.h)).toBeGreaterThanOrEqual(0.4 - 1e-9);
    expect(layout.diagnostics).toEqual([
      { severity: 'warning', code: 'mnx-unsupported', message: 'Unsupported MNX: score name; not drawn.' },
    ]);
  });
});
