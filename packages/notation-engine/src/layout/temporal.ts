import type { TimelineEntry, TimelineNote } from '@polyhymnia/mnx-score';
import { stepNumberOf } from '@polyhymnia/music-theory';
import type {
  Alter,
  Dots,
  DurationBase,
  ElementNote,
  NormalizedScore,
  NoteId,
  StaffPitch,
  StepNumber,
  TupletRef,
} from './records.js';
import { MIDDLE_LINE } from './staff.js';

export interface TemporalElement {
  id: NoteId;
  kind: 'note' | 'chord' | 'rest' | 'grace';
  graceIndex?: number;
  slash?: boolean;
  base: DurationBase;
  dots: 0 | 1 | 2;
  tuplet?: TupletRef;
  notes: readonly ElementNote[];
  stem?: 'auto' | 'up' | 'down' | 'none';
  breath?: 'comma' | 'caesura';
  wholeBar?: boolean;
  staffPosition?: number;
  staffIndex: number;
  measureIndex: number;
  voice: 0 | 1;
  tick: number;
  measureTick: number;
  durationTicks: number;
  synthetic?: boolean;
}

export interface TemporalMeasure {
  index: number;
  staffIndex: number;
  startTick: number;
  endTick: number;
  capacityTicks: number;
}

export interface TemporalScore {
  divisions: number;
  measures: readonly TemporalMeasure[];
  elements: readonly TemporalElement[];
}

export function elementsByStaffMeasureKey(staffIndex: number, measureIndex: number): string {
  return `${staffIndex}:${measureIndex}`;
}

export function indexElementsByStaffMeasure(score: TemporalScore): ReadonlyMap<string, readonly TemporalElement[]> {
  const byMeasure = new Map<string, TemporalElement[]>();
  for (const el of score.elements) {
    const key = elementsByStaffMeasureKey(el.staffIndex, el.measureIndex);
    let bucket = byMeasure.get(key);
    if (!bucket) {
      bucket = [];
      byMeasure.set(key, bucket);
    }
    bucket.push(el);
  }
  for (const bucket of byMeasure.values()) {
    bucket.sort((a, b) => a.tick - b.tick || (b.graceIndex ?? 0) - (a.graceIndex ?? 0) || a.voice - b.voice);
  }
  return byMeasure;
}

export function temporal(normalized: NormalizedScore): TemporalScore {
  const { timeline } = normalized;
  const elements = timeline.entries
    .filter((entry) => entry.kind !== 'space')
    .sort(
      (a, b) =>
        a.measureIndex - b.measureIndex || a.staff - b.staff || a.voice - b.voice || a.eventIndex - b.eventIndex,
    )
    .map((entry) => element(entry, normalized));
  const measures = timeline.measures.map((m) => ({
    index: m.index,
    staffIndex: 0,
    startTick: m.startTick,
    endTick: m.endTick,
    capacityTicks: m.endTick - m.startTick,
  }));
  return { divisions: timeline.divisions, measures, elements };
}

function element(entry: TimelineEntry, normalized: NormalizedScore): TemporalElement {
  const engraving = normalized.events.get(entry.id);
  return {
    id: entry.id,
    kind: entry.kind === 'note' || entry.kind === 'chord' || entry.kind === 'grace' ? entry.kind : 'rest',
    ...(entry.kind === 'grace' ? { graceIndex: entry.graceIndex, slash: entry.slash } : {}),
    base: entry.base as DurationBase,
    dots: Math.min(entry.dots, 2) as Dots,
    ...(entry.tuplet ? { tuplet: entry.tuplet } : {}),
    notes: entry.notes.map((note) => elementNote(note, normalized)),
    ...(engraving?.stem ? { stem: engraving.stem } : {}),
    ...(engraving?.breath ? { breath: engraving.breath } : {}),
    ...(entry.wholeBar ? { wholeBar: true } : {}),
    ...(entry.restPosition !== undefined ? { staffPosition: MIDDLE_LINE - entry.restPosition / 2 } : {}),
    staffIndex: entry.staff - 1,
    measureIndex: entry.measureIndex,
    voice: entry.voice as 0 | 1,
    tick: entry.tick,
    measureTick: entry.measureTick,
    durationTicks: entry.durationTicks,
    ...(entry.synthetic ? { synthetic: true } : {}),
  };
}

function elementNote(note: TimelineNote, normalized: NormalizedScore): ElementNote {
  const engraving = normalized.notes.get(note.id);
  const tie = note.tie.start ? (note.tie.stop ? 'continue' : 'start') : note.tie.stop ? 'stop' : undefined;
  return {
    id: note.id,
    pitch: engraving?.pitch ?? staffPitchOf(note),
    ...(engraving?.accidentalPolicy ? { accidentalPolicy: engraving.accidentalPolicy } : {}),
    ...(tie ? { tie } : {}),
  };
}

function staffPitchOf({ pitch }: TimelineNote): StaffPitch {
  const alter = Math.max(-2, Math.min(2, Math.round(pitch.alter ?? 0))) as Alter;
  return { step: stepNumberOf(pitch.step) as StepNumber, alter, octave: pitch.octave };
}
