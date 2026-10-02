import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Diagnostic, MnxDocument } from '@polyhymnia/mnx';
import { buildTimeline, performance, type Timeline } from '@polyhymnia/mnx-score';
import { layoutScore } from '../src/layout/index.js';
import type { LayoutResult } from '../src/layout/types.js';
import type { TimeMap } from '../src/query/timemap.js';

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url));
const EXAMPLES = fileURLToPath(new URL('../../mnx/schema/examples/', import.meta.url));

function names(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

const cases = [
  ...names(FIXTURES).map((name) => ({ label: `fixture ${name}`, path: `${FIXTURES}${name}.json` })),
  ...names(EXAMPLES).map((name) => ({ label: `example ${name}`, path: `${EXAMPLES}${name}.json` })),
];

const TIMELINE_CODES = [
  'mnx-invalid',
  'mnx-unsupported-version',
  'invalid-divisions',
  'no-parts',
  'no-measures',
  'measure-count-mismatch',
  'missing-sequences',
  'invalid-time-signature',
  'invalid-pitch',
  'invalid-duration',
  'too-many-voices',
  'tie-target-unresolved',
  'tie-target-not-adjacent',
  'measure-underfull',
  'measure-overfull',
  'zero-length-element',
  'id-collision',
];

const TIMELINE_UNSUPPORTED =
  /^Unsupported MNX: (grace notes|multi-note tremolo|percussion kit notes|event without notes or rest|nested tuplet|tuplet with an unsupported note value|sequence content of type .+|\S+ note value|laissez-vibrer tie|tie with targetType .+|invalid tempo bpm|graceIndex in a tempo position|tempo beat unit)( in measure \d+)?; |; playback follows written order\.$/;

function codeCounts(diagnostics: readonly Diagnostic[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of diagnostics) {
    if (TIMELINE_CODES.includes(d.code)) counts[d.code] = (counts[d.code] ?? 0) + 1;
  }
  return counts;
}

function timelineUnsupported(diagnostics: readonly Diagnostic[]): string[] {
  return diagnostics
    .filter((d) => d.code === 'mnx-unsupported' && TIMELINE_UNSUPPORTED.test(d.message))
    .map((d) => d.message)
    .sort();
}

function elementRows(layout: LayoutResult) {
  return Object.values(layout.elements)
    .map((box) => ({
      id: box.id,
      eventId: box.eventId,
      kind: box.kind,
      tick: box.tick,
      durationTicks: box.durationTicks,
      measureIndex: box.measureIndex,
      voice: box.voice,
    }))
    .sort((a, b) => a.tick - b.tick || a.id.localeCompare(b.id));
}

function timelineRows(timeline: Timeline) {
  return timeline.entries
    .filter((e) => e.kind !== 'space')
    .flatMap((e) =>
      (e.notes.length > 0 ? e.notes.map((n) => n.id) : [e.id]).map((id) => ({
        id,
        eventId: e.id,
        kind: e.kind === 'fullMeasureRest' ? 'rest' : e.kind,
        tick: e.tick,
        durationTicks: e.durationTicks,
        measureIndex: e.measureIndex,
        voice: e.voice,
      })),
    )
    .sort((a, b) => a.tick - b.tick || a.id.localeCompare(b.id));
}

function timemapEvents(timemap: TimeMap) {
  const events: { id?: string; midi: number; startSeconds: number; durationSeconds: number }[] = [];
  let offset = 0;
  for (const segment of timemap.playOrder()) {
    const base = timemap.tickToSeconds(segment.fromTick);
    for (const entry of timemap.entries) {
      if (entry.kind === 'rest' || entry.tick < segment.fromTick || entry.tick >= segment.toTick) continue;
      const startSeconds = offset + timemap.tickToSeconds(entry.tick) - base;
      const end = timemap.tickToSeconds(Math.min(entry.tick + entry.durationTicks, segment.toTick));
      const durationSeconds = end - timemap.tickToSeconds(entry.tick);
      const midis = entry.midiNotes ?? (entry.midi === undefined ? [] : [entry.midi]);
      midis.forEach((midi, i) => events.push({ id: entry.ids[i], midi, startSeconds, durationSeconds }));
    }
    offset += timemap.tickToSeconds(segment.toTick) - base;
  }
  events.sort((a, b) => a.startSeconds - b.startSeconds);
  return { events: round(events), durationSeconds: round(offset) };
}

function round<T>(value: T): T {
  if (typeof value === 'number') return (Math.round(value * 1e9) / 1e9) as T;
  if (Array.isArray(value)) return value.map(round) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, round(v)])) as T;
  }
  return value;
}

