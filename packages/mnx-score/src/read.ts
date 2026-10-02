import { noteValueLength, tupletRatio, Rational as R } from '@polyhymnia/mnx';
import type {
  ElementIds,
  ElementPosition,
  Event as MnxEvent,
  Note as MnxNote,
  NoteId,
  NoteValue,
  NoteValueBase,
  Pitch,
  Rational,
  Tie,
} from '@polyhymnia/mnx';
import { pitchToMidi, STEP_LETTERS } from '@polyhymnia/music-theory';
import { asArray, asObject, type Report } from './report.js';
import type { EntryKind, TieFlags, TimelineTuplet } from './types.js';

const SUPPORTED_BASES = new Set<string>(['breve', 'whole', 'half', 'quarter', 'eighth', '16th', '32nd', '64th']);

export interface ReadNote {
  id: NoteId;
  pitch: Pitch;
  midi: number;
  tie: TieFlags;
}

export interface ReadEvent {
  id?: NoteId;
  kind: EntryKind;
  base: NoteValueBase;
  dots: number;
  length: Rational;
  tuplet?: TimelineTuplet;
  restPosition?: number;
  notes: ReadNote[];
}

export interface PendingTie {
  from: ReadNote;
  tie: Tie;
  measureIndex: number;
}

export interface ReadContext {
  ids: ElementIds;
  report: Report;
  ties: PendingTie[];
  notesById: Map<string, ReadNote>;
  noteOrder: Map<ReadNote, { voice: string; order: number }>;
  eventOrder: Map<string, number>;
}

export interface SequenceScope {
  part: number;
  staff: number;
  ordinal: number;
  measureIndex: number;
  sequenceIndex: number;
  inScope: boolean;
  prefix: string;
  eventCount: number;
  tupletCount: number;
}

export function scopePrefix(part: number, staff: number): string {
  return `${part === 0 ? '' : `p${part}.`}${staff === 1 ? '' : `st${staff}.`}`;
}

export function voiceKey(part: number, staff: number, ordinal: number): string {
  return `${part}:${staff}:${ordinal}`;
}

export function createContext(ids: ElementIds, report: Report): ReadContext {
  return { ids, report, ties: [], notesById: new Map(), noteOrder: new Map(), eventOrder: new Map() };
}

function idFor(ctx: ReadContext, scope: SequenceScope, pos: ElementPosition, candidate: string): NoteId | undefined {
  if (!scope.inScope) return undefined;
  const full: ElementPosition = { ...pos, part: scope.part, staff: scope.staff };
  return ctx.ids.idAt(full) ?? ctx.ids.mint(candidate, { measureIndex: scope.measureIndex });
}

function unsupported(ctx: ReadContext, scope: SequenceScope, construct: string, consequence: string): void {
  if (scope.inScope) ctx.report.unsupported(ctx.report.time, construct, scope.measureIndex, consequence);
}

export function readSequence(sequence: Record<string, any>, scope: SequenceScope, ctx: ReadContext): ReadEvent[] {
  const events: ReadEvent[] = [];
  readContent(asArray(sequence.content), scope, undefined, events, ctx, []);
  const full = asObject(sequence.fullMeasure);
  if (full) {
    const id = idFor(
      ctx,
      scope,
      { measureIndex: scope.measureIndex, sequenceIndex: scope.sequenceIndex, path: [], fullMeasureRest: true },
      `${scope.prefix}m${scope.measureIndex}.s${scope.sequenceIndex}.full`,
    );
    events.push({
      ...(id === undefined ? {} : { id }),
      kind: 'fullMeasureRest',
      base: 'whole',
      dots: 0,
      length: R.ONE,
      notes: [],
      ...(typeof full.staffPosition === 'number' ? { restPosition: full.staffPosition } : {}),
    });
  }
  return events;
}

