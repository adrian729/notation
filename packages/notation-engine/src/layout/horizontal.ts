import type { FontContext } from '../font/context.js';
import { DEFAULT_OPTIONS, type NotationOptions } from '../options.js';
import type { Diagnostic } from '@polyhymnia/mnx';
import type { ClefChange, ClefSpec, KeySpec, NormalizedMeasure, NormalizedScore, TimeSpec } from './records.js';
import { clefChangeGlyph, clefGlyph, keySignature } from './staff.js';
import type { TemporalScore } from './temporal.js';
import type { VerticalElement, VerticalScore } from './vertical.js';

type ChangeOptions = Required<NonNullable<NotationOptions['changes']>>;

const ROD_PADDING = 0.4;
export const EPS_STRETCH = 0.05;
export const CHROME_GAP = 0.6;
const KEY_GAP = 0.1;
export const BARLINE_PAD = 0.4;
const MEASURE_LEAD = 0.4;
const MIN_MEASURE_CONTENT = 4;
export const COURTESY_LEAD = BARLINE_PAD;

export interface HorizontalColumn {
  staffIndex: number;
  measureIndex: number;
  tick: number;
  measureTick: number;
  spanTicks: number;
  elements: readonly VerticalElement[];
  leftWidth: number;
  rightWidth: number;
  rodWidth: number;
  idealWidth: number;
  width: number;
  stretch: number;
  clef?: ClefSpec;
}

export interface MeasureChrome {
  showClef: boolean;
  showKey: boolean;
  showTime: boolean;
  clefWidth: number;
  keyWidth: number;
  timeWidth: number;
  startBarlineWidth: number;
  endBarlineWidth: number;
  leadWidth: number;
  cancelKey: KeySpec | null;
}

export interface Courtesy {
  key: KeySpec;
  clef: ClefSpec;
  cancelKey: KeySpec | null;
  showKey: boolean;
  time: TimeSpec;
  showTime: boolean;
  keyWidth: number;
  width: number;
}

export interface HorizontalMeasure {
  index: number;
  staffIndex: number;
  barlineStart: NormalizedMeasure['barlineStart'];
  barlineEnd: NormalizedMeasure['barlineEnd'];
  clef: ClefSpec;
  key: KeySpec;
  time: TimeSpec;
  startTick: number;
  endTick: number;
  capacityTicks: number;
  columns: readonly HorizontalColumn[];
  contentWidth: number;
  startChrome: MeasureChrome;
  midChrome: MeasureChrome;
  courtesy: Courtesy | null;
  systemBreak: boolean;
}

export interface HorizontalScore {
  measures: readonly HorizontalMeasure[];
  diagnostics: readonly Diagnostic[];
}

export function horizontal(
  normalized: NormalizedScore,
  temporal: TemporalScore,
  laidOut: VerticalScore,
  fonts: FontContext,
  options?: NotationOptions,
): HorizontalScore {
  const diagnostics: Diagnostic[] = [];
  const staff = normalized.staves[0];
  if (!staff) return { measures: [], diagnostics };

  const base = options?.spacing?.base ?? DEFAULT_OPTIONS.spacing.base;
  const k = options?.spacing?.k ?? DEFAULT_OPTIONS.spacing.k;
  const { divisions } = normalized;
  const changes: ChangeOptions = {
    clefAtBarline: options?.changes?.clefAtBarline ?? DEFAULT_OPTIONS.changes.clefAtBarline,
    restateTimeAfterCourtesy:
      options?.changes?.restateTimeAfterCourtesy ?? DEFAULT_OPTIONS.changes.restateTimeAfterCourtesy,
  };

  const measures: HorizontalMeasure[] = [];
  let previous: NormalizedMeasure | undefined;

  staff.measures.forEach((measure, position) => {
    const next = staff.measures[position + 1];
    const bounds = temporal.measures.find((m) => m.staffIndex === staff.index && m.index === measure.index);
    const startTick = bounds?.startTick ?? 0;
    const endTick = bounds?.endTick ?? startTick + measure.capacityTicks;

    const elements = laidOut.elements.filter((e) => e.staffIndex === staff.index && e.measureIndex === measure.index);
    const columns = buildColumns(elements, measure, fonts, {
      staffIndex: staff.index,
      measureIndex: measure.index,
      startTick,
      endTick,
      divisions,
      base,
      k,
      trailingClefs: changes.clefAtBarline === 'before',
    });
    const elementWidth = columns.reduce((sum, c) => (isClefColumn(c) ? sum : sum + c.width), 0);
    const clefWidth = columns.reduce((sum, c) => (isClefColumn(c) ? sum + c.width : sum), 0);
    const contentWidth = (elementWidth || MIN_MEASURE_CONTENT) + clefWidth;

    measures.push({
      index: measure.index,
      staffIndex: staff.index,
      barlineStart: measure.barlineStart,
      barlineEnd: measure.barlineEnd,
      clef: measure.clef,
      key: measure.key,
      time: measure.time,
      startTick,
      endTick,
      capacityTicks: measure.capacityTicks,
      columns,
      contentWidth,
      startChrome: chromeOf(fonts, measure, previous, true, changes),
      midChrome: chromeOf(fonts, measure, previous, false, changes),
      courtesy: next ? courtesyOf(fonts, measure, next) : null,
      systemBreak: measure.systemBreak,
    });
    previous = measure;
  });

  return { measures, diagnostics };
}

