import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { MnxDocument } from '@polyhymnia/notation-model';
import { layoutScore } from '../src/layout/index.js';
import { fixture } from './mnx.js';

function example(name: string): MnxDocument {
  return JSON.parse(
    readFileSync(new URL(`../../notation-model/schema/examples/${name}.json`, import.meta.url), 'utf8'),
  ) as MnxDocument;
}

function measureOrder(name: string, doc: MnxDocument = fixture(name)) {
  const layout = layoutScore(doc);
  const tm = layout.timemap;
  const order = tm.playOrder().flatMap((segment) =>
    tm.measures
      .filter((m) => m.startTick >= segment.fromTick && m.endTick <= segment.toTick)
      .map((m) => m.index),
  );
  return { layout, tm, order };
}

describe('play order', () => {
  it('unrolls a plain repeat and maps played ticks back to written ticks', () => {
    const { tm, order } = measureOrder('playorder-repeat');
    expect(order).toEqual([0, 1, 0, 1, 2]);
    const length = tm.measures[0]!.endTick;
    expect(tm.writtenTickAt(2 * length + 5)).toBe(5);
    expect(tm.writtenTickAt(4 * length)).toBe(2 * length);
  });

  it('picks voltas by pass', () => {
    expect(measureOrder('playorder-voltas').order).toEqual([0, 1, 0, 2, 3]);
  });

  it('plays every pass of endings that outnumber the repeat count', () => {
    expect(measureOrder('', example('repeats-alternate-endings-simple')).order).toEqual([0, 1, 0, 2, 0, 3]);
    expect(measureOrder('', example('repeats-alternate-endings-advanced')).order).toEqual([0, 1, 2, 0, 1, 2, 0, 3, 4, 5]);
  });

  it('plays dal segno al fine up to the fine', () => {
    const { tm, order } = measureOrder('playorder-dsalfine');
    expect(order).toEqual([0, 1, 2, 3, 1, 2]);
    const length = tm.measures[0]!.endTick;
    const seconds = tm.tickToSeconds(length);
    expect(tm.writtenTickAtSeconds(4 * seconds + seconds / 2)).toBeCloseTo(length + length / 2);
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
    expect(layout.diagnostics.some((d) => d.code === 'mnx-unsupported' && /playback follows written order/.test(d.message))).toBe(true);
  });
});
