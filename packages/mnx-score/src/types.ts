import type {
  Diagnostic,
  ElementIdEntry,
  ElementIds,
  FermataDuration,
  ElementPosition,
  ElementScope,
  NoteId,
  NoteValueBase,
  Pitch,
  Rational,
} from '@polyhymnia/mnx';

export type TimelineScope = ElementScope | 'all';

export interface TimelineOptions {
  scope?: TimelineScope;
  divisions?: number;
}

export type EntryKind = 'note' | 'chord' | 'rest' | 'fullMeasureRest' | 'space' | 'grace';

export type ArticulationKind =
  'staccato' | 'staccatissimo' | 'tenuto' | 'accent' | 'strongAccent' | 'softAccent' | 'stress' | 'unstress';

export interface TupletDisplay {
  bracket?: 'yes' | 'no' | 'auto';
  showNumber?: 'noNumber' | 'inner' | 'both';
  placement?: 'above' | 'below' | 'auto';
}

export interface TimelineTuplet {
  id: NoteId;
  actual: number;
  normal: number;
  display?: TupletDisplay;
}

export interface TieFlags {
  start: boolean;
  stop: boolean;
}

export interface TimelineNote {
  id: NoteId;
  pitch: Pitch;
  midi: number;
  tie: TieFlags;
}

export interface TimelineEntry {
  id: NoteId;
  kind: EntryKind;
  graceIndex?: number;
  slash?: boolean;
  graceType?: 'makeTime' | 'stealFollowing' | 'stealPrevious';
  part: number;
  staff: number;
  voice: number;
  eventIndex: number;
  measureIndex: number;
  tick: number;
  measureTick: number;
  duration: Rational;
  durationTicks: number;
  base: NoteValueBase;
  dots: number;
  tuplet?: TimelineTuplet;
  wholeBar: boolean;
  synthetic: boolean;
  restPosition?: number;
  fermata?: FermataDuration;
  articulations?: readonly ArticulationKind[];
  dynamicLevel?: number;
  notes: readonly TimelineNote[];
}

export interface TimelineTie {
  id: string;
  from: NoteId;
  to: NoteId;
  side?: 'up' | 'down';
}

export interface TimeSignature {
  beats: number;
  beatType: number;
  symbol?: 'common' | 'cut';
}

export interface TimelineMeasure {
  index: number;
  startTick: number;
  endTick: number;
  time: TimeSignature;
  pickup: boolean;
  capacity: Rational;
  fermata?: FermataDuration;
}

export interface BeatUnit {
  base: NoteValueBase;
  dots: number;
}

export interface TempoSegment {
  tick: number;
  seconds: number;
  bpm: number;
  beatUnit: BeatUnit;
}

export interface TempoOverride {
  bpm: number;
  beatUnit?: { base: NoteValueBase; dots?: number };
}

export interface PlaySegment {
  fromTick: number;
  toTick: number;
  playedStartTick: number;
}

export interface TimelineIds {
  idAt(pos: ElementPosition): NoteId | undefined;
  nodeOf(id: NoteId): ElementIdEntry | undefined;
  has(id: NoteId): boolean;
  fork(): ElementIds;
}

export interface Timeline {
  divisions: number;
  entries: readonly TimelineEntry[];
  ties: readonly TimelineTie[];
  measures: readonly TimelineMeasure[];
  tempo: readonly TempoSegment[];
  playOrder: readonly PlaySegment[];
  diagnostics: readonly Diagnostic[];
  ids: TimelineIds;
  activeAt(tick: number): readonly NoteId[];
  byId(id: NoteId): TimelineEntry | undefined;
  writtenTickToSeconds(tick: number, tempo?: TempoOverride): number;
  secondsToWrittenTick(seconds: number, tempo?: TempoOverride): number;
}

export interface PositionTick {
  tick: number;
  measureTick: number;
  diagnostic?: Diagnostic;
}

export interface PerformanceOptions {
  tempo?: TempoOverride;
}

export interface PerformanceEvent {
  id: NoteId;
  midi: number;
  startSeconds: number;
  durationSeconds: number;
  velocity?: number;
}

export interface Performance {
  events: readonly PerformanceEvent[];
  durationSeconds: number;
  tickAtSeconds(seconds: number): number;
}
