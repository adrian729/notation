import type { Diagnostic, Slur } from '@polyhymnia/mnx';
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
  unsupported(construct: string, measureIndex: number | undefined, consequence: string): void;
  ids: TimelineIds;
  laidOut: ReadonlyMap<NoteId, TimelineEntry>;
  explicitNotes: Set<string>;
  eventsById: Map<string, readonly SlurNote[]>;
  slurs: PendingSlur[];
  resolvedSlurs: NormalizedSlur[];
  events: Map<NoteId, EventEngraving>;
  notes: Map<NoteId, NoteEngraving>;
  voicesByMeasure: Map<number, (0 | 1)[]>;
  voiceOfSequence: Map<string, 0 | 1>;
}

export function createReader(
  ids: TimelineIds,
  laidOut: ReadonlyMap<NoteId, TimelineEntry>,
  diagnostics: Diagnostic[],
): Reader {
  const seen = new Set<string>();
  return {
    diagnostics,
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

export function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asObject(value: unknown): Record<string, any> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;
}
