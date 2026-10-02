import { elementIds, noteValueLength, readMnx, Rational as R } from '@polyhymnia/mnx';
import type {
  Diagnostic,
  ElementIds,
  ElementScope,
  MnxDocument,
  NoteId,
  NoteValue,
  NoteValueBase,
  Rational,
  Tie,
} from '@polyhymnia/mnx';
import { resolvePlayOrder, type MeasureFlow, type MeasureFlows } from './playorder.js';
import {
  createContext,
  fractionOf,
  readSequence,
  scopePrefix,
  voiceLength,
  type ReadContext,
  type ReadEvent,
  type ReadNote,
} from './read.js';
import { asArray, asObject, createReport, ordered, type Report } from './report.js';
import { tempoClock, type TempoEvent } from './tempo.js';
import type {
  BeatUnit,
  TimeSignature,
  Timeline,
  TimelineEntry,
  TimelineMeasure,
  TimelineOptions,
  TimelineScope,
  TimelineTie,
} from './types.js';

export const DEFAULT_DIVISIONS = 3360;

const DEFAULT_TIME: TimeSignature = { beats: 4, beatType: 4 };
const DEFAULT_MAX_VOICES = 2;
const SUPPORTED_BASES = new Set<string>(['breve', 'whole', 'half', 'quarter', 'eighth', '16th', '32nd', '64th']);

interface ResolvedScope {
  element: ElementScope;
  parts: readonly number[];
  includes(part: number, staff: number, ordinal: number): boolean;
  maxVoices: number;
  staves: readonly number[] | 'all';
}

interface Voice {
  part: number;
  staff: number;
  ordinal: number;
  inScope: boolean;
  events: readonly ReadEvent[];
}

interface MeasureRead {
  index: number;
  time: TimeSignature;
  voices: readonly Voice[];
  pickup: boolean;
  capacity: Rational;
}

export function buildTimeline(doc: MnxDocument, options: TimelineOptions = {}): Timeline {
  const report = createReport();
  const divisions = resolveDivisions(options.divisions, report.head);
  const read = readMnx(doc);
  report.head.push(...read.diagnostics);
  const source = read.doc ?? (read.diagnostics.some((d) => d.code === 'mnx-unsupported-version') ? doc : null);
  if (!source) return assemble([], [], [], [], divisions, report, frozen(elementIds({} as MnxDocument)), new Set());

  const scope = resolveScope(source, options.scope);
  const ids = elementIds(source, scope.element);
  const ctx = createContext(ids, report);
  const docParts = asArray(source.parts);
  const scopedParts = scope.parts.filter((p) => asObject(docParts[p]) !== undefined);
  if (scopedParts.length === 0) {
    report.structure.push({
      severity: 'warning',
      code: 'no-parts',
      message: 'Document has no parts; nothing to lay out.',
    });
    ids.freeze();
    return assemble([], [], [], [], divisions, report, ids, new Set());
  }

  const globals = asArray(asObject(source.global)?.measures);
  if (globals.length === 0) {
    report.structure.push({
      severity: 'warning',
      code: 'no-measures',
      message: 'Document has no global measures; nothing to lay out.',
    });
  }
  for (const p of scopedParts) {
    const count = asArray(asObject(docParts[p])?.measures).length;
    if (count !== globals.length) {
      report.structure.push({
        severity: 'warning',
        code: 'measure-count-mismatch',
        message: `Part${p === 0 ? '' : ` ${p}`} has ${count} measures but global has ${globals.length}; laying out ${globals.length}.`,
      });
    }
  }

  const measures = readMeasures(source, globals, docParts, scope, ctx);
  const known = new Set<NoteId>();
  const { entries, timelineMeasures } = walkMeasures(measures, divisions, ids, report, known);
  const ties = resolveTies(ctx);
  ids.freeze();

  const tempoEvents = resolveTempo(globals, measures, divisions, report);
  const playOrder = resolvePlayOrder(resolveFlow(globals, divisions), timelineMeasures);
  report.playOrder.push(...playOrder.diagnostics);

  return assemble(entries, ties, timelineMeasures, tempoEvents, divisions, report, ids, known, playOrder.segments);
}

