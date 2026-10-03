import type { FontContext } from '../font/context.js';
import { wholeBarRestX } from '../query/measures.js';
import { normalHead } from './articulations.js';
import {
  BARLINE_PAD,
  CHROME_GAP,
  chromeWidth,
  contentWidthOf,
  isClefColumn,
  type HorizontalColumn,
  type HorizontalScore,
} from './horizontal.js';
import type { JustifiedScore, JustifiedSystem, PositionedColumn, PositionedMeasure } from './justify.js';
import type { StaffInk } from './margins.js';
import type { NoteId, NormalizedDynamic } from './records.js';
import type { InkBox, Skyline } from './skyline.js';
import { STAFF_HEIGHT } from './staff.js';
import type { VerticalElement } from './vertical.js';

const DYNAMIC_OFFSET_BELOW = 2.0;
const DYNAMIC_OFFSET_ABOVE = 1.0;
const HAIRPIN_OFFSET = 1.75;
const DYNAMIC_MIN_DISTANCE = 0.5;
const HAIRPIN_MIN_DISTANCE = 0.7;
const HAIRPIN_HEIGHT = 1.15;
const HAIRPIN_CONTINUATION_HEIGHT = 0.5;
const HAIRPIN_DYNAMIC_GAP = 0.5;
const HAIRPIN_END_GAP = 1.0;
const HAIRPIN_EXTEND_THRESHOLD = 3.0;
const HAIRPIN_MIN_LENGTH = 1.0;
const LINE_START_DISTANCE = 1.0;
const LINE_END_DISTANCE = 0.25;
const BARLINE_CLEARANCE = 0.25;
const DYNAMIC_GAP = HAIRPIN_DYNAMIC_GAP;

const LETTERS: Readonly<Record<string, string>> = {
  p: 'dynamicPiano',
  m: 'dynamicMezzo',
  f: 'dynamicForte',
  r: 'dynamicRinforzando',
  s: 'dynamicSforzando',
  z: 'dynamicZ',
  n: 'dynamicNiente',
};

const PRECOMPOSED: ReadonlyMap<string, string> = new Map([
  ['pppppp', 'dynamicPPPPPP'],
  ['ppppp', 'dynamicPPPPP'],
  ['pppp', 'dynamicPPPP'],
  ['ppp', 'dynamicPPP'],
  ['pp', 'dynamicPP'],
  ['mp', 'dynamicMP'],
  ['mf', 'dynamicMF'],
  ['pf', 'dynamicPF'],
  ['ff', 'dynamicFF'],
  ['fff', 'dynamicFFF'],
  ['ffff', 'dynamicFFFF'],
  ['fffff', 'dynamicFFFFF'],
  ['ffffff', 'dynamicFFFFFF'],
  ['fp', 'dynamicFortePiano'],
  ['fz', 'dynamicForzando'],
  ['sf', 'dynamicSforzando1'],
  ['sfp', 'dynamicSforzandoPiano'],
  ['sfpp', 'dynamicSforzandoPianissimo'],
  ['sfz', 'dynamicSforzato'],
  ['sfzp', 'dynamicSforzatoPiano'],
  ['sffz', 'dynamicSforzatoFF'],
  ['rf', 'dynamicRinforzando1'],
  ['rfz', 'dynamicRinforzando2'],
]);

export interface DynamicGlyph {
  systemIndex: number;
  staffIndex: number;
  glyph: string;
  x: number;
  y: number;
  el: NoteId;
}

export interface HairpinShape {
  systemIndex: number;
  staffIndex: number;
  d: string;
  el: NoteId;
}

export interface DynamicsResult {
  glyphs: readonly DynamicGlyph[];
  hairpins: readonly HairpinShape[];
  outer: readonly StaffInk[];
  staffOffsets: readonly number[];
}

type Anchor = { side: 'above' | 'below'; staffIndex: number } | { side: 'between' };

interface TextItem {
  el: NoteId;
  tick: number;
  glyphs: readonly { glyph: string; dx: number }[];
  x: number;
  ink: { x0: number; x1: number; ascent: number; descent: number };
}

interface HairpinItem {
  el: NoteId;
  x0: number;
  x1: number;
  h0: number;
  h1: number;
}

interface Group {
  systemIndex: number;
  anchor: Anchor;
  texts: TextItem[];
  hairpins: HairpinItem[];
}

interface Constraint {
  lower: number;
  upper: number;
}

interface SpacedText {
  key: string;
  tick: number;
  measure: number;
  column: number;
  left: number;
  right: number;
}

