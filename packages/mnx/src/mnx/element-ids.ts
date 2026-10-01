import type { Diagnostic } from './read.js';
import type { Event, FullMeasureRest, MnxDocument, Note, Tuplet } from './types.js';

export type NoteId = string;

export interface ElementPosition {
  part?: number;
  staff?: number;
  measureIndex: number;
  sequenceIndex: number;
  path: readonly number[];
  note?: number;
  fullMeasureRest?: boolean;
}

export type ElementNode =
  | { kind: 'event'; node: Event }
  | { kind: 'chordNote'; node: Note }
  | { kind: 'tuplet'; node: Tuplet }
  | { kind: 'fullMeasureRest'; node: FullMeasureRest };

export type ElementNodeKind = ElementNode['kind'];

export interface ElementIdEntry {
  part: number;
  staff: number;
  measureIndex: number;
  sequenceIndex: number;
  path: readonly number[];
  note?: number;
  element: ElementNode;
}

export interface ElementScope {
  parts?: readonly number[];
  staves?: readonly number[];
  maxVoices?: number;
}

export interface MintContext {
  measureIndex: number;
  voice?: number;
  tick?: number;
}

export interface ElementIds {
  idAt(pos: ElementPosition): NoteId | undefined;
  nodeOf(id: NoteId): ElementIdEntry | undefined;
  mint(candidate: string, ctx?: MintContext): NoteId;
  registerExplicit(id: string, ctx?: MintContext): boolean;
  freeze(): void;
  fork(): ElementIds;
  readonly diagnostics: readonly Diagnostic[];
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown): Record<string, any> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;
}

export function collectExplicitIds(source: unknown): Set<string> {
  const ids = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    const obj = asObject(value);
    if (!obj) return;
    if (typeof obj.id === 'string') ids.add(obj.id);
    for (const key of Object.keys(obj)) visit(obj[key]);
  };
  visit(source);
  return ids;
}

interface Scope {
  part: number;
  staff: number;
  prefix: string;
  measureIndex: number;
  sequenceIndex: number;
  eventCount: number;
  tupletCount: number;
}

function scopePrefix(part: number, staff: number): string {
  return `${part === 0 ? '' : `p${part}.`}${staff === 1 ? '' : `st${staff}.`}`;
}

function positionKey(pos: ElementPosition): string {
  const parts: string[] = [
    `${scopePrefix(pos.part ?? 0, pos.staff ?? 1)}${pos.measureIndex}`,
    String(pos.sequenceIndex),
    `[${pos.path.join(',')}]`,
  ];
  if (pos.fullMeasureRest) parts.push('full');
  if (pos.note !== undefined) parts.push(`n${pos.note}`);
  return parts.join('.');
}

export interface IdSet {
  has(id: string): boolean;
  add(id: string): void;
}

export function mintId(existing: IdSet, candidate: string): NoteId {
  if (!existing.has(candidate)) {
    existing.add(candidate);
    return candidate;
  }
  let n = 2;
  let id = `${candidate}~${n}`;
  while (existing.has(id)) {
    n += 1;
    id = `${candidate}~${n}`;
  }
  existing.add(id);
  return id;
}

const DEFAULT_PARTS: readonly number[] = [0];
const DEFAULT_STAVES: readonly number[] = [1];
const DEFAULT_MAX_VOICES = 2;

interface IdState {
  explicitIds: ReadonlySet<string>;
  usedIds: Set<string>;
  idByPosition: ReadonlyMap<string, NoteId>;
  nodeById: ReadonlyMap<NoteId, ElementIdEntry>;
}

type Report = (diagnostic: Diagnostic) => void;

function contextFields(ctx: MintContext | undefined): Pick<Diagnostic, 'measureIndex' | 'voice' | 'tick'> {
  if (!ctx) return {};
  return {
    measureIndex: ctx.measureIndex,
    ...(ctx.voice === undefined ? {} : { voice: ctx.voice }),
    ...(ctx.tick === undefined ? {} : { tick: ctx.tick }),
  };
}

