import { noteValueLength } from '@polyhymnia/mnx';
import { STEP_LETTERS } from '@polyhymnia/music-theory';
import type { Diagnostic, Pitch, NoteId as ModelNoteId, Rational } from '@polyhymnia/mnx';
import type { Timeline } from '@polyhymnia/mnx-score';

export type NoteId = ModelNoteId;

export type StepNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Alter = -2 | -1 | 0 | 1 | 2;

export interface StaffPitch {
  step: StepNumber;
  alter: Alter;
  octave: number;
}

export type DurationBase = 'breve' | 'whole' | 'half' | 'quarter' | 'eighth' | '16th' | '32nd' | '64th';

export type Dots = 0 | 1 | 2;

export interface NoteValueSpec {
  base: DurationBase;
  dots: Dots;
}

export type TupletBracketSetting = 'yes' | 'no' | 'auto';
export type TupletNumberSetting = 'noNumber' | 'inner' | 'both';

export interface TupletDisplay {
  bracket?: TupletBracketSetting;
  showNumber?: TupletNumberSetting;
  placement?: 'above' | 'below' | 'auto';
}

export interface TupletRef {
  id: string;
  actual: number;
  normal: number;
  display?: TupletDisplay;
}

export interface BeamSegment {
  level: number;
  first: NoteId;
  last: NoteId;
  hook?: 'left' | 'right';
}

export interface NormalizedBeam {
  id: string;
  measureIndex: number;
  voice: 0 | 1;
  elements: readonly NoteId[];
  segments: readonly BeamSegment[];
}

export interface NormalizedTie {
  id: string;
  from: NoteId;
  to: NoteId;
  side?: 'up' | 'down';
  measureIndex: number;
}

export interface NormalizedSlur {
  id: string;
  from: NoteId;
  to: NoteId;
  startNote?: NoteId;
  endNote?: NoteId;
  fromBottom?: NoteId;
  toBottom?: NoteId;
  side?: 'up' | 'down';
  measureIndex: number;
}

export interface Duration extends NoteValueSpec {
  tuplet?: TupletRef;
}

export type AccidentalPolicy = 'auto' | 'always' | 'never' | 'cautionary';

export interface ClefSpec {
  kind: 'treble' | 'bass' | 'alto' | 'tenor';
  octaveShift?: -1 | 0 | 1;
}

export interface ClefChange {
  tick: number;
  clef: ClefSpec;
}

export interface KeySpec {
  fifths: number;
}

export interface TimeSpec {
  beats: number;
  beatType: number;
  symbol?: 'common' | 'cut';
}

export const DEFAULT_TIME: TimeSpec = { beats: 4, beatType: 4 };

export function toMnxPitch(p: StaffPitch): Pitch {
  const step = STEP_LETTERS[p.step];
  return p.alter !== 0 ? { step, octave: p.octave, alter: p.alter } : { step, octave: p.octave };
}

export function stepIndex(p: StaffPitch): number {
  return p.step + 7 * p.octave;
}

export function describePitch(p: StaffPitch): string {
  const alter =
    p.alter === 0
      ? ''
      : p.alter === 1
        ? ' sharp'
        : p.alter === -1
          ? ' flat'
          : p.alter === 2
            ? ' double sharp'
            : ' double flat';
  return `${STEP_LETTERS[p.step]}${alter} ${p.octave}`;
}

export function noteValueSpecLength(value: NoteValueSpec): Rational {
  return noteValueLength(value)!;
}

export interface ElementNote {
  id: NoteId;
  pitch: StaffPitch;
  tie?: 'start' | 'stop' | 'continue';
  accidentalPolicy?: AccidentalPolicy;
}

export interface EventEngraving {
  stem?: 'up' | 'down';
  breath?: 'comma' | 'caesura';
}

export interface NoteEngraving {
  pitch: StaffPitch;
  accidentalPolicy?: AccidentalPolicy;
}

export interface NormalizedMeasure {
  index: number;
  clef: ClefSpec;
  clefChanges: readonly ClefChange[];
  trailingClef?: ClefSpec;
  key: KeySpec;
  time: TimeSpec;
  pickup: boolean;
  capacityTicks: number;
  barlineStart?: 'none' | 'repeat-start';
  barlineEnd?: 'single' | 'double' | 'dashed' | 'final' | 'repeat-end' | 'none';
  systemBreak: boolean;
}

export interface NormalizedStaff {
  index: number;
  clef: ClefSpec;
  key: KeySpec;
  time: TimeSpec;
  measures: readonly NormalizedMeasure[];
}

export interface NormalizedScore {
  id: string;
  divisions: number;
  timeline: Timeline;
  staves: readonly NormalizedStaff[];
  events: ReadonlyMap<NoteId, EventEngraving>;
  notes: ReadonlyMap<NoteId, NoteEngraving>;
  beams: readonly NormalizedBeam[];
  ties: readonly NormalizedTie[];
  slurs: readonly NormalizedSlur[];
  diagnostics: readonly Diagnostic[];
}