export function spaceDynamics(
  score: HorizontalScore,
  marks: readonly NormalizedDynamic[],
  staffCount: number,
  fonts: FontContext,
): HorizontalScore {
  if (!marks.some((m) => m.text !== undefined)) return score;
  const measures = score.measures.map((m) => ({ ...m, columns: m.columns.map((c) => ({ ...c })) }));
  const texts: SpacedText[] = [];
  for (const mark of marks) {
    if (mark.text === undefined) continue;
    const measure = measures.findIndex((m) => m.startTick <= mark.tick && mark.tick < m.endTick);
    const column = measures[measure]?.columns.findIndex((c) => !isClefColumn(c) && c.tick === mark.tick) ?? -1;
    if (column < 0) continue;
    const center = centerOffset(measures[measure]!.columns[column]!, fonts);
    if (center === undefined) continue;
    const text = composeText(mark.text, fonts);
    const anchor = anchorOf(mark, staffCount);
    texts.push({
      key: anchorKey(anchor),
      tick: mark.tick,
      measure,
      column,
      left: center - text.opticalCenter + text.ink.x0,
      right: center - text.opticalCenter + text.ink.x1,
    });
  }
  texts.sort((a, b) => a.tick - b.tick);
  for (let i = 0; i < texts.length; i += 1) {
    const a = texts[i]!;
    const b = texts.slice(i + 1).find((t) => t.key === a.key && t.tick > a.tick);
    if (!b || b.measure > a.measure + 1) continue;
    const from = measures[a.measure]!;
    const tail = from.columns.slice(a.column, b.measure === a.measure ? b.column : undefined);
    const between =
      b.measure === a.measure
        ? 0
        : from.midChrome.endBarlineWidth +
          chromeWidth(measures[b.measure]!.midChrome) +
          measures[b.measure]!.columns.slice(0, b.column).reduce((sum, c) => sum + c.width, 0);
    const available = tail.reduce((sum, c) => sum + c.width, 0) + between;
    const deficit = a.right + DYNAMIC_GAP - b.left - available;
    const share = tail.filter((c) => c.graceIndex === undefined).reduce((sum, c) => sum + c.width, 0);
    if (deficit <= 0 || share <= 0) continue;
    for (const column of tail) {
      if (column.graceIndex !== undefined) continue;
      const extra = (deficit * column.width) / share;
      column.width += extra;
      column.rodWidth += extra;
    }
  }
  return { ...score, measures: measures.map((m) => ({ ...m, contentWidth: contentWidthOf(m.columns) })) };
}

function centerOffset(column: HorizontalColumn, fonts: FontContext): number | undefined {
  const el =
    column.elements.find((e) => e.noteheads.length > 0) ?? column.elements.find((e) => e.rest && !e.rest.wholeBar);
  if (!el) return undefined;
  if (el.rest) {
    const { bBoxNE, bBoxSW } = fonts.bbox(el.rest.glyph);
    return (bBoxNE[0] + bBoxSW[0]) / 2;
  }
  const head = normalHead(el);
  return head.dx + head.width / 2;
}

