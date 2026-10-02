import type { Diagnostic } from '@polyhymnia/mnx';
import type { Timeline } from '@polyhymnia/mnx-score';
import type { ClefSpec, KeySpec, NoteId, StaffPitch } from './records.js';

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SystemBox {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GlyphRun {
  x: number;
  y: number;
  cp: number;
  cls: string;
  el?: NoteId;
  font?: number;
}

export interface RectShape {
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  cls: string;
  el?: NoteId;
}

export interface PathShape {
  d: string;
  cls: string;
  el?: NoteId;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ElementBox {
  id: NoteId;
  kind: 'note' | 'chord' | 'rest';
  systemIndex: number;
  measureIndex: number;
  voice: 0 | 1;
  x: number;
  y: number;
  w: number;
  h: number;
  hitBox: Box;
  staffPosition: number;
  tick: number;
  durationTicks: number;
  label: string;
  eventId: NoteId;
  pitch?: StaffPitch;
}

export interface SlotRef {
  measureIndex: number;
  voice: 0 | 1;
  tick: number;
}

export interface Slot extends SlotRef {
  x: number;
  w: number;
  eventId: NoteId;
  elementIds: readonly NoteId[];
}

export interface MeasureBox {
  index: number;
  systemIndex: number;
  x: number;
  w: number;
  contentX: number;
  startTick: number;
  capacityTicks: number;
  clef: ClefSpec;
  key: KeySpec;
  clefChanges?: readonly MeasureClefChange[];
}

export interface MeasureClefChange {
  x: number;
  tick: number;
  clef: ClefSpec;
}

export interface EntryPlacement {
  x: number;
  y: number;
  systemIndex: number;
}

export interface MeasurePlacement {
  systemIndex: number;
  x: number;
  w: number;
}

export interface Placements {
  entries: Readonly<Record<NoteId, EntryPlacement>>;
  measures: readonly MeasurePlacement[];
}

export interface LayoutResult {
  version: 1;
  viewBox: ViewBox;
  systems: readonly SystemBox[];
  glyphs: readonly GlyphRun[];
  rects: readonly RectShape[];
  paths: readonly PathShape[];
  elements: Readonly<Record<NoteId, ElementBox>>;
  slots: readonly Slot[];
  measures: readonly MeasureBox[];
  timeline: Timeline;
  placements: Placements;
  diagnostics: readonly Diagnostic[];
  fonts?: readonly string[];
}
