import type { FontContext } from '../font/context.js';
import { DEFAULT_OPTIONS, type NotationOptions } from '../options.js';
import type { Diagnostic } from '@polyhymnia/mnx';
import type { ClefSpec, KeySpec, NormalizedMeasure, NormalizedScore, TimeSpec } from './records.js';
import { clefChangeGlyph, clefGlyph, keySignature } from './staff.js';
import type { TemporalScore } from './temporal.js';
import type { VerticalElement, VerticalScore } from './vertical.js';

type ChangeOptions = Required<NonNullable<NotationOptions['changes']>>;

const ROD_PADDING = 0.4;
export const EPS_STRETCH = 0.05;
export const CHROME_GAP = 0.6;
const KEY_GAP = 0.1;
const CANCEL_GAP = 0.5;
export const BARLINE_PAD = 0.4;
const MEASURE_LEAD = 0.4;
const MIN_MEASURE_CONTENT = 4;
export const COURTESY_LEAD = BARLINE_PAD;

export interface StaffClef {
  staffIndex: number;
  clef: ClefSpec;
}

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
  clefs?: readonly StaffClef[];
}

export interface MeasureChrome {
  showClef: boolean;
  staffClefs: readonly boolean[];
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

export interface CourtesyStaff {
  clef: ClefSpec;
  showClef: boolean;
}

export interface Courtesy {
  key: KeySpec;
  clef: ClefSpec;
  showClef: boolean;
  clefWidth: number;
  cancelKey: KeySpec | null;
  showKey: boolean;
  time: TimeSpec;
  showTime: boolean;
  keyWidth: number;
  width: number;
  staves: readonly CourtesyStaff[];
}

export interface HorizontalStaff {
  clef: ClefSpec;
  key: KeySpec;
}

export interface HorizontalMeasure {
  index: number;
  staffIndex: number;
  barlineStart: NormalizedMeasure['barlineStart'];
  barlineEnd: NormalizedMeasure['barlineEnd'];
  clef: ClefSpec;
  key: KeySpec;
  time: TimeSpec;
  staves: readonly HorizontalStaff[];
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
    cancelNaturals: options?.changes?.cancelNaturals ?? DEFAULT_OPTIONS.changes.cancelNaturals,
  };

  const measures: HorizontalMeasure[] = [];
  let previous: readonly NormalizedMeasure[] | undefined;
  const stackAt = (position: number): readonly NormalizedMeasure[] | undefined => {
    const stack = normalized.staves.map((s) => s.measures[position]);
    return stack.every((m) => m !== undefined) ? (stack as NormalizedMeasure[]) : undefined;
  };

