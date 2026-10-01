import type {
  Event,
  MeasureGlobal,
  MnxDocument,
  Note,
  NoteValue,
  NoteValueBase,
  PartMeasure,
  Pitch,
  Sequence,
  SequenceContent,
  Tuplet,
} from '../src/mnx/types.js';

export const F3: Pitch = { step: 'F', octave: 3 };
export const A3: Pitch = { step: 'A', octave: 3 };
export const C4: Pitch = { step: 'C', octave: 4 };
export const D4: Pitch = { step: 'D', octave: 4 };
export const E4: Pitch = { step: 'E', octave: 4 };
export const F4: Pitch = { step: 'F', octave: 4 };
export const G4: Pitch = { step: 'G', octave: 4 };
export const A4: Pitch = { step: 'A', octave: 4 };

const BASES: Record<string, NoteValueBase> = { w: 'whole', h: 'half', q: 'quarter', '8': 'eighth', '16': '16th' };

export function value(token: string): NoteValue {
  const base = BASES[token];
  if (!base) throw new Error(`bad duration token ${token}`);
  return { base };
}

export function note(pitch: Pitch, duration: string, extra: Partial<Event> = {}, noteExtra: Partial<Note> = {}): Event {
  return { duration: value(duration), notes: [{ pitch, ...noteExtra }], ...extra };
}

export function chord(pitches: readonly Pitch[], duration: string, extra: Partial<Event> = {}): Event {
  return { duration: value(duration), notes: pitches.map((pitch) => ({ pitch })), ...extra };
}

export function rest(duration: string, extra: Partial<Event> = {}): Event {
  return { duration: value(duration), rest: {}, ...extra };
}

export function grace(...content: SequenceContent): SequenceContent[number] {
  return { type: 'grace', content } as SequenceContent[number];
}

export function tremolo(marks: number, outer: [number, string], ...content: Event[]): SequenceContent[number] {
  return {
    type: 'tremolo',
    marks,
    outer: { multiple: outer[0], duration: value(outer[1]) },
    content,
  } as SequenceContent[number];
}

export function tuplet(inner: [number, string], outer: [number, string], ...content: SequenceContent): Tuplet {
  return {
    type: 'tuplet',
    inner: { multiple: inner[0], duration: value(inner[1]) },
    outer: { multiple: outer[0], duration: value(outer[1]) },
    content,
  };
}

export interface MeasureSpec {
  global?: MeasureGlobal;
  part?: Omit<PartMeasure, 'sequences'>;
  sequences: Sequence[];
}

export function measure(...content: SequenceContent): MeasureSpec {
  return { sequences: [{ content }] };
}

export function mnx(...measures: MeasureSpec[]): MnxDocument {
  return {
    mnx: { version: 1 },
    global: {
      measures: measures.map((m, i) => ({
        ...(i === 0 ? { time: { count: 4, unit: 4 } } : {}),
        ...m.global,
      })),
    },
    parts: [
      {
        measures: measures.map((m) => ({
          ...m.part,
          sequences: m.sequences,
        })),
      },
    ],
  };
}
