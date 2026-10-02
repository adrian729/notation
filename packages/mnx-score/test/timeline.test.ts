import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { MnxDocument } from '@polyhymnia/mnx';
import { buildTimeline, performance, positionTick, type Timeline } from '../src/index.js';

type Json = Record<string, unknown>;

const Q = 3360;

function n(step: string, octave = 4, extra: Json = {}, base = 'quarter'): Json {
  return { duration: { base }, notes: [{ pitch: { step, octave }, ...extra }] };
}

function rest(base = 'quarter'): Json {
  return { duration: { base }, rest: {} };
}

function seq(content: Json[], extra: Json = {}): Json {
  return { content, ...extra };
}

function score(time: [number, number], parts: Json[][][], globals: Json[] = []): MnxDocument {
  const measureCount = parts[0]!.length;
  return {
    mnx: { version: 1 },
    global: {
      measures: Array.from({ length: measureCount }, (_, i) => ({
        ...(i === 0 ? { time: { count: time[0], unit: time[1] } } : {}),
        ...globals[i],
      })),
    },
    parts: parts.map((measures) => ({ measures: measures.map((sequences) => ({ sequences })) })),
  } as unknown as MnxDocument;
}

function example(name: string): MnxDocument {
  return JSON.parse(
    readFileSync(new URL(`../../mnx/schema/examples/${name}.json`, import.meta.url), 'utf8'),
  ) as MnxDocument;
}

function round<T>(value: T): T {
  if (typeof value === 'number') return (Math.round(value * 1e9) / 1e9) as T;
  if (Array.isArray(value)) return value.map(round) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, round(v)])) as T;
  }
  return value;
}

function ids(timeline: Timeline): string[] {
  return timeline.entries.map((e) => e.id);
}

