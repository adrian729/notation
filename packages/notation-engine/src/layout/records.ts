import { noteValueLength, Rational as R, STEP_LETTERS, stepNumberOf } from '@polyhymnia/notation-model';
import type { Diagnostic, Pitch, NoteId as ModelNoteId, Rational } from '@polyhymnia/notation-model';

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

export interface KeySpec {
  fifths: number;
}

export interface TimeSpec {
  beats: number;
  beatType: number;
  symbol?: 'common' | 'cut';
}

export interface TempoEvent {
  tick: number;
  bpm: number;
  beatUnit?: NoteValueSpec;
}

export type TempoMap = readonly TempoEvent[];

export const DEFAULT_DIVISIONS = 3360;

export const DEFAULT_TIME: TimeSpec = { beats: 4, beatType: 4 };

export const DURATION_BASES: readonly DurationBase[] = [
  'breve',
  'whole',
  'half',
  'quarter',
  'eighth',
  '16th',
  '32nd',
  '64th',
];

export function stepNumber(letter: unknown): StepNumber | undefined {
  if (!(STEP_LETTERS as readonly unknown[]).includes(letter)) return undefined;
  return stepNumberOf(letter as Pitch['step']) as StepNumber;
}

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

interface Candidate {
  value: NoteValueSpec;
  length: Rational;
}

const CANDIDATES: readonly Candidate[] = DURATION_BASES.flatMap((base) =>
  ([0, 1, 2] as const).map((dots) => ({
    value: { base, dots },
    length: noteValueSpecLength({ base, dots }),
  })),
).sort((a, b) => R.compare(b.length, a.length));

const SHORTEST = CANDIDATES[CANDIDATES.length - 1]!.length;

export function decomposeLength(length: Rational): NoteValueSpec[] {
  const out: NoteValueSpec[] = [];
  let remaining = length;
  for (let guard = 0; guard < 64; guard += 1) {
    if (R.compare(remaining, SHORTEST) < 0) break;
    const pick = CANDIDATES.find((c) => R.compare(c.length, remaining) <= 0);
    if (!pick) break;
    out.push({ ...pick.value });
    remaining = R.subtract(remaining, pick.length);
    if (R.isZero(remaining)) break;
  }
  return out;
}

export interface MeasureFlow {
  repeatStart: boolean;
  repeatEnd?: number;
  ending?: { numbers: readonly number[]; duration: number };
  segno?: number;
  fine?: number;
  jump?: { type: 'segno' | 'dsalfine'; offset: number };
  invalid?: string;
}

export type MeasureFlows = readonly MeasureFlow[];

export interface ElementNote {
  id: NoteId;
  pitch: StaffPitch;
  tie?: 'start' | 'stop' | 'continue';
  accidentalPolicy?: AccidentalPolicy;
}

export interface NormalizedElement {
  id: NoteId;
  kind: 'note' | 'chord' | 'rest';
  base: DurationBase;
  dots: Dots;
  length: Rational;
  tuplet?: TupletRef;
  notes: readonly ElementNote[];
  stem?: 'up' | 'down';
  breath?: 'comma' | 'caesura';
  wholeBar?: boolean;
  staffPosition?: number;
}

export interface NormalizedGap {
  kind: 'space';
  length: Rational;
}

export type NormalizedEvent = NormalizedElement | NormalizedGap;

export interface NormalizedVoice {
  index: 0 | 1;
  events: readonly NormalizedEvent[];
}

export interface NormalizedMeasure {
  index: number;
  clef: ClefSpec;
  key: KeySpec;
  time: TimeSpec;
  voices: readonly NormalizedVoice[];
  pickup: boolean;
  capacity: Rational;
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
  tempo: TempoMap;
  flow: MeasureFlows;
  staves: readonly NormalizedStaff[];
  beams: readonly NormalizedBeam[];
  ties: readonly NormalizedTie[];
  slurs: readonly NormalizedSlur[];
  diagnostics: readonly Diagnostic[];
  usedIds: ReadonlySet<string>;
}