function frozen(ids: ElementIds): ElementIds {
  ids.freeze();
  return ids;
}

function resolveDivisions(value: unknown, diagnostics: Diagnostic[]): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (value !== undefined) {
    diagnostics.push({
      severity: 'warning',
      code: 'invalid-divisions',
      message: `Invalid divisions ${JSON.stringify(value)}; using ${DEFAULT_DIVISIONS}.`,
    });
  }
  return DEFAULT_DIVISIONS;
}

function resolveScope(source: MnxDocument, scope: TimelineScope | undefined): ResolvedScope {
  if (scope === 'all') {
    const docParts = asArray(source.parts);
    const parts = docParts.map((_, i) => i);
    const staves = new Set<number>([1]);
    for (const part of docParts) {
      for (const measure of asArray(asObject(part)?.measures)) {
        for (const sequence of asArray(asObject(measure)?.sequences)) {
          const staff = asObject(sequence)?.staff;
          if (typeof staff === 'number') staves.add(staff);
        }
      }
    }
    return {
      element: { parts, staves: [...staves].sort((a, b) => a - b), maxVoices: Number.POSITIVE_INFINITY },
      parts,
      staves: 'all',
      maxVoices: Number.POSITIVE_INFINITY,
      includes: () => true,
    };
  }
  const parts = scope?.parts ?? [0];
  const staves = scope?.staves ?? [1];
  const maxVoices = scope?.maxVoices ?? DEFAULT_MAX_VOICES;
  return {
    element: scope ?? {},
    parts: [...new Set(parts)].sort((a, b) => a - b),
    staves,
    maxVoices,
    includes: (part, staff, ordinal) => parts.includes(part) && staves.includes(staff) && ordinal < maxVoices,
  };
}

function resolveTime(value: unknown, fallback: TimeSignature, measureIndex: number, report: Report): TimeSignature {
  const time = asObject(value);
  const count = time?.count;
  const unit = time?.unit;
  const valid =
    typeof count === 'number' &&
    Number.isInteger(count) &&
    count > 0 &&
    typeof unit === 'number' &&
    Number.isInteger(unit) &&
    unit > 0;
  if (!valid) {
    report.content.push({
      severity: 'warning',
      code: 'invalid-time-signature',
      message: `Invalid time signature ${JSON.stringify(value)}; inheriting ${fallback.beats}/${fallback.beatType}.`,
      measureIndex,
    });
    return fallback;
  }
  const display = time?.display;
  return display === 'common' || display === 'cut'
    ? { beats: count, beatType: unit, symbol: display }
    : { beats: count, beatType: unit };
}