describe('buildTimeline matches the engine timemap', () => {
  it.each(cases)('$label', ({ label, path }) => {
    const doc = JSON.parse(readFileSync(path, 'utf8')) as MnxDocument;
    const layout = layoutScore(doc);
    const timeline = buildTimeline(doc);
    const tm = layout.timemap;

    expect(timelineRows(timeline)).toEqual(elementRows(layout));
    expect(timeline.measures.map(({ index, startTick, endTick }) => ({ index, startTick, endTick }))).toEqual(
      tm.measures.map(({ index, startTick, endTick }) => ({ index, startTick, endTick })),
    );
    expect(timeline.playOrder).toEqual(tm.playOrder());

    const ticks = [...new Set([...timeline.entries.map((e) => e.tick), ...timeline.measures.map((m) => m.startTick)])];
    for (const tick of ticks) {
      expect([...timeline.activeAt(tick)].sort(), `activeAt ${tick}`).toEqual([...tm.activeAt(tick)].sort());
      expect(round(timeline.writtenTickToSeconds(tick)), `seconds at ${tick}`).toBe(round(tm.tickToSeconds(tick)));
    }

    const played = performance(timeline);
    expect(round({ events: played.events, durationSeconds: played.durationSeconds })).toEqual(timemapEvents(tm));
    for (const s of [0, 0.7, 2.5, played.durationSeconds / 2, played.durationSeconds + 1]) {
      expect(round(played.tickAtSeconds(s)), `tick at ${s}s`).toBe(round(tm.writtenTickAtSeconds(s)));
    }

    expect(codeCounts(timeline.diagnostics)).toEqual(codeCounts(layout.diagnostics));
    expect(timelineUnsupported(timeline.diagnostics)).toEqual(timelineUnsupported(layout.diagnostics));
    expect(
      timeline.diagnostics.filter((d) => d.code === 'mnx-unsupported' && !TIMELINE_UNSUPPORTED.test(d.message)),
      label,
    ).toEqual([]);
  });
});

function quarter(step: string, noteId?: string) {
  return { duration: { base: 'quarter' }, notes: [{ ...(noteId ? { id: noteId } : {}), pitch: { step, octave: 4 } }] };
}

function whole(step: string) {
  return { duration: { base: 'whole' }, notes: [{ pitch: { step, octave: 4 } }] };
}

function doc(parts: unknown[][][]): MnxDocument {
  return {
    mnx: { version: 1 },
    global: { measures: parts[0]!.map((_, i) => (i === 0 ? { time: { count: 4, unit: 4 } } : {})) },
    parts: parts.map((measures) => ({ measures: measures.map((sequences) => ({ sequences })) })),
  } as unknown as MnxDocument;
}

const Q = 3360;

describe('documented differences from the engine', () => {
  it.each([
    {
      name: 'a whole-bar rest no longer rules out a pickup',
      doc: doc([
        [
          [{ content: [quarter('G')] }, { content: [], fullMeasure: {} }],
          [{ content: [whole('C')] }, { content: [], fullMeasure: {} }],
        ],
      ]),
      engine: { firstEnd: 4 * Q, padding: ['m0.v0.pad0'] },
      timeline: { firstEnd: Q, padding: [] },
    },
    {
      name: 'the pickup reads parts outside the scope',
      doc: doc([
        [[{ content: [quarter('G')] }], [{ content: [whole('C')] }]],
        [[{ content: [quarter('E'), quarter('F')] }], [{ content: [whole('D')] }]],
      ]),
      engine: { firstEnd: Q, padding: [] },
      timeline: { firstEnd: 2 * Q, padding: [] },
    },
    {
      name: 'a padding rest is minted against explicit ids outside the scope',
      doc: doc([
        [[{ content: [whole('C')] }], [{ content: [quarter('D')] }]],
        [[{ content: [whole('E')] }], [{ content: [{ ...whole('F'), id: 'm1.v0.pad0' }] }]],
      ]),
      engine: { firstEnd: 4 * Q, padding: ['m1.v0.pad0'] },
      timeline: { firstEnd: 4 * Q, padding: ['m1.v0.pad0~2'] },
    },
  ])('$name', ({ doc, engine, timeline }) => {
    const layout = layoutScore(doc);
    const built = buildTimeline(doc);
    expect({
      firstEnd: layout.timemap.measures[0]!.endTick,
      padding: Object.keys(layout.elements).filter((id) => id.includes('.pad')),
    }).toEqual(engine);
    expect({
      firstEnd: built.measures[0]!.endTick,
      padding: built.entries.filter((e) => e.synthetic).map((e) => e.id),
    }).toEqual(timeline);
  });
});
