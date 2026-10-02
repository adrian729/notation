import { readMnx } from '@polyhymnia/mnx';
import type {
  Diagnostic,
  ElementIds,
  ElementPosition,
  Event as MnxEvent,
  MeasureGlobal,
  MnxDocument,
  Note as MnxNote,
  PartMeasure,
  Pitch,
  Sequence,
  Slur,
} from '@polyhymnia/mnx';
import { positionTick, type Timeline, type TimelineEntry, type TimelineNote } from '@polyhymnia/mnx-score';
import { stepNumberOf } from '@polyhymnia/music-theory';
import type { NotationOptions } from '../options.js';
import {
  DEFAULT_TIME,
  type AccidentalPolicy,
  type Alter,
  type ClefChange,
  type ClefSpec,
  type KeySpec,
  type NormalizedMeasure,
  type NormalizedScore,
  type NoteId,
  type StaffPitch,
  type StepNumber,
  type TimeSpec,
} from './records.js';
import {
  asArray,
  asObject,
  createReader,
  sequenceKey,
  staffMeasureKey,
  type Reader,
  type SlurNote,
} from './normalize-reader.js';
import {
  barlineEndOf,
  reportGlobalConstructs,
  reportPartConstructs,
  resolveClef,
  resolveKey,
} from './normalize-measure.js';
import { resolveBeams } from './normalize-beams.js';
import { clefEquals, lastClef } from './staff.js';
import { declaredStaves, laidOutStaves, timelineFor } from './timeline.js';

const DEFAULT_CLEF: ClefSpec = { kind: 'treble' };
const DEFAULT_KEY: KeySpec = { fifths: 0 };
const HANDLED_MARKINGS = new Set(['breath', 'caesura', '_c', '_x', 'id']);

interface SequenceScope {
  measureIndex: number;
  sequenceIndex: number;
  staff: number;
}

