export type { NotationOptions } from './options.js';
export { DEFAULT_STYLE } from './font/glyphs.js';
export { DEFAULT_FONTS } from './font/context.js';

export type { ClefSpec, KeySpec, StaffPitch, TimeSpec } from './layout/records.js';

export { layoutScore } from './layout/index.js';
export type {
  ElementBox,
  EntryPlacement,
  GlyphRun,
  LayoutResult,
  MeasureBox,
  MeasureClefChange,
  MeasurePlacement,
  MeasureStaff,
  PathShape,
  Placements,
  RectShape,
  Slot,
  SlotRef,
  StaffBox,
  SystemBox,
  ViewBox,
} from './layout/types.js';

export { hitTest, HIT_STAFF_MARGIN } from './query/hitTest.js';
export type { HitKind, HitOptions, HitResult } from './query/hitTest.js';
export { positionAtTick } from './query/position.js';
export type { TickPosition } from './query/position.js';
export { previewShapes } from './query/preview.js';
export type { PreviewNote } from './query/preview.js';
