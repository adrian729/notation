import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsePitch } from '@polyhymnia/music-theory';
import { applyIntent } from '@polyhymnia/mnx/edit';
import type { MnxDocument } from '@polyhymnia/mnx';
import { layoutScore, positionAtTick, type LayoutResult } from '../src/index.js';
import { measure, mnx, note, withPart } from './mnx.js';

const eighths = (prefix: string) => Array.from({ length: 8 }, (_, i) => note('C5', '8', { id: `${prefix}${i}` }));

function beamIds(layout: LayoutResult): string[] {
  return layout.paths.filter((p) => p.cls === 'beam').map((p) => p.el!);
}

describe('layout on the timeline', () => {
  it('keeps beam ids stable across re-layouts of the same and of an edited document', () => {
    const doc = mnx({}, measure(...eighths('a')), measure(...eighths('b')));
    const first = beamIds(layoutScore(doc));
    const edited = applyIntent(doc, { type: 'setPitches', event: 'b3', pitches: [parsePitch('E5')] }).doc;

    expect(first).toEqual(['a0.beam', 'a4.beam', 'b0.beam', 'b4.beam']);
    expect(beamIds(layoutScore(doc))).toEqual(first);
    expect(beamIds(layoutScore(edited))).toEqual(first);
  });

  it('merges diagnostics as divisions, timeline, engine, then timeline and beam id collisions', () => {
    const doc = mnx(
      {},
      measure(note('C5', '8', { id: 'm0.s0.e1' }), ...Array.from({ length: 7 }, () => note('C5', '8'))),
      measure(note('C4', 'h', { id: 'm0.s0.e1.beam', markings: { spiccato: {} } })),
    );
    const layout = layoutScore(doc, { divisions: -1 });

    expect(layout.diagnostics.map((d) => d.code)).toEqual([
      'invalid-divisions',
      'measure-underfull',
      'mnx-unsupported',
      'id-collision',
      'id-collision',
    ]);
    expect(layout.diagnostics.slice(3).map((d) => d.message)).toEqual([
      'Synthesized id "m0.s0.e1" collides with an existing id; using "m0.s0.e1~2" instead.',
      'Synthesized id "m0.s0.e1.beam" collides with an existing id; using "m0.s0.e1.beam~2" instead.',
    ]);
    expect(beamIds(layout)).toContain('m0.s0.e1.beam~2');
  });

  it('reports an explicit beam id used twice', () => {
    const doc = mnx(
      {},
      withPart(
        {
          beams: [
            { id: 'beam', events: ['a0', 'a1'] },
            { id: 'beam', events: ['a2', 'a3'] },
          ],
        },
        measure(...eighths('a')),
      ),
    );
    const collisions = layoutScore(doc).diagnostics.filter((d) => d.code === 'id-collision');
    expect(collisions).toEqual([
      expect.objectContaining({ measureIndex: 0, message: expect.stringContaining('"beam"') }),
    ]);
  });

  it('places every drawn timeline entry and every measure', () => {
    const dir = new URL('./fixtures/', import.meta.url);
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const layout = layoutScore(JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as MnxDocument);
      const unplaced = layout.timeline.entries.filter(
        (e) => e.kind !== 'space' && !e.synthetic && !layout.placements.entries[e.id],
      );
      expect(unplaced, file).toEqual([]);
      expect(layout.placements.measures, file).toEqual(
        layout.measures.map(({ systemIndex, x, w }) => ({ systemIndex, x, w })),
      );
    }
  });

  it('positions a tick at a measure start and mid-note', () => {
    const layout = layoutScore(
      mnx(
        {},
        measure(note('C4', 'q', { id: 'c' }), note('D4', 'h.', { id: 'd' })),
        measure(note('E4', 'w', { id: 'e' })),
      ),
    );
    const at = (id: string) => layout.placements.entries[id]!;
    const system = layout.systems[0]!;
    const cases: [number, string, number][] = [
      [layout.timeline.measures[1]!.startTick, 'measure start', at('e').x],
      [1680, 'mid-note', (at('c').x + at('d').x) / 2],
    ];
    for (const [tick, label, x] of cases) {
      expect(positionAtTick(layout, tick), label).toEqual({
        systemIndex: 0,
        x,
        yTop: system.y,
        yBottom: system.y + system.h,
      });
    }
  });
});