  staff.measures.forEach((measure, position) => {
    const stack = stackAt(position) ?? [measure];
    const next = stackAt(position + 1);
    const bounds = temporal.measures.find((m) => m.staffIndex === staff.index && m.index === measure.index);
    const startTick = bounds?.startTick ?? 0;
    const endTick = bounds?.endTick ?? startTick + measure.capacityTicks;

    const elements = laidOut.elements.filter((e) => e.measureIndex === measure.index && e.staffIndex < stack.length);
    const columns = buildColumns(elements, stack, fonts, {
      staffIndex: staff.index,
      measureIndex: measure.index,
      startTick,
      endTick,
      divisions,
      base,
      k,
      trailingClefs: changes.clefAtBarline === 'before',
    });
    const contentWidth = contentWidthOf(columns);

    measures.push({
      index: measure.index,
      staffIndex: staff.index,
      barlineStart: measure.barlineStart,
      barlineEnd: measure.barlineEnd,
      clef: measure.clef,
      key: measure.key,
      time: measure.time,
      staves: stack.map((m) => ({ clef: m.clef, key: m.key })),
      startTick,
      endTick,
      capacityTicks: measure.capacityTicks,
      columns,
      contentWidth,
      startChrome: chromeOf(fonts, stack, previous, true, changes),
      midChrome: chromeOf(fonts, stack, previous, false, changes),
      courtesy: next ? courtesyOf(fonts, stack, next, changes) : null,
      systemBreak: measure.systemBreak,
    });
    previous = stack;
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
  stack: readonly NormalizedMeasure[],
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

  const clefBefore = new Map<number, { tick: number; clefs: StaffClef[] }>();
  stack.forEach((measure, staffIndex) => {
    for (const change of measure.clefChanges) {
      const index = elementColumns.findIndex(
        (column) => column.measureTick >= change.tick && column.elements.some((e) => e.staffIndex === staffIndex),
      );
      if (index < 0) continue;
      const entry = clefBefore.get(index) ?? { tick: change.tick, clefs: [] };
      entry.tick = Math.min(entry.tick, change.tick);
      entry.clefs.push({ staffIndex, clef: change.clef });
      clefBefore.set(index, entry);
    }
  });
  const columns: HorizontalColumn[] = [];
  elementColumns.forEach((column, i) => {
    const change = clefBefore.get(i);
    if (change) columns.push(clefColumn(fonts, change.clefs, change.tick, ROD_PADDING, ctx));
    columns.push(column);
  });
  const trailing: StaffClef[] = [];
  stack.forEach((measure, staffIndex) => {
    if (measure.trailingClef) trailing.push({ staffIndex, clef: measure.trailingClef });
  });
  if (ctx.trailingClefs && trailing.length > 0) {
    columns.push(clefColumn(fonts, trailing, ctx.endTick - ctx.startTick, 0, ctx));
  }
  return columns;
}

function clefColumn(
  fonts: FontContext,
  clefs: readonly StaffClef[],
  measureTick: number,
  gap: number,
  ctx: ColumnContext,
): HorizontalColumn {
  const glyphWidth = Math.max(...clefs.map((c) => fonts.advanceWidth(clefChangeGlyph(c.clef))));
  return {
    staffIndex: clefs[0]!.staffIndex,
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
    clefs,
  };
}

function chromeOf(
  fonts: FontContext,
  stack: readonly NormalizedMeasure[],
  previousStack: readonly NormalizedMeasure[] | undefined,
  atSystemStart: boolean,
  changes: ChangeOptions,
): MeasureChrome {
  const measure = stack[0]!;
  const previous = previousStack?.[0];
  const keyChanged = !previous || measure.key.fifths !== previous.key.fifths;
  const timeChanged = !previous || !timeEquals(measure.time, previous.time);
  const afterCourtesy = atSystemStart && previous !== undefined && (keyChanged || timeChanged);

  const staffClefs = stack.map((_, s) => {
    const clefAtBarline = changes.clefAtBarline === 'after' && previousStack?.[s]?.trailingClef !== undefined;
    return atSystemStart || !previous || clefAtBarline;
  });
  const showClef = staffClefs.some(Boolean);
  const showKey = afterCourtesy ? measure.key.fifths !== 0 : (atSystemStart && measure.key.fifths !== 0) || keyChanged;
  const showTime = timeChanged && (!afterCourtesy || changes.restateTimeAfterCourtesy);
  const cancelKey =
    keyChanged && previous && !afterCourtesy ? cancellation(previous.key, measure.key, changes.cancelNaturals) : null;

  const widths = {
    clefWidth: showClef
      ? Math.max(...stack.filter((_, s) => staffClefs[s]).map((m) => fonts.advanceWidth(clefGlyph(m.clef)))) +
        CHROME_GAP
      : 0,
    keyWidth:
      showKey || cancelKey ? Math.max(...stack.map((m) => keyWidthOf(fonts, m.key, m.clef, cancelKey, showKey))) : 0,
    timeWidth: showTime ? timeWidthOf(fonts, measure.time) : 0,
    startBarlineWidth: measure.barlineStart === 'repeat-start' ? repeatStartWidth(fonts) : 0,
  };
  const bare =
    widths.clefWidth === 0 && widths.keyWidth === 0 && widths.timeWidth === 0 && widths.startBarlineWidth === 0;

  return {
    showClef,
    staffClefs,
    showKey,
    showTime,
    ...widths,
    endBarlineWidth: endBarlineWidth(fonts, measure.barlineEnd),
    leadWidth: bare ? MEASURE_LEAD : 0,
    cancelKey,
  };
}

function courtesyOf(
  fonts: FontContext,
  stack: readonly NormalizedMeasure[],
  nextStack: readonly NormalizedMeasure[],
  changes: ChangeOptions,
): Courtesy | null {
  const measure = stack[0]!;
  const next = nextStack[0]!;
  const staffClefs = stack.map((m) => changes.clefAtBarline === 'after' && m.trailingClef !== undefined);
  const showClef = staffClefs.some(Boolean);
  const showKey = next.key.fifths !== measure.key.fifths;
  const showTime = !timeEquals(next.time, measure.time);
  if (!showClef && !showKey && !showTime) return null;
  const clefWidth = showClef
    ? Math.max(...nextStack.filter((_, s) => staffClefs[s]).map((m) => fonts.advanceWidth(clefChangeGlyph(m.clef)))) +
      CHROME_GAP
    : 0;
  const cancelKey = showKey ? cancellation(measure.key, next.key, changes.cancelNaturals) : null;
  const keyWidth = showKey ? Math.max(...nextStack.map((m) => keyWidthOf(fonts, m.key, m.clef, cancelKey, true))) : 0;
  const timeWidth = showTime ? timeWidthOf(fonts, next.time) : 0;
  return {
    key: next.key,
    clef: next.clef,
    showClef,
    clefWidth,
    cancelKey,
    showKey,
    time: next.time,
    showTime,
    keyWidth,
    width: COURTESY_LEAD + clefWidth + keyWidth + timeWidth,
    staves: nextStack.map((m, s) => ({ clef: m.clef, showClef: staffClefs[s]! })),
  };
}

function timeEquals(a: TimeSpec, b: TimeSpec): boolean {
  return a.beats === b.beats && a.beatType === b.beatType && (a.symbol ?? 'normal') === (b.symbol ?? 'normal');
}

function cancellation(from: KeySpec, to: KeySpec, mode: ChangeOptions['cancelNaturals']): KeySpec | null {
  const sameSide = Math.sign(from.fifths) === Math.sign(to.fifths);
  if (mode === 'same-type-only' && !sameSide && to.fifths !== 0) return null;
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
  naturals.forEach((acc, i) => {
    glyphs.push({ glyph: acc.glyph, x, y: acc.y });
    x += fonts.advanceWidth(acc.glyph) + (i === naturals.length - 1 && accidentals.length > 0 ? CANCEL_GAP : KEY_GAP);
  });
  for (const acc of accidentals) {
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

export function contentWidthOf(columns: readonly HorizontalColumn[]): number {
  const elementWidth = columns.reduce((sum, c) => (isClefColumn(c) ? sum : sum + c.width), 0);
  const clefWidth = columns.reduce((sum, c) => (isClefColumn(c) ? sum + c.width : sum), 0);
  return (elementWidth || MIN_MEASURE_CONTENT) + clefWidth;
}

export function isClefColumn<T extends HorizontalColumn>(column: T): column is T & { clefs: readonly StaffClef[] } {
  return column.clefs !== undefined;
}