export function dynamics(
  justified: JustifiedScore,
  marks: readonly NormalizedDynamic[],
  sky: Skyline,
  baseOffsets: readonly number[],
  fonts: FontContext,
): DynamicsResult {
  const staffCount = baseOffsets.length;
  const groups = new Map<string, Group>();
  const groupOf = (systemIndex: number, anchor: Anchor): Group => {
    const key = `${systemIndex}:${anchorKey(anchor)}`;
    let group = groups.get(key);
    if (!group) {
      group = { systemIndex, anchor, texts: [], hairpins: [] };
      groups.set(key, group);
    }
    return group;
  };

  for (const mark of marks) {
    if (mark.text === undefined) continue;
    const anchor = anchorOf(mark, staffCount);
    const system = systemAt(justified, mark.tick, 'start');
    if (!system) continue;
    const at = pointAt(system, mark.tick, preferredStaff(mark, anchor), fonts);
    const text = composeText(mark.text, fonts);
    const centered = at.center - text.opticalCenter;
    groupOf(system.index, anchor).texts.push({
      el: mark.id,
      tick: mark.tick,
      glyphs: text.glyphs,
      x: anchor.side === 'between' ? clearOfBarlines(centered, text.ink, measureAt(system, mark.tick)) : centered,
      ink: text.ink,
    });
  }

  for (const mark of marks) {
    if (!mark.hairpin) continue;
    const anchor = anchorOf(mark, staffCount);
    const first = systemAt(justified, mark.tick, 'start');
    const last = systemAt(justified, mark.hairpin.endTick, 'end');
    if (!first || !last) continue;
    const staff = preferredStaff(mark, anchor);
    const closing = mark.hairpin.wedge === 'decreasing';
    for (let s = first.index; s <= last.index; s += 1) {
      const system = justified.systems[s]!;
      const group = groupOf(s, anchor);
      const begins = s === first.index;
      const ends = s === last.index;
      let x0 = begins ? pointAt(system, mark.tick, staff, fonts).left : lineStart(system);
      if (begins) {
        const before = group.texts.find((t) => t.tick === mark.tick);
        if (before) x0 = Math.max(x0, before.x + before.ink.x1 + HAIRPIN_DYNAMIC_GAP);
      }
      let x1 = ends ? hairpinEnd(system, mark.hairpin.endTick, staff, fonts) : lineEnd(system);
      if (ends) {
        const after = group.texts.find((t) => t.tick === mark.hairpin!.endTick);
        if (after) {
          const limit = after.x + after.ink.x0 - HAIRPIN_DYNAMIC_GAP;
          if (limit < x1 || limit - x1 > HAIRPIN_EXTEND_THRESHOLD) x1 = limit;
        }
      }
      x1 = Math.max(x1, x0 + HAIRPIN_MIN_LENGTH);
      const open = HAIRPIN_HEIGHT;
      const partial = HAIRPIN_CONTINUATION_HEIGHT;
      const [h0, h1] = closing ? [open, ends ? 0 : partial] : [begins ? 0 : partial, open];
      group.hairpins.push({ el: mark.id, x0, x1, h0, h1 });
    }
  }

  const thickness = fonts.engravingDefaults.hairpinThickness;
  const xHeightMiddle = middleOfXHeight(fonts);
  const constraints = [...groups.values()].map((group) => constrain(group, sky, thickness, xHeightMiddle));
  let between = baseOffsets[1] ?? 0;
  [...groups.values()].forEach((group, i) => {
    if (group.anchor.side === 'between') between = Math.max(between, constraints[i]!.lower - constraints[i]!.upper);
  });
  const staffOffsets = staffCount > 1 ? [0, between] : [...baseOffsets];

  const glyphs: DynamicGlyph[] = [];
  const hairpins: HairpinShape[] = [];
  const outer: StaffInk[] = [];
  [...groups.values()].forEach((group, i) => {
    const { lower, upper } = constraints[i]!;
    const { anchor, systemIndex } = group;
    const staffIndex = anchor.side === 'between' ? 0 : anchor.staffIndex;
    const line = anchor.side === 'between' ? (lower + between + upper) / 2 : anchor.side === 'below' ? lower : upper;
    const baseline = line + xHeightMiddle;
    for (const text of group.texts) {
      for (const { glyph, dx } of text.glyphs) {
        glyphs.push({ systemIndex, staffIndex, glyph, x: text.x + dx, y: baseline, el: text.el });
      }
      if (anchor.side !== 'between') {
        outer.push({
          staffIndex,
          box: {
            x0: text.x + text.ink.x0,
            x1: text.x + text.ink.x1,
            y0: baseline - text.ink.ascent,
            y1: baseline + text.ink.descent,
          },
        });
      }
    }
    for (const hairpin of group.hairpins) {
      hairpins.push({ systemIndex, staffIndex, d: hairpinPath(hairpin, line, thickness), el: hairpin.el });
      if (anchor.side !== 'between') {
        const half = Math.max(hairpin.h0, hairpin.h1) / 2 + thickness / 2;
        outer.push({ staffIndex, box: { x0: hairpin.x0, x1: hairpin.x1, y0: line - half, y1: line + half } });
      }
    }
  });
  return { glyphs, hairpins, outer, staffOffsets };
}

function anchorKey(anchor: Anchor): string {
  return 'staffIndex' in anchor ? `${anchor.side}:${anchor.staffIndex}` : anchor.side;
}

function anchorOf(mark: NormalizedDynamic, staffCount: number): Anchor {
  const last = staffCount - 1;
  if (staffCount === 1)
    return mark.placement === 'above' ? { side: 'above', staffIndex: 0 } : { side: 'below', staffIndex: 0 };
  if (mark.placement === 'above' && (mark.staffIndex ?? 0) === 0) return { side: 'above', staffIndex: 0 };
  if (mark.placement === 'below' && (mark.staffIndex ?? last) === last) return { side: 'below', staffIndex: last };
  return { side: 'between' };
}