function readMeasures(
  source: MnxDocument,
  globals: readonly unknown[],
  docParts: readonly unknown[],
  scope: ResolvedScope,
  ctx: ReadContext,
): MeasureRead[] {
  let currentTime = DEFAULT_TIME;
  return globals.map((raw, index) => {
    const g = asObject(raw) ?? {};
    if (g.time !== undefined) currentTime = resolveTime(g.time, currentTime, index, ctx.report);
    const voices: Voice[] = [];
    docParts.forEach((rawPart, part) => {
      const partObject = asObject(rawPart);
      if (!partObject) return;
      const partInScope = scope.parts.includes(part);
      const partMeasures = asArray(partObject.measures);
      const pm = asObject(partMeasures[index]) ?? {};
      if (partInScope && partMeasures[index] !== undefined && !Array.isArray(pm.sequences)) {
        ctx.report.structure.push({
          severity: 'warning',
          code: 'missing-sequences',
          message: `Measure ${index} has no sequences array; treated as empty.`,
          measureIndex: index,
        });
      }
      const counts = new Map<number, number>();
      const kept: { sequence: Record<string, any>; sequenceIndex: number; staff: number; ordinal: number }[] = [];
      asArray(pm.sequences).forEach((rawSequence, sequenceIndex) => {
        const sequence = asObject(rawSequence);
        if (!sequence) return;
        const staff = typeof sequence.staff === 'number' ? sequence.staff : 1;
        const ordinal = counts.get(staff) ?? 0;
        counts.set(staff, ordinal + 1);
        kept.push({ sequence, sequenceIndex, staff, ordinal });
      });
      for (const [staff, count] of counts) {
        const staffInScope = scope.staves === 'all' || scope.staves.includes(staff);
        if (!partInScope || !staffInScope || count <= scope.maxVoices) continue;
        const where = part === 0 && staff === 1 ? '' : ` (part ${part}, staff ${staff})`;
        ctx.report.content.push({
          severity: 'warning',
          code: 'too-many-voices',
          message: `Measure ${index}${where} has ${count} sequences; only ${scope.maxVoices} are supported, the rest were dropped.`,
          measureIndex: index,
        });
      }
      for (const { sequence, sequenceIndex, staff, ordinal } of kept) {
        const inScope = scope.includes(part, staff, ordinal);
        const events = readSequence(
          sequence,
          {
            part,
            staff,
            ordinal,
            measureIndex: index,
            sequenceIndex,
            inScope,
            prefix: scopePrefix(part, staff),
            eventCount: 0,
            tupletCount: 0,
          },
          ctx,
        );
        voices.push({ part, staff, ordinal, inScope, events });
      }
    });
    const meter = R.of(currentTime.beats, currentTime.beatType);
    const longest = voices.reduce((max, v) => R.max(max, voiceLength(v.events)), R.ZERO);
    const pickup = index === 0 && R.compare(longest, R.ZERO) > 0 && R.compare(longest, meter) < 0;
    return { index, time: currentTime, voices, pickup, capacity: pickup ? longest : meter };
  });
}

function walkMeasures(
  measures: readonly MeasureRead[],
  divisions: number,
  ids: ElementIds,
  report: Report,
  known: Set<NoteId>,
): { entries: TimelineEntry[]; timelineMeasures: TimelineMeasure[] } {
  const entries: TimelineEntry[] = [];
  const timelineMeasures: TimelineMeasure[] = [];
  let measureStart = R.ZERO;
  for (const measure of measures) {
    const startTick = R.toTicks(measureStart, divisions);
    for (const voice of measure.voices) {
      if (voice.inScope) walkVoice(measure, voice, measureStart, divisions, ids, report, entries, known);
    }
    timelineMeasures.push({
      index: measure.index,
      startTick,
      endTick: startTick + R.toTicks(measure.capacity, divisions),
      time: measure.time,
      pickup: measure.pickup,
      capacity: measure.capacity,
    });
    measureStart = R.add(measureStart, measure.capacity);
  }
  entries.sort((a, b) => a.tick - b.tick || a.part - b.part || a.staff - b.staff || a.voice - b.voice);
  return { entries, timelineMeasures };
}