export function normalize(
  doc: MnxDocument,
  options?: NotationOptions,
  timeline: Timeline = timelineFor(doc, options?.divisions),
  beamIds: ElementIds = timeline.ids.fork(),
): NormalizedScore {
  const diagnostics: Diagnostic[] = [];
  const laidOut = new Map<NoteId, TimelineEntry>();
  for (const entry of timeline.entries) {
    if (!entry.synthetic && !laidOut.has(entry.id)) laidOut.set(entry.id, entry);
  }
  const reader = createReader(timeline.ids, laidOut, diagnostics);
  const empty = (): NormalizedScore => ({
    id: 'score',
    divisions: timeline.divisions,
    timeline,
    staves: [],
    events: reader.events,
    notes: reader.notes,
    beams: [],
    ties: [],
    slurs: [],
    diagnostics,
  });

  const read = readMnx(doc);
  const source = read.doc ?? (read.diagnostics.some((d) => d.code === 'mnx-unsupported-version') ? doc : null);
  if (!source) return empty();

  const parts = asArray(source.parts);
  const part = asObject(parts[0]);
  if (!part) return { ...empty(), id: idOf(source) };
  if (parts.length > 1) {
    reader.unsupported(`${parts.length} parts`, undefined, 'only the first part is laid out');
  }
  const declared = declaredStaves(source);
  const staffCount = laidOutStaves(source);
  if (declared > staffCount) {
    reader.unsupported(`a part with ${declared} staves`, undefined, `only staves 1-${staffCount} are laid out`);
  }
  reportDocumentConstructs(source, part, reader);
  if (part.kit) reader.unsupported('percussion kit', undefined, 'kit notes are not laid out');
  if (part.transposition) {
    reader.unsupported('part transposition', undefined, 'sounding pitches are laid out');
  }

  const globals = asArray(asObject(source.global)?.measures);
  const partMeasures = asArray(part.measures);
  const staffIndices = Array.from({ length: staffCount }, (_, i) => i);

  const elementTicks = elementTicksByMeasure(timeline);
  const currentClefs: ClefSpec[] = staffIndices.map(() => DEFAULT_CLEF);
  const firstClefs: (ClefSpec | undefined)[] = staffIndices.map(() => undefined);
  let currentKey = DEFAULT_KEY;
  let firstKey: KeySpec | undefined;
  let firstTime: TimeSpec | undefined;
  const measuresByStaff: NormalizedMeasure[][] = staffIndices.map(() => []);

  globals.forEach((raw, index) => {
    const g = (asObject(raw) ?? {}) as MeasureGlobal;
    const pm = (asObject(partMeasures[index]) ?? {}) as Partial<PartMeasure>;
    const timed = timeline.measures[index];
    const time: TimeSpec = timed?.time ?? DEFAULT_TIME;

    if (g.key !== undefined) currentKey = resolveKey(g.key, currentKey, index, reader);

    const clefs = readClefs(asArray(pm.clefs), index, currentClefs, elementTicks, timeline, reader, declared);
    clefs.forEach((c, s) => {
      currentClefs[s] = c.carried;
      firstClefs[s] ??= c.start;
    });

    reportGlobalConstructs(g, index, reader);
    reportPartConstructs(pm, index, reader);
    readSequences(asArray(pm.sequences), index, reader, staffCount, declared);

    firstKey ??= currentKey;
    firstTime ??= time;

    const shared = {
      key: currentKey,
      time,
      pickup: timed?.pickup ?? false,
      capacityTicks: timed ? timed.endTick - timed.startTick : 0,
      ...(g.repeatStart ? { barlineStart: 'repeat-start' as const } : {}),
      ...barlineEndOf(g, index, reader),
    };
    clefs.forEach((c, s) => {
      measuresByStaff[s]!.push({
        index,
        clef: c.start,
        clefChanges: c.changes,
        ...shared,
        systemBreak: false,
      } satisfies NormalizedMeasure);
    });
  });

  measuresByStaff.forEach((measures, s) => assignTrailingClefs(measures, currentClefs[s]!));
  resolveSlurs(reader);
  applySystemBreaks(source, globals, measuresByStaff, reader);
  const beams = resolveBeams(source, partMeasures, measuresByStaff[0]!, staffCount, timeline, beamIds, reader, options);

  return {
    id: idOf(source),
    divisions: timeline.divisions,
    timeline,
    staves: measuresByStaff.map((measures, s) => ({
      index: s,
      clef: firstClefs[s] ?? DEFAULT_CLEF,
      key: firstKey ?? DEFAULT_KEY,
      time: firstTime ?? DEFAULT_TIME,
      measures,
    })),
    events: reader.events,
    notes: reader.notes,
    beams,
    ties: timeline.ties.map((tie) => ({ ...tie, measureIndex: timeline.ids.nodeOf(tie.from)?.measureIndex ?? 0 })),
    slurs: reader.resolvedSlurs,
    diagnostics,
  };
}

interface MeasureClefs {
  start: ClefSpec;
  changes: ClefChange[];
  carried: ClefSpec;
}

function elementTicksByMeasure(timeline: Timeline): Map<string, number[]> {
  const byMeasure = new Map<string, number[]>();
  for (const entry of timeline.entries) {
    if (entry.kind === 'space') continue;
    const key = staffMeasureKey(entry.staff - 1, entry.measureIndex);
    const ticks = byMeasure.get(key) ?? [];
    ticks.push(entry.measureTick);
    byMeasure.set(key, ticks);
  }
  for (const ticks of byMeasure.values()) ticks.sort((a, b) => a - b);
  return byMeasure;
}

function readClefs(
  entries: readonly unknown[],
  measureIndex: number,
  previous: readonly ClefSpec[],
  elementTicks: ReadonlyMap<string, readonly number[]>,
  timeline: Timeline,
  reader: Reader,
  declared: number,
): MeasureClefs[] {
  const starts = [...previous];
  const positioned: ClefChange[][] = previous.map(() => []);
  for (const raw of entries) {
    const entry = asObject(raw);
    if (!entry) continue;
    const staff = typeof entry.staff === 'number' ? entry.staff : 1;
    const staffIndex = staff - 1;
    if (staffIndex < 0 || staffIndex >= previous.length) {
      if (staff > declared || staff < 1) reader.unsupported(`clef on staff ${staff}`, measureIndex, 'ignored');
      continue;
    }
    if (asObject(entry.position)?.graceIndex !== undefined) {
      reader.unsupported('graceIndex in a clef position', measureIndex, 'grace positioning ignored');
    }
    const clef = resolveClef(entry.clef, measureIndex, reader);
    if (!clef) continue;
    const tick = entry.position === undefined ? 0 : clefTick(timeline, measureIndex, entry.position, reader);
    if (tick === null) continue;
    if (tick === 0) starts[staffIndex] = clef;
    else positioned[staffIndex]!.push({ tick, clef });
  }
  return positioned.map((changes, staffIndex) =>
    anchorClefChanges(starts[staffIndex]!, changes, elementTicks.get(staffMeasureKey(staffIndex, measureIndex)) ?? []),
  );
}