function reserveExplicit(usedIds: Set<string>, id: string, ctx: MintContext | undefined, report: Report): boolean {
  if (usedIds.has(id)) {
    report({
      severity: 'warning',
      code: 'id-collision',
      message: `Duplicate id ${JSON.stringify(id)} appears on more than one laid-out element; only the first is addressable.`,
      ...contextFields(ctx),
    });
    return false;
  }
  usedIds.add(id);
  return true;
}

function synthesize(state: IdState, candidate: string, ctx: MintContext | undefined, report: Report): NoteId {
  const taken: IdSet = {
    has: (id) => state.explicitIds.has(id) || state.usedIds.has(id),
    add: (id) => state.usedIds.add(id),
  };
  const collided = taken.has(candidate);
  const id = mintId(taken, candidate);
  if (collided) {
    report({
      severity: 'warning',
      code: 'id-collision',
      message: `Synthesized id ${JSON.stringify(candidate)} collides with an existing id; using ${JSON.stringify(id)} instead.`,
      ...contextFields(ctx),
    });
  }
  return id;
}

function createElementIds(state: IdState, diagnostics: Diagnostic[]): ElementIds {
  let frozen = false;
  const report: Report = (d) => diagnostics.push(d);
  const assertOpen = (): void => {
    if (frozen) throw new Error('ElementIds is frozen; mint into fork() instead.');
  };
  return {
    idAt: (pos) => state.idByPosition.get(positionKey(pos)),
    nodeOf: (id) => state.nodeById.get(id),
    mint: (candidate, ctx) => {
      assertOpen();
      return synthesize(state, candidate, ctx, report);
    },
    registerExplicit: (id, ctx) => {
      assertOpen();
      return reserveExplicit(state.usedIds, id, ctx, report);
    },
    freeze: () => {
      frozen = true;
    },
    fork: () => createElementIds({ ...state, usedIds: new Set(state.usedIds) }, []),
    diagnostics,
  };
}

interface KeptSequence {
  sequence: Record<string, any>;
  index: number;
  staff: number;
  kept: number;
}