function preferredStaff(mark: NormalizedDynamic, anchor: Anchor): number | undefined {
  return mark.staffIndex ?? ('staffIndex' in anchor ? anchor.staffIndex : undefined);
}

function systemAt(justified: JustifiedScore, tick: number, edge: 'start' | 'end'): JustifiedSystem | undefined {
  return justified.systems.find((system) =>
    system.measures.some((m) =>
      edge === 'start' ? m.startTick <= tick && tick < m.endTick : m.startTick < tick && tick <= m.endTick,
    ),
  );
}

function measureAt(system: JustifiedSystem, tick: number): PositionedMeasure {
  return (
    system.measures.find((m) => m.startTick <= tick && tick < m.endTick) ?? system.measures[system.measures.length - 1]!
  );
}

function clearOfBarlines(x: number, ink: TextItem['ink'], measure: PositionedMeasure): number {
  const barline = Math.max(0, measure.chrome.endBarlineWidth - BARLINE_PAD);
  const right = measure.x + measure.width - barline - BARLINE_CLEARANCE;
  const shifted = Math.min(x, right - ink.x1);
  return Math.max(shifted, measure.x + BARLINE_CLEARANCE - ink.x0);
}

interface TickPoint {
  left: number;
  center: number;
}

function pointAt(system: JustifiedSystem, tick: number, staffIndex: number | undefined, fonts: FontContext): TickPoint {
  const measure = measureAt(system, tick);
  const columns = measure.columns.filter((c) => !isClefColumn(c));
  const exact = columns.find((c) => c.tick === tick);
  if (exact) {
    const el =
      exact.elements.find((e) => e.staffIndex === staffIndex && e.noteheads.length > 0) ??
      exact.elements.find((e) => e.staffIndex === staffIndex) ??
      exact.elements.find((e) => e.noteheads.length > 0) ??
      exact.elements[0];
    if (el) return elementPoint(el, exact, measure, fonts);
  }
  const before = [...columns].reverse().find((c) => c.tick < tick);
  const after = columns.find((c) => c.tick > tick);
  const right = measure.x + measure.width - measure.chrome.endBarlineWidth;
  const [t0, x0] = before ? [before.tick, before.x] : [measure.startTick, columns[0]?.xStart ?? measure.x];
  const [t1, x1] = after ? [after.tick, after.x] : [measure.endTick, right];
  const x = t1 > t0 ? x0 + ((x1 - x0) * (tick - t0)) / (t1 - t0) : x0;
  return { left: x, center: x };
}

function elementPoint(
  el: VerticalElement,
  column: PositionedColumn,
  measure: PositionedMeasure,
  fonts: FontContext,
): TickPoint {
  if (el.rest) {
    const x = el.rest.wholeBar ? wholeBarRestX(measure, el.rest.width) : column.x;
    const { bBoxNE, bBoxSW } = fonts.bbox(el.rest.glyph);
    return { left: x + bBoxSW[0], center: x + (bBoxNE[0] + bBoxSW[0]) / 2 };
  }
  const head = normalHead(el);
  return { left: column.x + head.dx, center: column.x + head.dx + head.width / 2 };
}

function hairpinEnd(system: JustifiedSystem, tick: number, staffIndex: number | undefined, fonts: FontContext): number {
  const lastMeasure = system.measures[system.measures.length - 1]!;
  if (tick >= lastMeasure.endTick) return lineEnd(system);
  const exact = system.measures.flatMap((m) => m.columns).some((c) => !isClefColumn(c) && c.tick === tick);
  const point = pointAt(system, tick, staffIndex, fonts);
  return exact ? point.left - HAIRPIN_END_GAP : point.left;
}

function lineEnd(system: JustifiedSystem): number {
  const measure = system.measures[system.measures.length - 1]!;
  const barline = Math.max(0, measure.chrome.endBarlineWidth - BARLINE_PAD);
  return measure.x + measure.width - barline - LINE_END_DISTANCE;
}

function lineStart(system: JustifiedSystem): number {
  const measure = system.measures[0]!;
  const { chrome } = measure;
  const header = chrome.clefWidth + chrome.keyWidth + chrome.timeWidth > 0 ? CHROME_GAP : 0;
  const headerRight = measure.x + chromeWidth(chrome) - header;
  const firstNote = measure.columns.find((c) => !isClefColumn(c))?.x ?? headerRight + LINE_START_DISTANCE;
  return Math.min(headerRight + LINE_START_DISTANCE, firstNote);
}