function anchorClefChanges(start: ClefSpec, positioned: ClefChange[], elementTicks: readonly number[]): MeasureClefs {
  positioned.sort((a, b) => a.tick - b.tick);
  const byAnchor = new Map<number, ClefChange>();
  let deferred: ClefSpec | undefined;
  for (const change of positioned) {
    const anchor = elementTicks.find((tick) => tick >= change.tick);
    if (anchor === undefined) deferred = change.clef;
    else byAnchor.set(anchor, change);
  }
  const changes: ClefChange[] = [];
  let inForce = start;
  for (const change of byAnchor.values()) {
    if (clefEquals(change.clef, inForce)) continue;
    changes.push(change);
    inForce = change.clef;
  }
  return { start, changes, carried: deferred ?? inForce };
}

function clefTick(timeline: Timeline, measureIndex: number, position: unknown, reader: Reader): number | null {
  const { measureTick, diagnostic } = positionTick(timeline, measureIndex, position);
  if (!diagnostic) return measureTick;
  reader.diagnostics.push(diagnostic);
  return measureTick === 0 ? null : measureTick;
}

function assignTrailingClefs(measures: NormalizedMeasure[], finalClef: ClefSpec): void {
  measures.forEach((measure, i) => {
    const next = measures[i + 1]?.clef ?? finalClef;
    if (!clefEquals(next, lastClef(measure))) measure.trailingClef = next;
  });
}

function idOf(source: MnxDocument): string {
  return typeof source.id === 'string' ? source.id : 'score';
}

function readSequences(
  sequences: readonly unknown[],
  measureIndex: number,
  reader: Reader,
  staffCount: number,
  declared: number,
): void {
  const kept: { sequence: Partial<Sequence>; index: number; staffIndex: number }[] = [];
  sequences.forEach((raw, index) => {
    const sequence = asObject(raw) as Partial<Sequence> | undefined;
    if (!sequence) return;
    const staff = typeof sequence.staff === 'number' ? sequence.staff : 1;
    if (staff < 1 || staff > staffCount) {
      if (staff > declared || staff < 1) reader.unsupported(`sequence on staff ${staff}`, measureIndex, 'not laid out');
      return;
    }
    kept.push({ sequence, index, staffIndex: staff - 1 });
  });

  for (let staffIndex = 0; staffIndex < staffCount; staffIndex += 1) {
    const voices: (0 | 1)[] = [];
    kept
      .filter((k) => k.staffIndex === staffIndex)
      .slice(0, 2)
      .forEach(({ sequence, index }, i) => {
        const voice = (i === 1 ? 1 : 0) as 0 | 1;
        voices.push(voice);
        reader.voiceOfSequence.set(sequenceKey(measureIndex, index), { staffIndex, voice });
        readContent(
          asArray(sequence.content),
          { measureIndex, sequenceIndex: index, staff: staffIndex + 1 },
          reader,
          [],
        );
        const full = asObject(sequence.fullMeasure);
        if (full) {
          if (full.fermata) reader.unsupported('fermata', measureIndex, 'not drawn');
          if (full.visualDuration !== undefined) {
            reader.unsupported('full-measure rest visualDuration', measureIndex, 'drawn as a whole-bar rest');
          }
        }
      });
    reader.voicesByMeasure.set(staffMeasureKey(staffIndex, measureIndex), voices);
  }
}

