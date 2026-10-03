import type { Diagnostic, Slur, ElementIds } from '@polyhymnia/mnx';
import type { TimelineEntry, TimelineIds } from '@polyhymnia/mnx-score';
import type { EventEngraving, NormalizedSlur, NoteEngraving, NoteId, StaffPitch } from './records.js';

export interface SlurNote {
  id: NoteId;
  pitch: StaffPitch;
}

interface PendingSlur {
  fromEventId: NoteId;
  fromNotes: readonly SlurNote[];
  slur: Slur;
  k: number;
  measureIndex: number;
}

export interface Reader {
  diagnostics: Diagnostic[];
  engravingIds: ElementIds;
  unsupported(construct: string, measureIndex: number | undefined, consequence: string): void;
  ids: TimelineIds;
  laidOut: ReadonlyMap<NoteId, TimelineEntry>;
  explicitNotes: Set<string>;
  eventsById: Map<string, readonly SlurNote[]>;
  slurs: PendingSlur[];
  resolvedSlurs: NormalizedSlur[];
  events: Map<NoteId, EventEngraving>;
  notes: Map<NoteId, NoteEngraving>;
  voicesByMeasure: Map<string, (0 | 1)[]>;
  voiceOfSequence: Map<string, SequenceVoice>;
}

export interface SequenceVoice {
  staffIndex: number;
  voice: 0 | 1;
}

export function createReader(
  ids: TimelineIds,
  laidOut: ReadonlyMap<NoteId, TimelineEntry>,
  diagnostics: Diagnostic[],
  engravingIds: ElementIds,
): Reader {
  const seen = new Set<string>();
  return {
    diagnostics,
    engravingIds,
    ids,
    laidOut,
    explicitNotes: new Set(),
    eventsById: new Map(),
    slurs: [],
    resolvedSlurs: [],
    events: new Map(),
    notes: new Map(),
    voicesByMeasure: new Map(),
    voiceOfSequence: new Map(),
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

export function sequenceKey(measureIndex: number, sequenceIndex: number): string {
  return `${measureIndex}:${sequenceIndex}`;
}

export function staffMeasureKey(staffIndex: number, measureIndex: number): string {
  return `${staffIndex}:${measureIndex}`;
}

export function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asObject(value: unknown): Record<string, any> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;
}

export function markingId(raw: unknown, candidate: string, measureIndex: number, reader: Reader): NoteId {
  if (typeof raw === 'string' && reader.engravingIds.registerExplicit(raw, { measureIndex })) return raw;
  return reader.engravingIds.mint(typeof raw === 'string' ? raw : candidate, { measureIndex });
}