function readContent(
  content: readonly unknown[],
  scope: SequenceScope,
  tuplet: TimelineTuplet | undefined,
  out: ReadEvent[],
  ctx: ReadContext,
  path: readonly number[],
): void {
  content.forEach((raw, localIndex) => {
    const item = asObject(raw);
    if (!item) return;
    const itemPath = [...path, localIndex];
    switch (item.type) {
      case 'tuplet': {
        const ref = readTuplet(item, scope, tuplet, ctx, itemPath);
        readContent(asArray(item.content), scope, ref, out, ctx, itemPath);
        break;
      }
      case 'grace':
        scope.eventCount += asArray(item.content).length;
        unsupported(ctx, scope, 'grace notes', 'not drawn');
        break;
      case 'space': {
        const length = fractionOf(item.duration);
        if (length) out.push({ kind: 'space', base: 'whole', dots: 0, length, notes: [] });
        break;
      }
      case 'tremolo': {
        scope.eventCount += asArray(item.content).length;
        unsupported(ctx, scope, 'multi-note tremolo', 'its time is left blank');
        const length = quantityLength(item.outer);
        if (length) out.push({ kind: 'space', base: 'whole', dots: 0, length: scaled(length, tuplet), notes: [] });
        break;
      }
      case undefined:
      case 'event': {
        const event = readEvent(item as MnxEvent, scope, tuplet, ctx, itemPath);
        if (event) out.push(event);
        break;
      }
      default:
        unsupported(ctx, scope, `sequence content of type ${String(item.type)}`, 'skipped');
    }
  });
}

function readTuplet(
  item: Record<string, any>,
  scope: SequenceScope,
  outer: TimelineTuplet | undefined,
  ctx: ReadContext,
  path: readonly number[],
): TimelineTuplet | undefined {
  const index = scope.tupletCount;
  scope.tupletCount += 1;
  const id =
    idFor(
      ctx,
      scope,
      { measureIndex: scope.measureIndex, sequenceIndex: scope.sequenceIndex, path },
      `${scope.prefix}m${scope.measureIndex}.s${scope.sequenceIndex}.t${index}`,
    ) ?? '';
  const displayFields = {
    ...(item.bracket !== undefined ? { bracket: item.bracket } : {}),
    ...(item.showNumber !== undefined ? { showNumber: item.showNumber } : {}),
    ...(item.placement !== undefined ? { placement: item.placement } : {}),
  };
  const display = Object.keys(displayFields).length > 0 ? { display: displayFields } : {};
  const ratio = quantityLength(item.inner) && quantityLength(item.outer) ? tupletRatio(item as never) : null;
  if (!ratio) {
    unsupported(
      ctx,
      scope,
      'tuplet with an unsupported note value',
      outer ? "its content keeps only the outer tuplet's ratio" : 'its content is laid out untupled',
    );
    return outer;
  }
  if (!outer) return { id, actual: ratio.actual, normal: ratio.normal, ...display };
  unsupported(ctx, scope, 'nested tuplet', 'flattened into one tuplet');
  return { id, actual: ratio.actual * outer.actual, normal: ratio.normal * outer.normal, ...display };
}

function readEvent(
  event: MnxEvent,
  scope: SequenceScope,
  tuplet: TimelineTuplet | undefined,
  ctx: ReadContext,
  path: readonly number[],
): ReadEvent | undefined {
  const { measureIndex, sequenceIndex } = scope;
  const index = scope.eventCount;
  scope.eventCount += 1;
  const id = idFor(
    ctx,
    scope,
    { measureIndex, sequenceIndex, path },
    `${scope.prefix}m${measureIndex}.s${sequenceIndex}.e${index}`,
  );

  const value = readNoteValue(event.duration, scope, ctx);
  if (!value) return undefined;
  const length = scaled(value.length, tuplet);
  const key = voiceKey(scope.part, scope.staff, scope.ordinal);
  const order = ctx.eventOrder.get(key) ?? 0;
  ctx.eventOrder.set(key, order + 1);

  const notes = asArray(event.notes)
    .map((raw) => asObject(raw) as MnxNote | undefined)
    .filter((n): n is MnxNote => n !== undefined);

  const common = {
    ...(id === undefined ? {} : { id }),
    base: value.base,
    dots: value.dots,
    length,
    ...(tuplet ? { tuplet } : {}),
  };

  if (notes.length === 0 && !asObject(event.rest)) {
    if (asArray(event.kitNotes).length > 0) {
      unsupported(ctx, scope, 'percussion kit notes', 'their time is left blank');
    } else {
      unsupported(ctx, scope, 'event without notes or rest', 'its time is left blank');
    }
    return { ...common, kind: 'space', notes: [] };
  }

  if (notes.length === 0) {
    const staffPosition = asObject(event.rest)?.staffPosition;
    return {
      ...common,
      kind: 'rest',
      notes: [],
      ...(typeof staffPosition === 'number' ? { restPosition: staffPosition } : {}),
    };
  }

  const readNotes = notes.map((note, k) => {
    const noteId =
      idFor(ctx, scope, { measureIndex, sequenceIndex, path, note: k }, notes.length === 1 ? `${id}` : `${id}.n${k}`) ??
      '';
    return readNote(note, noteId, scope, ctx);
  });
  if (scope.inScope) for (const n of readNotes) ctx.noteOrder.set(n, { voice: key, order });
  return { ...common, kind: notes.length === 1 ? 'note' : 'chord', notes: readNotes };
}