function readContent(content: readonly unknown[], scope: SequenceScope, reader: Reader, path: readonly number[]): void {
  content.forEach((raw, localIndex) => {
    const item = asObject(raw);
    if (!item) return;
    const itemPath = [...path, localIndex];
    switch (item.type) {
      case 'tuplet':
        if (typeof item.staff === 'number' && item.staff !== scope.staff) {
          reader.unsupported('cross-staff tuplet', scope.measureIndex, `laid out on staff ${scope.staff}`);
        }
        if (item.showValue !== undefined) {
          reader.unsupported('tuplet showValue', scope.measureIndex, 'only the actual count is drawn');
        }
        readContent(asArray(item.content), scope, reader, itemPath);
        break;
      case undefined:
      case 'event':
        readEvent(item as MnxEvent, { ...scope, path: itemPath }, reader);
        break;
    }
  });
}

function readEvent(event: MnxEvent, pos: ElementPosition & { staff: number }, reader: Reader): void {
  const { measureIndex, staff } = pos;
  const id = reader.ids.idAt(pos);
  const entry = id === undefined ? undefined : reader.laidOut.get(id);
  if (id === undefined || !entry) return;

  if (entry.dots > 2) reader.unsupported(`${entry.dots} dots`, measureIndex, 'two dots are drawn');
  reportEventConstructs(event, measureIndex, staff, reader);
  if (entry.notes.length === 0) return;

  const mnxNotes = asArray(event.notes)
    .map((raw) => asObject(raw) as MnxNote | undefined)
    .filter((n): n is MnxNote => n !== undefined);
  const notes = entry.notes.map((note, k) =>
    readNote(mnxNotes[k] ?? ({} as MnxNote), note, measureIndex, staff, reader),
  );
  reader.eventsById.set(id, notes);
  asArray(event.slurs).forEach((raw, k) => {
    const slur = asObject(raw) as Slur | undefined;
    if (slur) reader.slurs.push({ fromEventId: id, fromNotes: notes, slur, k, measureIndex });
  });
  const stem = event.stemDirection === 'up' || event.stemDirection === 'down' ? event.stemDirection : undefined;
  const breath = breathOf(event, measureIndex, reader);
  reader.events.set(id, { ...(stem ? { stem } : {}), ...(breath ? { breath } : {}) });
}

function reportEventConstructs(event: MnxEvent, measureIndex: number, staff: number, reader: Reader): void {
  if (event.fermata) reader.unsupported('fermata', measureIndex, 'not drawn');
  if (event.lyrics) reader.unsupported('lyrics', measureIndex, 'not drawn');
  if (typeof event.staff === 'number' && event.staff !== staff) {
    reader.unsupported('cross-staff event', measureIndex, `laid out on staff ${staff}`);
  }
  const markings = asObject(event.markings);
  if (!markings) return;
  for (const name of Object.keys(markings)) {
    if (HANDLED_MARKINGS.has(name)) continue;
    reader.unsupported(`${name} marking`, measureIndex, 'not drawn');
  }
}

function breathOf(event: MnxEvent, measureIndex: number, reader: Reader): 'comma' | 'caesura' | undefined {
  const markings = asObject(event.markings);
  const breath = asObject(markings?.breath);
  const caesura = asObject(markings?.caesura);
  if (caesura) {
    if ((caesura.shape !== undefined && caesura.shape !== 'normal') || (caesura.marks ?? 1) !== 1) {
      reader.unsupported('caesura variant', measureIndex, 'drawn as a plain caesura');
    }
    if (breath) reader.unsupported('breath mark with a caesura', measureIndex, 'only the caesura is drawn');
    return 'caesura';
  }
  if (!breath) return undefined;
  if (breath.placement !== undefined)
    reader.unsupported('breath mark placement', measureIndex, 'drawn at the default position');
  if (breath.symbol !== undefined && breath.symbol !== 'comma' && breath.symbol !== 'auto') {
    reader.unsupported(`${String(breath.symbol)} breath mark`, measureIndex, 'drawn as a comma');
  }
  return 'comma';
}

