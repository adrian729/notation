export type { NotationOptions } from './options.js';

export type { ClefSpec, KeySpec, StaffPitch, TimeSpec } from './layout/records.js';

export { layoutScore } from './layout/index.js';
export type {
  ElementBox,
  GlyphRun,
  LayoutResult,
  MeasureBox,
  PathShape,
  RectShape,
  Slot,
  SlotRef,
  SystemBox,
  ViewBox,
} from './layout/types.js';

export type { TempoOverride, TimeMap, TimeMapEntry } from './query/timemap.js';

export { hitTest, HIT_STAFF_MARGIN } from './query/hitTest.js';
export type { HitKind, HitOptions, HitResult } from './query/hitTest.js';
export { previewShapes } from './query/preview.js';
export type { PreviewNote } from './query/preview.js';