interface ColumnContext {
  staffIndex: number;
  measureIndex: number;
  startTick: number;
  endTick: number;
  divisions: number;
  base: number;
  k: number;
  trailingClefs: boolean;
}

function buildColumns(
  elements: readonly VerticalElement[],
  measure: NormalizedMeasure,
  fonts: FontContext,
  ctx: ColumnContext,
): HorizontalColumn[] {
  const byTick = new Map<number, VerticalElement[]>();
  for (const el of elements) {
    const bucket = byTick.get(el.tick);
    if (bucket) bucket.push(el);
    else byTick.set(el.tick, [el]);
  }
  const ticks = [...byTick.keys()].sort((a, b) => a - b);

  const elementColumns = ticks.map((tick, i): HorizontalColumn => {
    const members = byTick.get(tick)!;
    const next = ticks[i + 1] ?? ctx.endTick;
    const spanTicks = Math.max(1, next - tick);
    const leftWidth = members.reduce((max, e) => Math.max(max, e.leftWidth), 0);
    const rightWidth = members.reduce((max, e) => Math.max(max, e.rightWidth), 0);
    const rodWidth = leftWidth + rightWidth + ROD_PADDING;
    const idealWidth = ctx.base * (spanTicks / ctx.divisions) ** ctx.k;
    const nextLeftWidth = byTick.get(ticks[i + 1] ?? -1)?.reduce((max, e) => Math.max(max, e.leftWidth), 0) ?? 0;
    const springWidth = idealWidth + Math.max(0, leftWidth - nextLeftWidth);
    return {
      staffIndex: ctx.staffIndex,
      measureIndex: ctx.measureIndex,
      tick,
      measureTick: members[0]!.measureTick,
      spanTicks,
      elements: members,
      leftWidth,
      rightWidth,
      rodWidth,
      idealWidth,
      width: Math.max(rodWidth, springWidth),
      stretch: idealWidth + EPS_STRETCH,
    };
  });

  const clefBefore = new Map<number, ClefChange>();
  for (const change of measure.clefChanges) {
    const index = elementColumns.findIndex((column) => column.measureTick >= change.tick);
    if (index >= 0) clefBefore.set(index, change);
  }
  const columns: HorizontalColumn[] = [];
  elementColumns.forEach((column, i) => {
    const change = clefBefore.get(i);
    if (change) columns.push(clefColumn(fonts, change.clef, change.tick, ROD_PADDING, ctx));
    columns.push(column);
  });
  if (ctx.trailingClefs && measure.trailingClef) {
    columns.push(clefColumn(fonts, measure.trailingClef, ctx.endTick - ctx.startTick, 0, ctx));
  }
  return columns;
}

