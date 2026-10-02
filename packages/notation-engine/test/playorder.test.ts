import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { MnxDocument } from '@polyhymnia/mnx';
import { layoutScore } from '../src/layout/index.js';
import { fixture } from './mnx.js';

function example(name: string): MnxDocument {
  return JSON.parse(
    readFileSync(new URL(`../../mnx/schema/examples/${name}.json`, import.meta.url), 'utf8'),
  ) as MnxDocument;
}

function measureOrder(name: string, doc: MnxDocument = fixture(name)) {
  const layout = layoutScore(doc);
  const { measures, playOrder } = layout.timeline;
  const order = playOrder.flatMap((segment) =>
    measures.filter((m) => m.startTick >= segment.fromTick && m.endTick <= segment.toTick).map((m) => m.index),
  );
  return { layout, order };
}

describe('play order', () => {
  it('picks voltas by pass', () => {
    expect(measureOrder('playorder-voltas').order).toEqual([0, 1, 0, 2, 3]);
  });

  it('plays every pass of endings that outnumber the repeat count', () => {
    expect(measureOrder('', example('repeats-alternate-endings-simple')).order).toEqual([0, 1, 0, 2, 0, 3]);
    expect(measureOrder('', example('repeats-alternate-endings-advanced')).order).toEqual([
      0, 1, 2, 0, 1, 2, 0, 3, 4, 5,
    ]);
  });

  it('plays dal segno al fine up to the fine', () => {
    expect(measureOrder('playorder-dsalfine').order).toEqual([0, 1, 2, 3, 1, 2]);
  });

  it('falls back on nested repeats', () => {
    const doc = example('repeats-alternate-endings-simple');
    const g = doc.global.measures;
    g[1] = { repeatStart: {}, repeatEnd: {} };
    g[2] = { repeatEnd: {} };
    g[3] = {};
    const { layout, order } = measureOrder('', doc);
    expect(order).toEqual([0, 1, 2, 3]);
    expect(layout.diagnostics.some((d) => d.code === 'mnx-unsupported' && /nested repeats/.test(d.message))).toBe(true);
  });

  it('falls back to written order with a diagnostic', () => {
    const { layout, order } = measureOrder('playorder-unsupported');
    expect(order).toEqual([0, 1]);
    expect(
      layout.diagnostics.some((d) => d.code === 'mnx-unsupported' && /playback follows written order/.test(d.message)),
    ).toBe(true);
  });
});
