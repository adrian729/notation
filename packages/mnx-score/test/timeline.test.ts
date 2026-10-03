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
      'id-collision',
    ]);
    expect(timeline.diagnostics[4]!.message).toMatch(/tempo beat unit/);
    expect(timeline.entries.find((e) => e.kind === 'grace')).toMatchObject({
      id: 'm0.s0.e0',
      tick: 0,
      durationTicks: 0,
      graceIndex: 1,
      slash: true,
    });
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

  it('scales length by staccato, and loudness by dynamics, hairpin ramps and accents', () => {
    const marked = (step: string, markings: Json = {}, base = 'quarter'): Json => ({
      ...n(step, 4, {}, base),
      markings,
    });
    const doc = score(
      [4, 4],
      [
        [
          [
            seq([
              n('C'),
              marked('D', { staccato: {} }),
              marked('E', { accent: {} }),
              marked('F', { staccatissimo: {} }),
            ]),
          ],
          [seq([n('G'), n('A'), n('B'), n('C', 5)])],
          [seq([marked('D', { strongAccent: {} }, 'half'), marked('E', { tenuto: {} }, 'half')])],
        ],
      ],
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    );
    const measures = doc.parts[0]!.measures as unknown as Json[];
    measures[0]!.dynamics = [{ type: 'immediate', value: 'p', position: { fraction: [0, 1] } }];
    measures[1]!.dynamics = [
      {
        type: 'gradual',
        wedgeType: 'increasing',
        position: { fraction: [0, 1] },
        end: { measure: 'c', position: { fraction: [0, 1] } },
      },
    ];
    measures[2]!.dynamics = [
      { type: 'immediate', value: 'f', position: { fraction: [0, 1] } },
      { type: 'accent', value: 'f', residualValue: 'mf', position: { fraction: [1, 2] } },
    ];
    const p = 0.25 * 3.2 ** 0.5;
    const f = 0.8 * 1.25 ** (1 / 3);
    const ramp = (k: number): number => p + ((f - p) * k) / 4;
    const played = performance(buildTimeline(doc)).events.map(({ durationSeconds, velocity }) => ({
      durationSeconds,
      velocity,
    }));
    expect(round(played)).toEqual(
      round([
        { durationSeconds: 0.5, velocity: p },
        { durationSeconds: 0.25, velocity: p },
        { durationSeconds: 0.5, velocity: p + 0.1 },
        { durationSeconds: 0.125, velocity: p },
        ...[0, 1, 2, 3].map((k) => ({ durationSeconds: 0.5, velocity: ramp(k) })),
        { durationSeconds: 1, velocity: Math.min(1, f + 0.15) },
        { durationSeconds: 1, velocity: f },
      ]),
    );
  });
});

describe('grace playback', () => {
  it.each([
    ['stealFollowing', 0.5, 0.56, 1, 2],
    ['stealPrevious', 0.44, 0.5, 1, 2],
    ['makeTime', 0.5, 0.56, 1.06, 2.06],
  ] as const)(
    'performs %s while keeping the cursor in written time',
    (graceType, graceStart, mainStart, laterStart, total) => {
      const doc = score(
        [4, 4],
        [
          [
            [
              seq([
                n('C'),
                { type: 'grace', graceType, content: [n('D', 4, {}, 'eighth')] },
                n('E'),
                n('F', 4, {}, 'half'),
              ]),
            ],
          ],
        ],
      );
      const timeline = buildTimeline(doc);
      expect(timeline.entries.map((e) => [e.tick, e.durationTicks])).toEqual([
        [0, Q],
        [Q, 0],
        [Q, Q],
        [2 * Q, 2 * Q],
      ]);
      expect(timeline.diagnostics).toEqual([]);
      const result = performance(timeline, { tempo: { bpm: 120 } });
      const starts = new Map(result.events.map((e) => [e.midi, e.startSeconds]));
      expect(starts.get(62)).toBeCloseTo(graceStart);
      expect(starts.get(64)).toBeCloseTo(mainStart);
      expect(starts.get(65)).toBeCloseTo(laterStart);
      expect(result.durationSeconds).toBeCloseTo(total);
      const grace = result.events.find((e) => e.midi === 62)!;
      expect(grace.durationSeconds).toBeCloseTo(0.06);
      const donor = result.events.find((e) => e.midi === (graceType === 'stealPrevious' ? 60 : 64))!;
      expect(donor.durationSeconds).toBeCloseTo(graceType === 'makeTime' ? 0.5 : 0.44);
      expect(result.tickAtSeconds(laterStart)).toBeCloseTo(2 * Q);
      if (graceType === 'makeTime') expect(result.tickAtSeconds(0.53)).toBe(Q);
    },
  );

  it('preserves a tie across grace notes and shares a bounded grace window', () => {
    const doc = score(
      [4, 4],
      [
        [
          [
            seq([
              n('C', 4, { id: 'start', ties: [{ target: 'end' }] }),
              { type: 'grace', content: [n('D', 4, {}, '16th'), n('E', 4, {}, '16th')] },
              n('C', 4, { id: 'end' }),
              n('F', 4, {}, 'half'),
            ]),
          ],
        ],
      ],
    );
    const result = performance(buildTimeline(doc), { tempo: { bpm: 120 } });
    expect(result.events.filter((e) => e.midi === 60)).toHaveLength(1);
    expect(result.events.find((e) => e.midi === 60)?.durationSeconds).toBe(1);
    expect(result.events.filter((e) => e.midi === 62 || e.midi === 64).map((e) => e.durationSeconds)).toEqual([
      0.06, 0.06,
    ]);
    expect(result.events.every((e) => e.durationSeconds >= 0)).toBe(true);
  });
});