function readNote(note: MnxNote, timed: TimelineNote, measureIndex: number, staff: number, reader: Reader): SlurNote {
  const pitch = staffPitch(timed.pitch, measureIndex, reader);
  const policy = accidentalPolicyOf(note, measureIndex, reader);
  if (typeof note.staff === 'number' && note.staff !== staff) {
    reader.unsupported('cross-staff note', measureIndex, `laid out on staff ${staff}`);
  }
  if (note.written) reader.unsupported('note.written', measureIndex, 'sounding pitch is drawn instead');
  if (note.perform) reader.unsupported('note.perform', measureIndex, 'ignored');
  if (typeof note.id === 'string') reader.explicitNotes.add(note.id);
  reader.notes.set(timed.id, { pitch, ...(policy ? { accidentalPolicy: policy } : {}) });
  return { id: timed.id, pitch };
}

function staffPitch(pitch: Pitch, measureIndex: number, reader: Reader): StaffPitch {
  const raw = pitch.alter ?? 0;
  const alter = Math.max(-2, Math.min(2, Math.round(raw))) as Alter;
  if (alter !== raw) {
    reader.unsupported(`alter ${raw}`, measureIndex, `drawn with alter ${alter}`);
  }
  return { step: stepNumberOf(pitch.step) as StepNumber, alter, octave: pitch.octave };
}

function accidentalPolicyOf(note: MnxNote, measureIndex: number, reader: Reader): AccidentalPolicy | undefined {
  const display = asObject(note.accidentalDisplay);
  if (!display) return undefined;
  if (display.force !== undefined) reader.unsupported('accidental display force', measureIndex, 'ignored');
  if (display.show === false) return 'never';
  if (display.show !== true) return undefined;
  const symbol = asObject(display.enclosure)?.symbol;
  if (symbol === undefined) return 'always';
  if (symbol !== 'parentheses') {
    reader.unsupported(`${String(symbol)} accidental enclosure`, measureIndex, 'treated as cautionary');
  }
  return 'cautionary';
}

function reportDocumentConstructs(source: MnxDocument, part: Record<string, unknown>, reader: Reader): void {
  const root = source as unknown as Record<string, unknown>;
  const support = asObject(asObject(root.mnx)?.support);
  if (support?.useAccidentalDisplay === false) {
    reader.unsupported(
      'mnx.support.useAccidentalDisplay false',
      undefined,
      'accidental display settings are applied regardless',
    );
  }
  if (asArray(root.layouts).length > 0) {
    reader.unsupported('layouts', undefined, 'staff-group layouts are ignored');
  }
  if (asObject(root.global)?.lyrics !== undefined) {
    reader.unsupported('global lyrics', undefined, 'not drawn');
  }
  if (part.name !== undefined || part.shortName !== undefined) {
    reader.unsupported('part name', undefined, 'not drawn');
  }
  for (const raw of asArray(root.scores)) {
    const score = asObject(raw);
    if (!score) continue;
    if (score.name !== undefined) reader.unsupported('score name', undefined, 'not drawn');
    if (score.useWritten === true) {
      reader.unsupported('score.useWritten', undefined, 'sounding pitches are drawn');
    }
    if (score.layout !== undefined) reader.unsupported('score layout', undefined, 'ignored');
    for (const page of asArray(score.pages)) {
      const pageObject = asObject(page);
      if (pageObject?.layout !== undefined) reader.unsupported('page layout', undefined, 'ignored');
      for (const system of asArray(pageObject?.systems)) {
        const systemObject = asObject(system);
        if (systemObject?.layout !== undefined || systemObject?.layoutChanges !== undefined) {
          reader.unsupported('system layout', undefined, 'ignored');
        }
      }
    }
  }
}