function walkVoice(
  measure: MeasureRead,
  voice: Voice,
  measureStart: Rational,
  divisions: number,
  ids: ElementIds,
  report: Report,
  out: TimelineEntry[],
  known: Set<NoteId>,
): void {
  const { capacity, index: measureIndex, pickup } = measure;
  const { part, staff, ordinal } = voice;
  const wholeBarLength = wholeBarShare(voice.events, capacity);
  const ticks = (value: Rational): number => R.toTicks(value, divisions);
  let onset = R.ZERO;
  let truncated = false;
  let eventIndex = 0;

  const push = (ev: Omit<TimelineEntry, 'part' | 'staff' | 'voice' | 'eventIndex' | 'measureIndex'>): void => {
    out.push({ ...ev, part, staff, voice: ordinal, eventIndex, measureIndex });
    eventIndex += 1;
    known.add(ev.id);
    for (const n of ev.notes) known.add(n.id);
    if (ev.tuplet) known.add(ev.tuplet.id);
  };

  for (const ev of voice.events) {
    const length = ev.kind === 'fullMeasureRest' ? wholeBarLength : ev.length;
    if (R.compare(length, R.ZERO) <= 0) {
      report.fullness.push({
        severity: 'warning',
        code: 'zero-length-element',
        message: `Measure ${measureIndex} voice ${ordinal} has an element with no duration; skipped.`,
        measureIndex,
        voice: ordinal,
        tick: ticks(R.add(measureStart, onset)),
      });
      continue;
    }
    if (!pickup && R.compare(onset, capacity) >= 0) {
      truncated = true;
      continue;
    }
    let effective = length;
    if (!pickup && R.compare(R.add(onset, length), capacity) > 0) {
      effective = R.subtract(capacity, onset);
      truncated = true;
    }
    if (ev.id !== undefined) {
      push({
        id: ev.id,
        kind: ev.kind,
        tick: ticks(R.add(measureStart, onset)),
        measureTick: ticks(onset),
        duration: effective,
        durationTicks: ticks(effective),
        base: ev.base,
        dots: ev.dots,
        ...(ev.tuplet ? { tuplet: ev.tuplet } : {}),
        wholeBar: ev.kind === 'fullMeasureRest',
        synthetic: false,
        ...(ev.restPosition !== undefined ? { restPosition: ev.restPosition } : {}),
        notes: ev.notes,
      });
    }
    onset = R.add(onset, length);
  }

  if (truncated) {
    report.fullness.push({
      severity: 'error',
      code: 'measure-overfull',
      message:
        `Measure ${measureIndex} voice ${ordinal} overflows its ` +
        `${measure.time.beats}/${measure.time.beatType} capacity; truncated at the barline.`,
      measureIndex,
      voice: ordinal,
      tick: ticks(R.add(measureStart, capacity)),
    });
    return;
  }

  if (pickup || R.compare(onset, capacity) >= 0) return;
  const padding = decomposeLength(R.subtract(capacity, onset));
  if (padding.length === 0) return;
  report.fullness.push({
    severity: 'warning',
    code: 'measure-underfull',
    message:
      `Measure ${measureIndex} voice ${ordinal} does not fill its ` +
      `${measure.time.beats}/${measure.time.beatType} capacity; padded with ` +
      `${padding.length} rest(s).`,
    measureIndex,
    voice: ordinal,
    tick: ticks(R.add(measureStart, onset)),
  });
  const prefix = scopePrefix(part, staff);
  padding.forEach((value, k) => {
    const length = noteValueLength(value)!;
    const tick = ticks(R.add(measureStart, onset));
    const id = ids.mint(`${prefix}m${measureIndex}.v${ordinal}.pad${k}`, { measureIndex, voice: ordinal, tick });
    push({
      id,
      kind: 'rest',
      tick,
      measureTick: ticks(onset),
      duration: length,
      durationTicks: ticks(length),
      base: value.base,
      dots: value.dots,
      wholeBar: false,
      synthetic: true,
      notes: [],
    });
    onset = R.add(onset, length);
  });
}

function wholeBarShare(events: readonly ReadEvent[], capacity: Rational): Rational {
  let others = R.ZERO;
  let wholeBarCount = 0;
  for (const ev of events) {
    if (ev.kind === 'fullMeasureRest') wholeBarCount += 1;
    else others = R.add(others, ev.length);
  }
  const remainder = R.max(R.ZERO, R.subtract(capacity, others));
  return R.divide(remainder, R.of(Math.max(1, wholeBarCount)));
}

const PAD_BASES: readonly NoteValueBase[] = ['breve', 'whole', 'half', 'quarter', 'eighth', '16th', '32nd', '64th'];