function clefColumn(
  fonts: FontContext,
  clef: ClefSpec,
  measureTick: number,
  gap: number,
  ctx: ColumnContext,
): HorizontalColumn {
  const glyphWidth = fonts.advanceWidth(clefChangeGlyph(clef));
  return {
    staffIndex: ctx.staffIndex,
    measureIndex: ctx.measureIndex,
    tick: ctx.startTick + measureTick,
    measureTick,
    spanTicks: 0,
    elements: [],
    leftWidth: 0,
    rightWidth: glyphWidth,
    rodWidth: glyphWidth + gap,
    idealWidth: 0,
    width: glyphWidth + gap,
    stretch: 0,
    clef,
  };
}

function chromeOf(
  fonts: FontContext,
  measure: NormalizedMeasure,
  previous: NormalizedMeasure | undefined,
  atSystemStart: boolean,
  changes: ChangeOptions,
): MeasureChrome {
  const keyChanged = !previous || measure.key.fifths !== previous.key.fifths;
  const timeChanged = !previous || !timeEquals(measure.time, previous.time);
  const afterCourtesy = atSystemStart && previous !== undefined && (keyChanged || timeChanged);

  const clefAtBarline = changes.clefAtBarline === 'after' && previous?.trailingClef !== undefined;
  const showClef = atSystemStart || !previous || clefAtBarline;
  const showKey = afterCourtesy ? measure.key.fifths !== 0 : (atSystemStart && measure.key.fifths !== 0) || keyChanged;
  const showTime = timeChanged && (!afterCourtesy || changes.restateTimeAfterCourtesy);
  const cancelKey = keyChanged && previous && !afterCourtesy ? cancellation(previous.key, measure.key) : null;

  const widths = {
    clefWidth: showClef ? fonts.advanceWidth(clefGlyph(measure.clef)) + CHROME_GAP : 0,
    keyWidth: showKey || cancelKey ? keyWidthOf(fonts, measure.key, measure.clef, cancelKey, showKey) : 0,
    timeWidth: showTime ? timeWidthOf(fonts, measure.time) : 0,
    startBarlineWidth: measure.barlineStart === 'repeat-start' ? repeatStartWidth(fonts) : 0,
  };
  const bare =
    widths.clefWidth === 0 && widths.keyWidth === 0 && widths.timeWidth === 0 && widths.startBarlineWidth === 0;

  return {
    showClef,
    showKey,
    showTime,
    ...widths,
    endBarlineWidth: endBarlineWidth(fonts, measure.barlineEnd),
    leadWidth: bare ? MEASURE_LEAD : 0,
    cancelKey,
  };
}

function courtesyOf(fonts: FontContext, measure: NormalizedMeasure, next: NormalizedMeasure): Courtesy | null {
  const showKey = next.key.fifths !== measure.key.fifths;
  const showTime = !timeEquals(next.time, measure.time);
  if (!showKey && !showTime) return null;
  const cancelKey = showKey ? cancellation(measure.key, next.key) : null;
  const keyWidth = showKey ? keyWidthOf(fonts, next.key, next.clef, cancelKey, true) : 0;
  const timeWidth = showTime ? timeWidthOf(fonts, next.time) : 0;
  return {
    key: next.key,
    clef: next.clef,
    cancelKey,
    showKey,
    time: next.time,
    showTime,
    keyWidth,
    width: COURTESY_LEAD + keyWidth + timeWidth,
  };
}

function timeEquals(a: TimeSpec, b: TimeSpec): boolean {
  return a.beats === b.beats && a.beatType === b.beatType && (a.symbol ?? 'normal') === (b.symbol ?? 'normal');
}

function cancellation(from: KeySpec, to: KeySpec): KeySpec | null {
  const sameSide = Math.sign(from.fifths) === Math.sign(to.fifths);
  const count = sameSide ? Math.abs(from.fifths) - Math.abs(to.fifths) : Math.abs(from.fifths);
  if (count <= 0) return null;
  return { fifths: from.fifths };
}

function keyWidthOf(
  fonts: FontContext,
  key: KeySpec,
  clef: ClefSpec,
  cancelKey: KeySpec | null,
  showKey: boolean,
): number {
  const { width } = layOutKeyGlyphs(fonts, key, clef, cancelKey, showKey, 0);
  return width > 0 ? width + CHROME_GAP : 0;
}