function resolveSlurs(reader: Reader): void {
  for (const { fromEventId, fromNotes, slur, k, measureIndex } of reader.slurs) {
    if (slur.lineType !== undefined && slur.lineType !== 'solid') {
      reader.unsupported(`${slur.lineType} slur line`, measureIndex, 'drawn solid');
    }
    const side = slur.side === 'up' || slur.side === 'down' ? slur.side : undefined;
    if (slur.sideEnd !== undefined && slur.sideEnd !== 'auto' && slur.sideEnd !== slur.side) {
      reader.unsupported('slur sideEnd differing from side', measureIndex, 'the start side is used');
    }

    const toNotes = typeof slur.target === 'string' ? reader.eventsById.get(slur.target) : undefined;
    if (!toNotes || toNotes.length === 0) {
      slurUnresolved(reader, measureIndex, fromEventId, 'target', slur.target);
      continue;
    }

    const startNote = resolveSlurNote(reader, slur.startNote, measureIndex, fromEventId, 'startNote');
    const endNote = resolveSlurNote(reader, slur.endNote, measureIndex, fromEventId, 'endNote');
    if (startNote === null || endNote === null) continue;

    reader.resolvedSlurs.push({
      id: typeof slur.id === 'string' ? slur.id : `${fromEventId}.slur${k}`,
      from: startNote ?? pickAnchor(fromNotes, side),
      to: endNote ?? pickAnchor(toNotes, side),
      ...(startNote ? { startNote } : {}),
      ...(endNote ? { endNote } : {}),
      ...(!side && startNote === undefined ? bottomOf('fromBottom', fromNotes) : {}),
      ...(!side && endNote === undefined ? bottomOf('toBottom', toNotes) : {}),
      ...(side ? { side } : {}),
      measureIndex,
    });
  }
}

function resolveSlurNote(
  reader: Reader,
  raw: unknown,
  measureIndex: number,
  fromEventId: NoteId,
  kind: string,
): NoteId | null | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw === 'string' && reader.explicitNotes.has(raw)) return raw;
  slurUnresolved(reader, measureIndex, fromEventId, kind, raw);
  return null;
}

function slurUnresolved(reader: Reader, measureIndex: number, fromEventId: NoteId, kind: string, value: unknown): void {
  reader.diagnostics.push({
    severity: 'warning',
    code: 'slur-target-unresolved',
    message: `Measure ${measureIndex}: slur from event ${fromEventId} has an unresolved ${kind} ${JSON.stringify(value)}; not drawn.`,
    measureIndex,
  });
}

function bottomOf<K extends 'fromBottom' | 'toBottom'>(key: K, notes: readonly SlurNote[]): { [P in K]?: NoteId } {
  if (notes.length <= 1) return {};
  const lowest = notes.reduce((a, b) => (pitchIndex(b.pitch) < pitchIndex(a.pitch) ? b : a));
  return { [key]: lowest.id } as { [P in K]?: NoteId };
}

function pickAnchor(notes: readonly SlurNote[], side: 'up' | 'down' | undefined): NoteId {
  if (notes.length === 1) return notes[0]!.id;
  const sorted = [...notes].sort((a, b) => pitchIndex(b.pitch) - pitchIndex(a.pitch));
  return (side === 'down' ? sorted[sorted.length - 1]! : sorted[0]!).id;
}

function pitchIndex(p: StaffPitch): number {
  return p.step + 7 * p.octave;
}

function applySystemBreaks(
  source: MnxDocument,
  globals: readonly unknown[],
  measuresByStaff: readonly NormalizedMeasure[][],
  reader: Reader,
): void {
  const { diagnostics } = reader;
  const scores = asArray(source.scores);
  if (scores.length > 1) {
    reader.unsupported(`${scores.length} scores`, undefined, "only the first score's layout is used");
  }
  const score = asObject(scores[0]);
  if (!score) return;
  if (asArray(score.multimeasureRests).length > 0) {
    reader.unsupported('multimeasure rests', undefined, 'each measure is drawn on its own');
  }
  const indexById = new Map<string, number>();
  globals.forEach((g, i) => {
    const id = asObject(g)?.id;
    if (typeof id === 'string') indexById.set(id, i);
  });
  const systems = asArray(score.pages).flatMap((page) => asArray(asObject(page)?.systems));
  for (const raw of systems) {
    const measureId = asObject(raw)?.measure;
    const index = typeof measureId === 'string' ? indexById.get(measureId) : undefined;
    if (index === undefined) {
      diagnostics.push({
        severity: 'warning',
        code: 'system-measure-unresolved',
        message: `System starts at measure ${JSON.stringify(measureId)}, which is not a global measure id; ignored.`,
      });
      continue;
    }
    for (const measures of measuresByStaff) {
      const previous = measures[index - 1];
      if (previous) previous.systemBreak = true;
    }
  }
}