const PAD_CANDIDATES: readonly { value: BeatUnit; length: Rational }[] = PAD_BASES.flatMap((base) =>
  [0, 1, 2].map((dots) => ({ value: { base, dots }, length: noteValueLength({ base, dots })! })),
).sort((a, b) => R.compare(b.length, a.length));

const SHORTEST = PAD_CANDIDATES[PAD_CANDIDATES.length - 1]!.length;

function decomposeLength(length: Rational): BeatUnit[] {
  const out: BeatUnit[] = [];
  let remaining = length;
  for (let guard = 0; guard < 64; guard += 1) {
    if (R.compare(remaining, SHORTEST) < 0) break;
    const pick = PAD_CANDIDATES.find((c) => R.compare(c.length, remaining) <= 0);
    if (!pick) break;
    out.push({ ...pick.value });
    remaining = R.subtract(remaining, pick.length);
    if (R.isZero(remaining)) break;
  }
  return out;
}

function resolveTies(ctx: ReadContext): TimelineTie[] {
  const { report } = ctx;
  const resolved: TimelineTie[] = [];
  for (const { from, tie, measureIndex } of ctx.ties) {
    if (tie.lv === true) {
      report.unsupported(report.ties, 'laissez-vibrer tie', measureIndex, 'not drawn');
      continue;
    }
    if (tie.targetType !== undefined && tie.targetType !== 'nextNote') {
      report.unsupported(report.ties, `tie with targetType ${tie.targetType}`, measureIndex, 'not drawn');
      continue;
    }
    const target = typeof tie.target === 'string' ? ctx.notesById.get(tie.target) : undefined;
    if (!target) {
      report.ties.push({
        severity: 'warning',
        code: 'tie-target-unresolved',
        message: `Measure ${measureIndex}: tie from note ${from.id} targets ${JSON.stringify(tie.target)}, which is not a laid-out note id; ignored.`,
        measureIndex,
      });
      continue;
    }
    from.tie.start = true;
    target.tie.stop = true;
    const side = sideOf(tie);
    resolved.push({ id: `${from.id}.tie`, from: from.id, to: target.id, ...(side ? { side } : {}) });
    if (!adjacent(ctx, from, target)) {
      report.ties.push({
        severity: 'warning',
        code: 'tie-target-not-adjacent',
        message: `Measure ${measureIndex}: tie from note ${from.id} targets ${target.id}, which is not the next event in the voice; drawn anyway.`,
        measureIndex,
      });
    }
  }
  return resolved;
}

function sideOf(tie: Tie): 'up' | 'down' | undefined {
  return tie.side === 'up' || tie.side === 'down' ? tie.side : undefined;
}

function adjacent(ctx: ReadContext, from: ReadNote, target: ReadNote): boolean {
  const a = ctx.noteOrder.get(from);
  const b = ctx.noteOrder.get(target);
  return a !== undefined && b !== undefined && a.voice === b.voice && b.order === a.order + 1;
}

function resolveTempo(
  globals: readonly unknown[],
  measures: readonly MeasureRead[],
  divisions: number,
  report: Report,
): TempoEvent[] {
  const tempo: TempoEvent[] = [];
  let start = R.ZERO;
  globals.forEach((raw, index) => {
    for (const entry of asArray(asObject(raw)?.tempos)) {
      const t = asObject(entry);
      if (!t) continue;
      if (typeof t.bpm !== 'number' || !(t.bpm > 0)) {
        report.unsupported(report.tempo, 'invalid tempo bpm', index, 'entry ignored');
        continue;
      }
      if (asObject(t.location)?.graceIndex !== undefined) {
        report.unsupported(report.tempo, 'graceIndex in a tempo position', index, 'grace positioning ignored');
      }
      const offset = fractionOf(asObject(t.location)?.fraction) ?? R.ZERO;
      const value = asObject(t.value) as NoteValue | undefined;
      const dots = typeof value?.dots === 'number' ? value.dots : 0;
      let beatUnit: BeatUnit | undefined;
      if (value && SUPPORTED_BASES.has(value.base) && dots <= 2) {
        beatUnit = { base: value.base, dots };
      } else {
        report.unsupported(report.tempo, 'tempo beat unit', index, 'a quarter-note beat is used');
      }
      tempo.push({
        tick: R.toTicks(R.add(start, offset), divisions),
        bpm: t.bpm,
        ...(beatUnit ? { beatUnit } : {}),
      });
    }
    const measure = measures[index];
    if (measure) start = R.add(start, measure.capacity);
  });
  return tempo;
}