function composeText(
  text: string,
  fonts: FontContext,
): {
  glyphs: { glyph: string; dx: number }[];
  opticalCenter: number;
  ink: TextItem['ink'];
} {
  const glyphs: { glyph: string; dx: number }[] = [];
  let dx = 0;
  for (let i = 0; i < text.length;) {
    let taken = 1;
    let glyph = LETTERS[text[i]!];
    for (let n = text.length - i; n > 1; n -= 1) {
      const candidate = PRECOMPOSED.get(text.slice(i, i + n));
      if (candidate && fonts.resolveGlyph(candidate)) {
        glyph = candidate;
        taken = n;
        break;
      }
    }
    if (glyph) {
      glyphs.push({ glyph, dx });
      dx += fonts.advanceWidth(glyph);
    }
    i += taken;
  }
  const centerOf = ({ glyph, dx: offset }: { glyph: string; dx: number }): number => {
    const { bBoxNE, bBoxSW } = fonts.bbox(glyph);
    return offset + (fonts.anchor(glyph, 'opticalCenter')?.[0] ?? (bBoxNE[0] + bBoxSW[0]) / 2);
  };
  const first = glyphs[0];
  const last = glyphs[glyphs.length - 1];
  const boxes = glyphs.map(({ glyph, dx: offset }) => {
    const { bBoxNE, bBoxSW } = fonts.bbox(glyph);
    return { x0: offset + bBoxSW[0], x1: offset + bBoxNE[0], ascent: bBoxNE[1], descent: -bBoxSW[1] };
  });
  return {
    glyphs,
    opticalCenter: first && last ? (centerOf(first) + centerOf(last)) / 2 : 0,
    ink: {
      x0: Math.min(0, ...boxes.map((b) => b.x0)),
      x1: Math.max(0, ...boxes.map((b) => b.x1)),
      ascent: Math.max(0, ...boxes.map((b) => b.ascent)),
      descent: Math.max(0, ...boxes.map((b) => b.descent)),
    },
  };
}

function middleOfXHeight(fonts: FontContext): number {
  const { bBoxNE, bBoxSW } = fonts.bbox(LETTERS.m!);
  return (bBoxNE[1] + bBoxSW[1]) / 2;
}

function constrain(group: Group, sky: Skyline, thickness: number, xHeightMiddle: number): Constraint {
  const { systemIndex, anchor } = group;
  const upperStaff = anchor.side === 'between' ? 0 : anchor.staffIndex;
  const lowerStaff = anchor.side === 'between' ? 1 : anchor.staffIndex;
  const lowerBounds: number[] = [];
  const upperBounds: number[] = [];
  if (anchor.side === 'below') {
    if (group.texts.length > 0) lowerBounds.push(STAFF_HEIGHT + DYNAMIC_OFFSET_BELOW - xHeightMiddle);
    if (group.hairpins.length > 0) lowerBounds.push(STAFF_HEIGHT + HAIRPIN_OFFSET);
  }
  if (anchor.side === 'above') {
    if (group.texts.length > 0) upperBounds.push(-DYNAMIC_OFFSET_ABOVE - xHeightMiddle);
    if (group.hairpins.length > 0) upperBounds.push(-HAIRPIN_OFFSET);
  }
  for (const text of group.texts) {
    const x0 = text.x + text.ink.x0;
    const x1 = text.x + text.ink.x1;
    if (anchor.side !== 'above') {
      const ascent = text.ink.ascent - xHeightMiddle;
      lowerBounds.push(sky.bottom(systemIndex, upperStaff, x0, x1) + DYNAMIC_MIN_DISTANCE + ascent);
    }
    if (anchor.side !== 'below') {
      const descent = text.ink.descent + xHeightMiddle;
      upperBounds.push(sky.top(systemIndex, lowerStaff, x0, x1) - DYNAMIC_MIN_DISTANCE - descent);
    }
  }
  for (const hairpin of group.hairpins) {
    const reach = (box: InkBox): number => halfHeightOver(hairpin, box) + thickness / 2;
    if (anchor.side !== 'above') {
      lowerBounds.push(STAFF_HEIGHT + HAIRPIN_MIN_DISTANCE + reach(fullSpan(hairpin)));
      for (const box of sky.boxes(systemIndex, upperStaff, hairpin.x0, hairpin.x1)) {
        lowerBounds.push(box.y1 + HAIRPIN_MIN_DISTANCE + reach(box));
      }
    }
    if (anchor.side !== 'below') {
      upperBounds.push(-HAIRPIN_MIN_DISTANCE - reach(fullSpan(hairpin)));
      for (const box of sky.boxes(systemIndex, lowerStaff, hairpin.x0, hairpin.x1)) {
        upperBounds.push(box.y0 - HAIRPIN_MIN_DISTANCE - reach(box));
      }
    }
  }
  return { lower: Math.max(...lowerBounds), upper: Math.min(...upperBounds) };
}