function readNoteValue(
  value: NoteValue | undefined,
  scope: SequenceScope,
  ctx: ReadContext,
): { base: NoteValueBase; dots: number; length: Rational } | undefined {
  const { measureIndex } = scope;
  const nv = asObject(value) as NoteValue | undefined;
  if (!nv || typeof nv.base !== 'string') {
    if (scope.inScope) {
      ctx.report.content.push({
        severity: 'warning',
        code: 'invalid-duration',
        message: `Measure ${measureIndex} has an event with no readable duration; skipped.`,
        measureIndex,
      });
    }
    return undefined;
  }
  const dots = typeof nv.dots === 'number' && nv.dots > 0 ? Math.floor(nv.dots) : 0;
  const length = SUPPORTED_BASES.has(nv.base) ? noteValueLength({ base: nv.base, dots }) : null;
  if (!length) {
    unsupported(ctx, scope, `${nv.base} note value`, 'the event is skipped');
    return undefined;
  }
  return { base: nv.base, dots, length };
}

function readNote(note: MnxNote, id: NoteId, scope: SequenceScope, ctx: ReadContext): ReadNote {
  const pitch = readPitch(note.pitch, scope, ctx);
  const read: ReadNote = { id, pitch, midi: pitchToMidi(pitch), tie: { start: false, stop: false } };
  if (!scope.inScope) return read;
  if (typeof note.id === 'string') ctx.notesById.set(note.id, read);
  for (const tie of asArray(note.ties)) {
    const t = asObject(tie) as Tie | undefined;
    if (t) ctx.ties.push({ from: read, tie: t, measureIndex: scope.measureIndex });
  }
  return read;
}

function readPitch(value: unknown, scope: SequenceScope, ctx: ReadContext): Pitch {
  const pitch = asObject(value);
  const step = pitch?.step;
  const octave = pitch?.octave;
  if (!(STEP_LETTERS as readonly unknown[]).includes(step) || typeof octave !== 'number' || !Number.isInteger(octave)) {
    if (scope.inScope) {
      ctx.report.content.push({
        severity: 'warning',
        code: 'invalid-pitch',
        message: `Measure ${scope.measureIndex} has a note with an unreadable pitch ${JSON.stringify(value)}; drawn as C4.`,
        measureIndex: scope.measureIndex,
      });
    }
    return { step: 'C', octave: 4 };
  }
  const alter = pitch?.alter;
  return typeof alter === 'number' && alter !== 0
    ? { step: step as Pitch['step'], octave, alter }
    : { step: step as Pitch['step'], octave };
}

export function fractionOf(value: unknown): Rational | undefined {
  const fraction = asArray(value);
  const [n, d] = fraction;
  if (typeof n !== 'number' || typeof d !== 'number' || !Number.isInteger(n) || !Number.isInteger(d)) {
    return undefined;
  }
  if (n < 0 || d <= 0) return undefined;
  return R.of(n, d);
}

function quantityLength(value: unknown): Rational | undefined {
  const quantity = asObject(value);
  const nv = asObject(quantity?.duration) as NoteValue | undefined;
  const multiple = quantity?.multiple;
  if (!nv || typeof multiple !== 'number' || !Number.isInteger(multiple) || multiple <= 0) return undefined;
  const length = noteValueLength(nv);
  return length ? R.multiply(length, R.of(multiple)) : undefined;
}

function scaled(length: Rational, tuplet: TimelineTuplet | undefined): Rational {
  return tuplet ? R.multiply(length, R.of(tuplet.normal, tuplet.actual)) : length;
}

export function voiceLength(events: readonly ReadEvent[]): Rational {
  return events.reduce((sum, e) => (e.kind === 'fullMeasureRest' ? sum : R.add(sum, e.length)), R.ZERO);
}