describe('buildTimeline', () => {
  it('reads every part, staff and voice in scope all, keeping default-scope ids and prefixing the rest', () => {
    const doc = score(
      [2, 4],
      [
        [[seq([n('C'), n('D')]), seq([n('E', 3, {}, 'half')], { staff: 2 }), seq([n('G')]), seq([n('A'), n('B')])]],
        [[seq([n('F')])]],
      ],
    );
    const narrow = buildTimeline(doc);
    const all = buildTimeline(doc, { scope: 'all' });

    expect(ids(narrow)).toEqual(['m0.s0.e0', 'm0.s2.e0', 'm0.s0.e1', 'm0.v1.pad0']);
    expect(narrow.diagnostics.map((d) => d.code)).toEqual(['too-many-voices', 'measure-underfull']);
    expect(all.entries.map(({ id, part, staff, voice, synthetic }) => ({ id, part, staff, voice, synthetic }))).toEqual(
      [
        { id: 'm0.s0.e0', part: 0, staff: 1, voice: 0, synthetic: false },
        { id: 'm0.s2.e0', part: 0, staff: 1, voice: 1, synthetic: false },
        { id: 'm0.s3.e0', part: 0, staff: 1, voice: 2, synthetic: false },
        { id: 'st2.m0.s1.e0', part: 0, staff: 2, voice: 0, synthetic: false },
        { id: 'p1.m0.s0.e0', part: 1, staff: 1, voice: 0, synthetic: false },
        { id: 'm0.s0.e1', part: 0, staff: 1, voice: 0, synthetic: false },
        { id: 'm0.v1.pad0', part: 0, staff: 1, voice: 1, synthetic: true },
        { id: 'm0.s3.e1', part: 0, staff: 1, voice: 2, synthetic: false },
        { id: 'p1.m0.v0.pad0', part: 1, staff: 1, voice: 0, synthetic: true },
      ],
    );
    expect(all.ids.has('p1.m0.v0.pad0')).toBe(true);
    expect(narrow.ids.has('p1.m0.s0.e0')).toBe(false);
  });

  it.each(['grand-staff', 'parts', 'organ-layout'])(
    'scope all agrees with the default scope on shared elements (%s)',
    (name) => {
      const doc = example(name);
      const narrow = buildTimeline(doc);
      const all = buildTimeline(doc, { scope: 'all' });
      expect(all.entries.length).toBeGreaterThan(narrow.entries.length);
      expect(all.measures).toEqual(narrow.measures);
      for (const entry of narrow.entries) expect(all.byId(entry.id)).toEqual(entry);
    },
  );

  it.each([
    { name: 'a short first measure', parts: [[[seq([n('G')])], [seq([n('C', 4, {}, 'whole')])]]], capacity: Q },
    {
      name: 'a short voice beside a whole-bar rest',
      parts: [[[seq([n('G')]), seq([], { fullMeasure: {} })], [seq([n('C', 4, {}, 'whole')])]]],
      capacity: Q,
    },
    {
      name: 'a longer part outside the scope',
      parts: [
        [[seq([n('G')])], [seq([n('C', 4, {}, 'whole')])]],
        [[seq([n('E', 4, {}, 'half')])], [seq([rest('whole')])]],
      ],
      capacity: 2 * Q,
    },
    {
      name: 'a full first measure',
      parts: [[[seq([n('C', 4, {}, 'whole')])], [seq([n('C', 4, {}, 'whole')])]]],
      capacity: 4 * Q,
    },
  ])('decides the pickup measure-wide: $name', ({ parts, capacity }) => {
    const timeline = buildTimeline(score([4, 4], parts));
    expect(timeline.measures[0]).toMatchObject({ pickup: capacity < 4 * Q, startTick: 0, endTick: capacity });
    expect(timeline.measures[1]!.startTick).toBe(capacity);
    expect(timeline.diagnostics).toEqual([]);
    expect(timeline.entries.filter((e) => e.measureIndex === 0).every((e) => e.durationTicks <= capacity)).toBe(true);
    expect(timeline.entries.find((e) => e.kind === 'fullMeasureRest')?.durationTicks ?? capacity).toBe(capacity);
  });

  it('mints padding rests after elements, suffixing a collision with an explicit id', () => {
    const doc = score([2, 4], [[[seq([n('C')]), seq([rest('half')])], [seq([n('D'), rest()])]]]);
    const timeline = buildTimeline(doc);
    expect(timeline.entries.filter((e) => e.synthetic).map(({ id, tick, base }) => ({ id, tick, base }))).toEqual([
      { id: 'm0.v0.pad0', tick: Q, base: 'quarter' },
    ]);
    const short = score(
      [2, 4],
      [
        [[seq([n('C', 4, {}, 'half')])], [seq([n('D')])]],
        [[seq([n('E', 4, { id: 'm1.v0.pad0' }, 'half')])], [seq([rest('half')])]],
      ],
    );
    const padded = buildTimeline(short);
    expect(padded.entries.filter((e) => e.synthetic).map((e) => e.id)).toEqual(['m1.v0.pad0~2']);
    expect(padded.diagnostics.map((d) => d.code)).toEqual(['measure-underfull', 'id-collision']);
  });

  it('resolves ties into flags and tie records', () => {
    const doc = score(
      [2, 4],
      [
        [
          [
            seq([
              n('C'),
              { ...n('D'), notes: [{ id: 'a', pitch: { step: 'D', octave: 4 }, ties: [{ target: 'b' }] }] },
            ]),
          ],
          [
            seq([
              {
                duration: { base: 'quarter' },
                notes: [{ id: 'b', pitch: { step: 'D', octave: 4 }, ties: [{ target: 'c', side: 'up' }] }],
              },
              {
                duration: { base: 'quarter' },
                notes: [{ id: 'c', pitch: { step: 'D', octave: 4 }, ties: [{ target: 'zz' }] }],
              },
            ]),
          ],
        ],
      ],
    );
    const timeline = buildTimeline(doc);
    expect(timeline.ties).toEqual([
      { id: 'a.tie', from: 'a', to: 'b' },
      { id: 'b.tie', from: 'b', to: 'c', side: 'up' },
    ]);
    expect(['a', 'b', 'c'].map((id) => timeline.byId(id)!.notes[0]!.tie)).toEqual([
      { start: true, stop: false },
      { start: true, stop: true },
      { start: false, stop: true },
    ]);
    expect(timeline.diagnostics.map((d) => d.code)).toEqual(['tie-target-unresolved']);
  });

  it('orders diagnostics by stage, not by document position', () => {
    const doc = {
      mnx: { version: 1 },
      global: {
        measures: [
          { time: { count: 2, unit: 4 }, tempos: [{ bpm: 90, value: { base: 'longa' } }] },
          { time: { count: 0, unit: 4 } },
        ],
      },
      parts: [
        {
          measures: [
            {
              sequences: [
                seq([
                  { type: 'grace', content: [n('B')] },
                  {
                    duration: { base: 'quarter' },
                    notes: [{ id: 'x', pitch: { step: 'C', octave: 4 }, ties: [{ target: 'nope' }] }],
                  },
                  { id: 'm1.v0.pad0', duration: { base: 'quarter' }, notes: [{ pitch: { step: 'H', octave: 4 } }] },
                ]),
              ],
            },
            { sequences: [seq([n('C')])] },
            { sequences: [] },
          ],
        },
      ],
    } as unknown as MnxDocument;
    const timeline = buildTimeline(doc, { divisions: 0 });
    expect(timeline.diagnostics.map((d) => d.code)).toEqual([
      'invalid-divisions',
      'measure-count-mismatch',
      'invalid-pitch',
      'invalid-time-signature',
      'mnx-unsupported',
      'tie-target-unresolved',
      'measure-underfull',
      'mnx-unsupported',
      'id-collision',
    ]);
    expect(timeline.diagnostics[4]!.message).toMatch(/tempo beat unit/);
    expect(timeline.diagnostics[7]!.message).toMatch(/grace notes/);
  });
});