function fullSpan(hairpin: HairpinItem): InkBox {
  return { x0: hairpin.x0, x1: hairpin.x1, y0: 0, y1: 0 };
}

function halfHeightOver(hairpin: HairpinItem, box: InkBox): number {
  const at = (x: number): number => {
    const t = Math.min(1, Math.max(0, (x - hairpin.x0) / (hairpin.x1 - hairpin.x0)));
    return (hairpin.h0 + (hairpin.h1 - hairpin.h0) * t) / 2;
  };
  return Math.max(at(Math.max(box.x0, hairpin.x0)), at(Math.min(box.x1, hairpin.x1)));
}

type Point = readonly [number, number];

function hairpinPath(hairpin: HairpinItem, line: number, thickness: number): string {
  const { x0, x1, h0, h1 } = hairpin;
  const upper: [Point, Point] = [
    [x0, line - h0 / 2],
    [x1, line - h1 / 2],
  ];
  const lower: [Point, Point] = [
    [x0, line + h0 / 2],
    [x1, line + h1 / 2],
  ];
  if (h0 === 0) return polygon(wedge(upper[0], upper[1], lower[1], thickness));
  if (h1 === 0) return polygon(wedge(upper[1], upper[0], lower[0], thickness));
  return `${polygon(stroke(upper[0], upper[1], thickness))} ${polygon(stroke(lower[0], lower[1], thickness))}`;
}

function normalOf(from: Point, to: Point, length: number): Point {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const norm = Math.hypot(dx, dy) || 1;
  return [(-dy / norm) * length, (dx / norm) * length];
}

function offset(p: Point, n: Point, sign: 1 | -1): Point {
  return [p[0] + sign * n[0], p[1] + sign * n[1]];
}

function stroke(from: Point, to: Point, thickness: number): Point[] {
  const n = normalOf(from, to, thickness / 2);
  return [offset(from, n, 1), offset(to, n, 1), offset(to, n, -1), offset(from, n, -1)];
}

function wedge(tip: Point, upperEnd: Point, lowerEnd: Point, thickness: number): Point[] {
  const nUpper = normalOf(tip, upperEnd, thickness / 2);
  const nLower = normalOf(tip, lowerEnd, thickness / 2);
  const outwardUpper: 1 | -1 = offset(tip, nUpper, 1)[1] < tip[1] ? 1 : -1;
  const outwardLower: 1 | -1 = offset(tip, nLower, 1)[1] > tip[1] ? 1 : -1;
  const inwardUpper = -outwardUpper as 1 | -1;
  const inwardLower = -outwardLower as 1 | -1;
  const inner = intersect(
    offset(tip, nUpper, inwardUpper),
    offset(upperEnd, nUpper, inwardUpper),
    offset(tip, nLower, inwardLower),
    offset(lowerEnd, nLower, inwardLower),
  );
  return [
    offset(upperEnd, nUpper, outwardUpper),
    offset(tip, nUpper, outwardUpper),
    offset(tip, nLower, outwardLower),
    offset(lowerEnd, nLower, outwardLower),
    offset(lowerEnd, nLower, inwardLower),
    inner,
    offset(upperEnd, nUpper, inwardUpper),
  ];
}

function intersect(a: Point, aTo: Point, b: Point, bTo: Point): Point {
  const d1: Point = [aTo[0] - a[0], aTo[1] - a[1]];
  const d2: Point = [bTo[0] - b[0], bTo[1] - b[1]];
  const cross = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(cross) < 1e-12) return a;
  const t = ((b[0] - a[0]) * d2[1] - (b[1] - a[1]) * d2[0]) / cross;
  return [a[0] + d1[0] * t, a[1] + d1[1] * t];
}

function polygon(points: readonly Point[]): string {
  const f = (n: number): string => n.toFixed(3);
  return `${points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${f(x)},${f(y)}`).join(' ')} Z`;
}
