import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { MnxDocument } from '@polyhymnia/mnx';
import { layoutScore, hitTest, positionAtTick, DEFAULT_FONTS } from '../src/index.js';
import { modernStyle } from '@polyhymnia/notation-fonts';
import { measure, mnx, note } from './mnx.js';

const example = (name: string): MnxDocument =>
  JSON.parse(readFileSync(new URL(`../../mnx/schema/examples/${name}.json`, import.meta.url), 'utf8'));

describe('grace engraving', () => {
  it('clears the full flag and slash before the main notehead', () => {
    const result = layoutScore(example('grace-note'), { style: 'modern' });
    const grace = result.elements['m0.s0.e0']!;
    const main = result.elements['m0.s0.e1']!;
    const glyphBounds = DEFAULT_FONTS.modern.metadata.glyphBBoxes!;
    for (const name of ['flag8thUp', 'graceNoteSlashStemUp']) {
      const glyph = result.glyphs.find((g) => g.el === grace.id && g.cp === modernStyle.glyphs[name])!;
      const right = glyph.x + glyphBounds[name]!.bBoxNE[0] * glyph.scale!;
      expect(main.x - right).toBeGreaterThanOrEqual(0.4 - 1e-9);
    }
  });

  it('keeps grace groups attached during justification, with separate accidentals and query targets', () => {
    const doc = mnx({}, measure({ type: 'grace', content: [note('C#6', '8'), note('C6', '8')] }, note('C#6', 'w')));
    const small = layoutScore(doc, { style: 'modern', widthSp: 40 });
    const large = layoutScore(doc, { style: 'modern', widthSp: 100 });
    expect(small.diagnostics).toEqual([]);
    const [first, second, main] = ['m0.s0.e0', 'm0.s0.e1', 'm0.s0.e2'].map((id) => small.elements[id]!);
    expect(first.x + first.w).toBeLessThan(second.x);
    expect(second.x + second.w).toBeLessThan(main.x);
    expect(large.elements[main.id]!.x - large.elements[first.id]!.x).toBeCloseTo(main.x - first.x);
    expect(first.h / main.h).toBeCloseTo(0.6);
    expect(small.glyphs.filter((g) => g.cp === modernStyle.glyphs.accidentalSharp).map((g) => g.el)).toEqual([
      first.id,
      main.id,
    ]);
    expect(small.glyphs.find((g) => g.cp === modernStyle.glyphs.accidentalNatural)?.el).toBe(second.id);
    expect(small.glyphs.filter((g) => g.el === first.id).every((g) => g.cls === 'grace' && g.scale === 0.6)).toBe(true);
    expect(small.rects.some((r) => r.cls === 'ledger-line' && r.el === first.id)).toBe(true);
    expect(hitTest(small, { x: first.x + first.w / 2, y: first.y + first.h / 2 })).toMatchObject({
      id: first.id,
      box: { eventId: first.id },
    });
    expect(small.slots.map((s) => s.eventId)).toEqual([main.id]);
    expect(positionAtTick(small, 0)?.x).toBe(main.x);
  });

  it.each(['grace-notes-beamed', 'beams-inner-grace-notes'])(
    'resolves %s without dropping or mixing its beams',
    (name) => {
      const result = layoutScore(example(name), { style: 'modern' });
      expect(result.diagnostics).toEqual([]);
      expect(result.paths.some((p) => p.cls === 'beam')).toBe(true);
      const grace = Object.values(result.elements).filter((e) => e.kind === 'grace');
      expect(grace.length).toBeGreaterThan(0);
      for (const entry of grace) {
        const stem = result.rects.find((r) => r.cls === 'stem' && r.el === entry.id)!;
        expect(stem.y).toBeLessThan(entry.y);
      }
    },
  );
});