describe('positionTick', () => {
  const timeline = buildTimeline(
    score([3, 4], [[[seq([n('C', 4, {}, 'half'), n('D')])], [seq([n('E', 4, {}, 'half'), n('F')])]]]),
  );

  it.each([
    ['a fraction inside the measure', 1, { fraction: [1, 4] }, 3 * Q + Q, Q, undefined],
    ['no position', 1, undefined, 3 * Q, 0, undefined],
    ['a malformed fraction', 1, { fraction: [1, 0] }, 3 * Q, 0, 'invalid-position'],
    ['a fraction past the end', 0, { fraction: [5, 4] }, 3 * Q, 3 * Q, 'invalid-position'],
    ['a missing measure', 7, { fraction: [1, 4] }, 0, 0, 'invalid-position'],
  ])('resolves %s, clamping and reporting instead of throwing', (_name, measure, position, tick, measureTick, code) => {
    const result = positionTick(timeline, measure, position);
    expect({ tick: result.tick, measureTick: result.measureTick }).toEqual({ tick, measureTick });
    expect(result.diagnostic?.code).toBe(code);
  });
});

describe('performance', () => {
  const doc = score(
    [2, 4],
    [
      [
        [
          seq([
            n('C'),
            {
              duration: { base: 'quarter' },
              notes: [{ id: 'd1', pitch: { step: 'D', octave: 4 }, ties: [{ target: 'd2' }] }],
            },
          ]),
        ],
        [seq([{ duration: { base: 'quarter' }, notes: [{ id: 'd2', pitch: { step: 'D', octave: 4 } }] }, n('E')])],
      ],
    ],
    [{ repeatStart: {} }, { repeatEnd: {} }],
  );

  it.each([
    { tempo: undefined, beat: 0.5 },
    { tempo: { bpm: 60 }, beat: 1 },
  ])('merges ties and unrolls repeats at $beat s per beat', ({ tempo, beat }) => {
    const played = performance(buildTimeline(doc), tempo ? { tempo } : {});
    const pass = [
      { id: 'm0.s0.e0', midi: 60, startSeconds: 0, durationSeconds: beat },
      { id: 'd1', midi: 62, startSeconds: beat, durationSeconds: 2 * beat },
      { id: 'm1.s0.e1', midi: 64, startSeconds: 3 * beat, durationSeconds: beat },
    ];
    expect(round(played.events)).toEqual([
      ...pass,
      ...pass.map((e) => ({ ...e, startSeconds: e.startSeconds + 4 * beat })),
    ]);
    expect(round(played.durationSeconds)).toBe(8 * beat);
    expect(round(played.tickAtSeconds(4.5 * beat))).toBe(Q / 2);
  });
});