export interface KeyGlyph {
  glyph: string;
  x: number;
  y: number;
}

export function layOutKeyGlyphs(
  fonts: FontContext,
  key: KeySpec,
  clef: ClefSpec,
  cancelKey: KeySpec | null,
  showKey: boolean,
  x0: number,
): { glyphs: readonly KeyGlyph[]; width: number } {
  const naturals = cancelKey ? cancelledAccidentals(cancelKey, key, clef) : [];
  const accidentals = showKey ? keySignature(key, clef) : [];
  const glyphs: KeyGlyph[] = [];
  let x = x0;
  for (const acc of [...naturals, ...accidentals]) {
    glyphs.push({ glyph: acc.glyph, x, y: acc.y });
    x += fonts.advanceWidth(acc.glyph) + KEY_GAP;
  }
  return { glyphs, width: x - x0 };
}

function cancelledAccidentals(
  from: KeySpec,
  to: KeySpec,
  clef: ClefSpec,
): readonly { step: number; y: number; glyph: string }[] {
  const incoming = new Set(keySignature(to, clef).map((a) => a.step));
  return keySignature(from, clef)
    .filter((a) => !incoming.has(a.step))
    .map((a) => ({ step: a.step, y: a.y, glyph: 'accidentalNatural' }));
}

function timeWidthOf(fonts: FontContext, time: TimeSpec): number {
  if (time.symbol === 'common' || time.symbol === 'cut') {
    return fonts.advanceWidth(time.symbol === 'cut' ? 'timeSigCutCommon' : 'timeSigCommon') + CHROME_GAP;
  }
  return Math.max(digitsWidth(fonts, time.beats), digitsWidth(fonts, time.beatType)) + CHROME_GAP;
}

export function digitsWidth(fonts: FontContext, value: number): number {
  return [...String(Math.max(0, Math.round(value)))].reduce((sum, d) => sum + fonts.advanceWidth(`timeSig${d}`), 0);
}

export function endBarlineWidth(fonts: FontContext, kind: NormalizedMeasure['barlineEnd']): number {
  const e = fonts.engravingDefaults;
  switch (kind) {
    case 'none':
      return 0;
    case 'double':
      return BARLINE_PAD + e.thinBarlineThickness * 2 + e.barlineSeparation;
    case 'dashed':
      return BARLINE_PAD + e.dashedBarlineThickness;
    case 'final':
      return BARLINE_PAD + e.thinBarlineThickness + e.thinThickBarlineSeparation + e.thickBarlineThickness;
    case 'repeat-end':
      return (
        BARLINE_PAD +
        fonts.advanceWidth('repeatDot') +
        e.repeatBarlineDotSeparation +
        e.thinBarlineThickness +
        e.thinThickBarlineSeparation +
        e.thickBarlineThickness
      );
    default:
      return BARLINE_PAD + e.thinBarlineThickness;
  }
}

export function repeatStartWidth(fonts: FontContext): number {
  const e = fonts.engravingDefaults;
  return (
    e.thickBarlineThickness +
    e.thinThickBarlineSeparation +
    e.thinBarlineThickness +
    e.repeatBarlineDotSeparation +
    fonts.advanceWidth('repeatDot') +
    BARLINE_PAD
  );
}

export function chromeWidth(chrome: MeasureChrome): number {
  return chrome.startBarlineWidth + chrome.clefWidth + chrome.keyWidth + chrome.timeWidth + chrome.leadWidth;
}

export function measureWidth(measure: HorizontalMeasure, atSystemStart: boolean, followedByBreak = false): number {
  const chrome = atSystemStart ? measure.startChrome : measure.midChrome;
  const courtesy = followedByBreak ? (measure.courtesy?.width ?? 0) : 0;
  return chromeWidth(chrome) + measure.contentWidth + chrome.endBarlineWidth + courtesy;
}

export function isClefColumn<T extends HorizontalColumn>(column: T): column is T & { clef: ClefSpec } {
  return column.clef !== undefined;
}
