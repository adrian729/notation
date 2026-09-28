import type { Diagnostic, ElementIds, ElementPosition, Slur, Tie } from '@polyhymnia/notation-model';
import type { ElementNote, NormalizedSlur, NormalizedTie, NoteId } from './records.js';

export type MutableNote = { -readonly [K in keyof ElementNote]: ElementNote[K] };

interface PendingTie {
  from: MutableNote;
  tie: Tie;
  measureIndex: number;
}

interface PendingSlur {
  fromEventId: NoteId;
  fromNotes: readonly MutableNote[];
  slur: Slur;
  k: number;
  measureIndex: number;
}

export interface Reader {
  diagnostics: Diagnostic[];
  unsupported(construct: string, measureIndex: number | undefined, consequence: string): void;
  notesById: Map<string, MutableNote>;
  ties: PendingTie[];
  resolvedTies: NormalizedTie[];
  slurs: PendingSlur[];
  resolvedSlurs: NormalizedSlur[];
  eventsById: Map<string, readonly MutableNote[]>;
  noteOrder: Map<MutableNote, { voice: 0 | 1; order: number }>;
  eventOrder: [number, number];
  ids: ElementIds;
  usedIds: Set<string>;
}

export function createReader(ids: ElementIds, diagnostics: Diagnostic[]): Reader {
  const seen = new Set<string>();
  return {
    diagnostics,
    notesById: new Map(),
    ties: [],
    resolvedTies: [],
    slurs: [],
    resolvedSlurs: [],
    eventsById: new Map(),
    noteOrder: new Map(),
    eventOrder: [0, 0],
    ids,
    usedIds: new Set(),
    unsupported(construct, measureIndex, consequence) {
      const key = `${construct}@${measureIndex ?? ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      const where = measureIndex === undefined ? '' : ` in measure ${measureIndex}`;
      diagnostics.push({
        severity: 'warning',
        code: 'mnx-unsupported',
        message: `Unsupported MNX: ${construct}${where}; ${consequence}.`,
        ...(measureIndex === undefined ? {} : { measureIndex }),
      });
    },
  };
}

export function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asObject(value: unknown): Record<string, any> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;
}

export function idFor(reader: Reader, pos: ElementPosition, candidate: string): NoteId {
  const id = reader.ids.idAt(pos) ?? reader.ids.mint(candidate);
  reader.usedIds.add(id);
  return id;
}

export function synthId(candidate: string, reader: Reader): NoteId {
  const id = reader.ids.mint(candidate);
  reader.usedIds.add(id);
  return id;
}

export function resolveId(
  explicit: unknown,
  candidate: string,
  reader: Reader,
  measureIndex?: number,
): NoteId {
  if (typeof explicit === 'string') {
    if (reader.usedIds.has(explicit)) {
      reader.diagnostics.push({
        severity: 'warning',
        code: 'id-collision',
        message: `Duplicate id ${JSON.stringify(explicit)} appears on more than one laid-out element; only the first is addressable.`,
        ...(measureIndex === undefined ? {} : { measureIndex }),
      });
      return explicit;
    }
    reader.usedIds.add(explicit);
    return explicit;
  }
  return synthId(candidate, reader);
}