function resolveFlow(globals: readonly unknown[], divisions: number): MeasureFlows {
  return globals.map((raw) => {
    const g = asObject(raw) ?? {};
    const flow: { -readonly [K in keyof MeasureFlow]: MeasureFlow[K] } = { repeatStart: g.repeatStart !== undefined };
    const offsetOf = (value: unknown): number | undefined => {
      const fraction = fractionOf(asObject(asObject(value)?.location)?.fraction);
      return fraction === undefined ? undefined : R.toTicks(fraction, divisions);
    };
    if (g.repeatEnd !== undefined) {
      const times = asObject(g.repeatEnd)?.times;
      flow.repeatEnd = typeof times === 'number' && Number.isInteger(times) && times >= 2 ? times : 2;
    }
    const ending = asObject(g.ending);
    if (ending) {
      const numbers = asArray(ending.numbers).filter((n): n is number => typeof n === 'number');
      if (numbers.length > 0 && typeof ending.duration === 'number') {
        flow.ending = { numbers, duration: ending.duration };
      }
    }
    const segno = offsetOf(g.segno);
    if (segno !== undefined) flow.segno = segno;
    const fine = offsetOf(g.fine);
    if (fine !== undefined) flow.fine = fine;
    const jump = asObject(g.jump);
    if (jump) {
      const offset = offsetOf(jump);
      if ((jump.type === 'segno' || jump.type === 'dsalfine') && offset !== undefined) {
        flow.jump = { type: jump.type, offset };
      } else {
        flow.invalid = 'jump';
      }
    }
    return flow;
  });
}

function assemble(
  entries: readonly TimelineEntry[],
  ties: readonly TimelineTie[],
  measures: readonly TimelineMeasure[],
  tempoEvents: readonly TempoEvent[],
  divisions: number,
  report: Report,
  ids: ElementIds,
  known: ReadonlySet<NoteId>,
  playOrder: Timeline['playOrder'] = [],
): Timeline {
  const clock = tempoClock(tempoEvents, divisions);
  const byIdMap = new Map<NoteId, TimelineEntry>();
  const sounding = entries.filter((e) => e.kind !== 'space');
  for (const entry of entries) {
    if (!byIdMap.has(entry.id)) byIdMap.set(entry.id, entry);
    for (const n of entry.notes) if (!byIdMap.has(n.id)) byIdMap.set(n.id, entry);
  }
  return {
    divisions,
    entries,
    ties,
    measures,
    tempo: clock.segments,
    playOrder,
    diagnostics: [...ordered(report), ...ids.diagnostics],
    ids: {
      idAt: (pos) => ids.idAt(pos),
      nodeOf: (id) => ids.nodeOf(id),
      has: (id) => known.has(id) || ids.nodeOf(id) !== undefined,
      fork: () => ids.fork(),
    },
    activeAt(tick) {
      const active: NoteId[] = [];
      for (const entry of sounding) {
        if (tick >= entry.tick && tick < entry.tick + entry.durationTicks) {
          if (entry.notes.length > 0) active.push(...entry.notes.map((n) => n.id));
          else active.push(entry.id);
        }
      }
      return active;
    },
    byId: (id) => byIdMap.get(id),
    writtenTickToSeconds: clock.tickToSeconds,
    secondsToWrittenTick: clock.secondsToTick,
  };
}