describe('fermata playback', () => {
  it('holds notes, rests and whole-bar rests, with an inverse cursor clock across repeats and tempo changes', () => {
    const doc = score(
      [4, 4],
      [
        [
          [
            seq([
              { ...n('C'), fermata: {}, markings: { staccato: {} } },
              { ...rest(), fermata: { duration: 'short' } },
              n('D', 4, {}, 'half'),
            ]),
          ],
          [seq([], { fullMeasure: { fermata: { duration: 'long' } } })],
          [seq([n('E', 4, {}, 'whole')])],
        ],
      ],
      [
        { repeatStart: {} },
        { tempos: [{ bpm: 60, beat: { base: 'quarter' }, position: { fraction: [0, 1] } }] },
        { fermata: {}, repeatEnd: {} },
      ],
    );
    const timeline = buildTimeline(doc);
    const played = performance(timeline);
    expect(timeline.entries[0]!.fermata).toBe('auto');
    expect(played.events[0]!.durationSeconds).toBeCloseTo(1);
    expect(played.events[1]!.startSeconds).toBeCloseTo(1.75);
    expect(played.events[2]!.startSeconds).toBeCloseTo(14.75);
    expect(played.events[2]!.durationSeconds).toBeCloseTo(5);
    expect(played.durationSeconds).toBeCloseTo(39.5);
    expect(played.tickAtSeconds(0.5)).toBeCloseTo(Q / 2);
    expect(played.tickAtSeconds(8.75)).toBeCloseTo(6 * Q);
    expect(played.tickAtSeconds(20.25)).toBeCloseTo(Q / 2);
    expect(performance(timeline, { tempo: { bpm: 120 } }).durationSeconds).toBeCloseTo(22.5);
  });

  it('uses the longest simultaneous hold across voices and keeps inserted grace time synchronized', () => {
    const doc = score(
      [2, 4],
      [
        [
          [
            seq([
              { type: 'grace', graceType: 'makeTime', content: [{ ...n('D', 4, {}, 'eighth'), fermata: {} }] },
              { ...n('C'), fermata: { duration: 'short' } },
              n('E'),
            ]),
            seq([{ ...n('G'), fermata: { duration: 'long' } }, n('A')]),
          ],
        ],
      ],
    );
    const played = performance(buildTimeline(doc), { tempo: { bpm: 120 } });
    const first = played.events.filter((e) => e.midi === 60 || e.midi === 67);
    expect(first.map((e) => round(e.durationSeconds))).toEqual([1.5, 1.5]);
    expect(first.map((e) => round(e.startSeconds))).toEqual([0.12, 0.12]);
    expect(played.events.filter((e) => e.midi === 64 || e.midi === 69).map((e) => round(e.startSeconds))).toEqual([
      1.62, 1.62,
    ]);
    expect(played.tickAtSeconds(0.03)).toBe(0);
    expect(played.tickAtSeconds(0.87)).toBeCloseTo(Q / 2);
    expect(played.durationSeconds).toBeCloseTo(2.12);
  });

  it('keeps an explicit none fermata neutral and sustains a tie through a fermata on its ending note', () => {
    const doc = score(
      [4, 4],
      [
        [
          [
            seq([
              { ...n('C'), fermata: { duration: 'none' }, markings: { staccato: {} } },
              n('D', 4, { id: 'start', ties: [{ target: 'end' }] }),
              { ...n('D', 4, { id: 'end' }), fermata: { duration: 'veryLong' } },
              n('E'),
            ]),
          ],
        ],
      ],
    );
    const played = performance(buildTimeline(doc));
    expect(played.events.map((e) => round(e.durationSeconds))).toEqual([0.25, 2.5, 0.5]);
    expect(played.events.map((e) => round(e.startSeconds))).toEqual([0, 0.5, 3]);
    expect(played.durationSeconds).toBeCloseTo(3.5);
  });
});