export function elementIds(doc: MnxDocument, scope: ElementScope = {}): ElementIds {
  const parts = scope.parts ?? DEFAULT_PARTS;
  const staves = scope.staves ?? DEFAULT_STAVES;
  const maxVoices = scope.maxVoices ?? DEFAULT_MAX_VOICES;
  const diagnostics: Diagnostic[] = [];
  const idByPosition = new Map<string, NoteId>();
  const nodeById = new Map<NoteId, ElementIdEntry>();
  const state: IdState = { explicitIds: collectExplicitIds(doc), usedIds: new Set(), idByPosition, nodeById };
  let addressable = true;
  const report: Report = (d) => {
    if (addressable) diagnostics.push(d);
  };

  const inDefault = (part: number, staff: number, kept: number): boolean =>
    part === 0 && staff === 1 && kept < DEFAULT_MAX_VOICES;
  const inRequested = (part: number, staff: number, kept: number): boolean =>
    parts.includes(part) && staves.includes(staff) && kept < maxVoices;

  function resolve(explicit: unknown, candidate: string, measureIndex: number): NoteId {
    if (typeof explicit === 'string') {
      reserveExplicit(state.usedIds, explicit, { measureIndex }, report);
      return explicit;
    }
    return synthesize(state, candidate, { measureIndex }, report);
  }

  function register(element: ElementNode, pos: ElementPosition, scope: Scope, id: NoteId): void {
    if (!addressable) return;
    const full: ElementPosition = { ...pos, part: scope.part, staff: scope.staff };
    idByPosition.set(positionKey(full), id);
    if (!nodeById.has(id)) {
      const { measureIndex, sequenceIndex, path, note } = pos;
      nodeById.set(id, { part: scope.part, staff: scope.staff, measureIndex, sequenceIndex, path, note, element });
    }
  }

  function walkContent(content: readonly unknown[], scope: Scope, path: readonly number[]): void {
    content.forEach((raw, localIndex) => {
      const item = asObject(raw);
      if (!item) return;
      const itemPath = [...path, localIndex];
      const base = `${scope.prefix}m${scope.measureIndex}.s${scope.sequenceIndex}`;
      switch (item.type) {
        case 'tuplet': {
          const index = scope.tupletCount;
          scope.tupletCount += 1;
          const id = resolve(item.id, `${base}.t${index}`, scope.measureIndex);
          register(
            { kind: 'tuplet', node: item as unknown as Tuplet },
            { measureIndex: scope.measureIndex, sequenceIndex: scope.sequenceIndex, path: itemPath },
            scope,
            id,
          );
          walkContent(asArray(item.content), scope, itemPath);
          break;
        }
        case 'grace':
          scope.eventCount += asArray(item.content).length;
          break;
        case 'tremolo':
          scope.eventCount += asArray(item.content).length;
          break;
        case 'space':
          break;
        case undefined:
        case 'event': {
          const index = scope.eventCount;
          scope.eventCount += 1;
          const id = resolve(item.id, `${base}.e${index}`, scope.measureIndex);
          const pos: ElementPosition = {
            measureIndex: scope.measureIndex,
            sequenceIndex: scope.sequenceIndex,
            path: itemPath,
          };
          register({ kind: 'event', node: item as unknown as Event }, pos, scope, id);
          const notes = asArray(item.notes)
            .map((n) => asObject(n))
            .filter((n): n is Record<string, any> => n !== undefined);
          notes.forEach((note, k) => {
            const candidate = notes.length === 1 ? id : `${id}.n${k}`;
            const noteId =
              typeof note.id === 'string'
                ? (reserveExplicit(state.usedIds, note.id, { measureIndex: scope.measureIndex }, report), note.id)
                : notes.length > 1
                  ? synthesize(state, candidate, { measureIndex: scope.measureIndex }, report)
                  : candidate;
            register({ kind: 'chordNote', node: note as unknown as Note }, { ...pos, note: k }, scope, noteId);
          });
          break;
        }
        default:
          break;
      }
    });
  }

  function walkSequence(part: number, measureIndex: number, { sequence, index, staff }: KeptSequence): void {
    const scope: Scope = {
      part,
      staff,
      prefix: scopePrefix(part, staff),
      measureIndex,
      sequenceIndex: index,
      eventCount: 0,
      tupletCount: 0,
    };
    walkContent(asArray(sequence.content), scope, []);
    const full = asObject(sequence.fullMeasure);
    if (full) {
      const id = resolve(full.id, `${scope.prefix}m${measureIndex}.s${index}.full`, measureIndex);
      register(
        { kind: 'fullMeasureRest', node: full as unknown as FullMeasureRest },
        { measureIndex, sequenceIndex: index, path: [], fullMeasureRest: true },
        scope,
        id,
      );
    }
  }

  const globals = asArray(asObject(doc.global)?.measures);
  const docParts = asArray(doc.parts);

  function keptSequences(part: number, measureIndex: number): KeptSequence[] {
    const pm = asObject(asArray(asObject(docParts[part])?.measures)[measureIndex]);
    const counts = new Map<number, number>();
    const out: KeptSequence[] = [];
    asArray(pm?.sequences).forEach((raw, index) => {
      const sequence = asObject(raw);
      if (!sequence) return;
      const staff = typeof sequence.staff === 'number' ? sequence.staff : 1;
      const kept = counts.get(staff) ?? 0;
      counts.set(staff, kept + 1);
      out.push({ sequence, index, staff, kept });
    });
    return out;
  }

  globals.forEach((_, measureIndex) => {
    for (const kept of keptSequences(0, measureIndex)) {
      if (!inDefault(0, kept.staff, kept.kept)) continue;
      addressable = inRequested(0, kept.staff, kept.kept);
      walkSequence(0, measureIndex, kept);
    }
  });
  addressable = true;
  for (const part of [...new Set(parts)].sort((a, b) => a - b)) {
    globals.forEach((_, measureIndex) => {
      for (const kept of keptSequences(part, measureIndex)) {
        if (inDefault(part, kept.staff, kept.kept) || !inRequested(part, kept.staff, kept.kept)) continue;
        walkSequence(part, measureIndex, kept);
      }
    });
  }

  return createElementIds(state, diagnostics);
}
