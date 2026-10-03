import type { ArticulationKind } from '@polyhymnia/mnx-score';
import type { FontContext } from '../font/context.js';
import type { BeamsResult } from './beams.js';
import type { CurvesResult } from './curves.js';
import { isClefColumn } from './horizontal.js';
import type { JustifiedScore } from './justify.js';
import type { ArticulationSpec, EventEngraving, NoteId } from './records.js';
import { curvePoints, glyphBox, polylineYs, type InkBox } from './skyline.js';
import { STAFF_HEIGHT } from './staff.js';
import { stemX, type NoteheadLayout, type VerticalElement } from './vertical.js';

const HEAD_DISTANCE = 0.4;
const STEM_DISTANCE = 0.4;
const STAFF_DISTANCE = 0.4;
const MIN_DISTANCE = 0.4;
const ACCENT_KERN = 0.2;
const STAFF_SPACES = 2 * STAFF_HEIGHT;

const GLYPHS: Record<ArticulationKind, readonly [string, string]> = {
  staccato: ['articStaccatoAbove', 'articStaccatoBelow'],
  staccatissimo: ['articStaccatissimoAbove', 'articStaccatissimoBelow'],
  tenuto: ['articTenutoAbove', 'articTenutoBelow'],
  accent: ['articAccentAbove', 'articAccentBelow'],
  strongAccent: ['articMarcatoAbove', 'articMarcatoBelow'],
  softAccent: ['articSoftAccentAbove', 'articSoftAccentBelow'],
  stress: ['articStressAbove', 'articStressBelow'],
  unstress: ['articUnstressAbove', 'articUnstressBelow'],
};

const STACKING: readonly ArticulationKind[] = [
  'staccato',
  'tenuto',
  'staccatissimo',
  'accent',
  'strongAccent',
  'softAccent',
  'stress',
  'unstress',
];
const CLOSE = new Set<ArticulationKind>(['staccato', 'tenuto']);
const INSIDE_SLURS = new Set<ArticulationKind>(['staccato', 'tenuto', 'staccatissimo']);
const BASIC = new Set<ArticulationKind>(['staccato', 'tenuto', 'accent', 'strongAccent']);

export interface Mark {
  el: NoteId;
  systemIndex: number;
  staffIndex: number;
  glyph: string;
  cls: 'articulation' | 'fermata';
  x: number;
  y: number;
  box: InkBox;
  above: boolean;
  insideSlurs: boolean;
}

export interface ChordFrame {
  el: VerticalElement;
  systemIndex: number;
  up: boolean;
  headTop: number;
  headBottom: number;
  stem?: { top: number; bottom: number; centerX: number; beamed: boolean };
  centerX: number;
}

export function chordFrame(
  el: VerticalElement,
  x: number,
  systemIndex: number,
  beams: BeamsResult,
  fonts: FontContext,
): ChordFrame {
  const positions = el.noteheads.map((h) => h.staffPosition);
  const up = el.dir === 1;
  const normal = normalHead(el);
  const frame: ChordFrame = {
    el,
    systemIndex,
    up,
    headTop: Math.min(...positions),
    headBottom: Math.max(...positions),
    centerX: x + normal.dx + normal.width / 2,
  };
  const stem = el.stem;
  if (!stem?.drawn) return frame;
  const override = beams.stemOverrides.get(el.id);
  let top = override?.yTop ?? stem.yTop;
  let bottom = override?.yBottom ?? stem.yBottom;
  if (stem.flag) {
    const flag = glyphBox(fonts, stem.flag.glyph, stemX(x, stem), stem.flag.y);
    top = Math.min(top, flag.y0);
    bottom = Math.max(bottom, flag.y1);
  }
  return { ...frame, stem: { top, bottom, centerX: stemX(x, stem) + stem.width / 2, beamed: override !== undefined } };
}

export function normalHead(el: VerticalElement): NoteheadLayout {
  const dxs = el.noteheads.map((h) => h.dx);
  const normalDx = el.dir === 1 ? Math.min(...dxs) : Math.max(...dxs);
  return el.noteheads.find((h) => h.dx === normalDx) ?? el.noteheads[0]!;
}

export function placeMark(
  fonts: FontContext,
  glyph: string,
  cx: number,
  edge: { top: number } | { bottom: number } | { center: number },
): { x: number; y: number; box: InkBox } {
  const { bBoxNE, bBoxSW } = fonts.bbox(glyph);
  const x = cx - (bBoxNE[0] + bBoxSW[0]) / 2;
  const y =
    'top' in edge
      ? edge.top + bBoxNE[1]
      : 'bottom' in edge
        ? edge.bottom + bBoxSW[1]
        : edge.center + (bBoxNE[1] + bBoxSW[1]) / 2;
  return { x, y, box: glyphBox(fonts, glyph, x, y) };
}

export function twoVoiceKeys(justified: JustifiedScore): Set<string> {
  const keys = new Set<string>();
  for (const system of justified.systems) {
    for (const measure of system.measures) {
      for (const column of measure.columns) {
        for (const el of column.elements) if (el.voice === 1) keys.add(`${el.staffIndex}:${el.measureIndex}`);
      }
    }
  }
  return keys;
}

export function articulations(
  justified: JustifiedScore,
  beams: BeamsResult,
  events: ReadonlyMap<NoteId, EventEngraving>,
  fonts: FontContext,
): Mark[] {
  const twoVoice = twoVoiceKeys(justified);
  const marks: Mark[] = [];
  for (const system of justified.systems) {
    for (const measure of system.measures) {
      for (const column of measure.columns) {
        if (isClefColumn(column)) continue;
        for (const el of column.elements) {
          const specs = events.get(el.id)?.articulations;
          if (!specs || el.noteheads.length === 0) continue;
          const frame = chordFrame(el, column.x, system.index, beams, fonts);
          marks.push(...chordMarks(frame, specs, twoVoice.has(`${el.staffIndex}:${el.measureIndex}`), fonts));
        }
      }
    }
  }
  return marks;
}

function sideOf(spec: ArticulationSpec, frame: ChordFrame, twoVoice: boolean): boolean {
  if (spec.placement) return spec.placement === 'above';
  if (twoVoice) return frame.up;
  if (spec.kind === 'strongAccent') return true;
  return !frame.up;
}

function glyphOf(spec: ArticulationSpec, above: boolean): string {
  const [aboveGlyph, belowGlyph] = GLYPHS[spec.kind];
  const pointsUp = spec.pointing ? spec.pointing === 'up' : above;
  return pointsUp ? aboveGlyph : belowGlyph;
}

function chordMarks(
  frame: ChordFrame,
  specs: readonly ArticulationSpec[],
  twoVoice: boolean,
  fonts: FontContext,
): Mark[] {
  const ordered = STACKING.flatMap((kind) => specs.filter((s) => s.kind === kind)).map((spec) => ({
    spec,
    above: sideOf(spec, frame, twoVoice),
  }));
  const closeCount = ordered.filter((o) => CLOSE.has(o.spec.kind)).length;
  const staffSides = new Set(ordered.filter((o) => !CLOSE.has(o.spec.kind)).map((o) => o.above));
  const stemSideX = frame.stem ? (frame.stem.centerX + frame.centerX) / 2 : frame.centerX;
  const mark = (spec: ArticulationSpec, above: boolean, cx: number, edge: Parameters<typeof placeMark>[3]): Mark => {
    const glyph = glyphOf(spec, above);
    return {
      el: frame.el.id,
      systemIndex: frame.systemIndex,
      staffIndex: frame.el.staffIndex,
      glyph,
      cls: 'articulation',
      ...placeMark(fonts, glyph, cx, edge),
      above,
      insideSlurs: INSIDE_SLURS.has(spec.kind),
    };
  };

  const marks: Mark[] = [];
  const staccatos: Mark[] = [];
  const lastOn = (above: boolean): Mark | undefined => [...marks].reverse().find((m) => m.above === above);
  for (const { spec, above } of ordered) {
    if (!CLOSE.has(spec.kind)) continue;
    const headSide = above !== frame.up;
    const cx = headSide || !frame.stem ? frame.centerX : stemSideX;
    const previous = lastOn(above);
    const edge = previous
      ? stackedEdge(frame, previous, above, headSide)
      : closeEdge(frame, above, headSide, staffSides.has(above) ? closeCount : 0);
    const placed = mark(spec, above, cx, edge);
    marks.push(placed);
    if (spec.kind === 'staccato') staccatos.push(placed);
  }

  let chordTop =
    (frame.up && frame.stem ? frame.stem.top : frame.headTop - 0.5) - (frame.up ? STEM_DISTANCE : HEAD_DISTANCE);
  let chordBottom =
    (!frame.up && frame.stem ? frame.stem.bottom : frame.headBottom + 0.5) + (frame.up ? HEAD_DISTANCE : STEM_DISTANCE);
  for (const m of marks) {
    if (m.above) chordTop = m.box.y0 - MIN_DISTANCE;
    else chordBottom = m.box.y1 + MIN_DISTANCE;
  }
  let staffTop = Math.min(-STAFF_DISTANCE, chordTop);
  let staffBottom = Math.max(STAFF_HEIGHT + STAFF_DISTANCE, chordBottom);
  let staccato: Mark | undefined;
  for (const { spec, above } of ordered) {
    if (CLOSE.has(spec.kind)) {
      staccato = spec.kind === 'staccato' ? staccatos.find((m) => m.above === above) : undefined;
      continue;
    }
    const outside = staccato && (staccato.box.y1 <= 0 || staccato.box.y0 >= STAFF_HEIGHT);
    const kern = spec.kind === 'accent' && staccato?.above === above && outside ? ACCENT_KERN : 0;
    staccato = undefined;
    const stemSide = above === frame.up;
    const cx = stemSide && BASIC.has(spec.kind) ? stemSideX : frame.centerX;
    const placed = mark(spec, above, cx, above ? { bottom: staffTop + kern } : { top: staffBottom - kern });
    marks.push(placed);
    if (above) staffTop = placed.box.y0 - MIN_DISTANCE;
    else staffBottom = placed.box.y1 + MIN_DISTANCE;
  }
  return marks;
}

function closeEdge(
  frame: ChordFrame,
  above: boolean,
  headSide: boolean,
  keepTogether: number,
): { top: number } | { bottom: number } | { center: number } {
  if (!headSide && frame.stem) {
    const { stem } = frame;
    if (!above) {
      let line = Math.round(2 * stem.bottom + 1);
      if (line < STAFF_SPACES && line % 2 === 0) line += 1;
      if (line < STAFF_SPACES && stem.beamed && line / 2 - stem.bottom < STEM_DISTANCE) {
        line = Math.min(line + 2, STAFF_SPACES);
      }
      if (line < STAFF_SPACES) return { center: line / 2 };
      return { top: (line === STAFF_SPACES ? STAFF_HEIGHT : stem.bottom) + STEM_DISTANCE };
    }
    let line = Math.round(2 * stem.top - 1);
    if (line > 0 && line % 2 === 0) line -= 1;
    if (line > 0 && stem.beamed && stem.top - line / 2 < STEM_DISTANCE) line = Math.max(line - 2, 0);
    if (line > 0) return { center: line / 2 };
    return { bottom: (line === 0 ? 0 : stem.top) - STEM_DISTANCE };
  }
  if (!above) {
    let line = Math.max(2 * frame.headBottom, -1);
    if (keepTogether > 0) line = Math.max(line, STAFF_SPACES - (1 + keepTogether * 2));
    if (line < STAFF_SPACES - 1) return { center: ((line & ~1) + 3) / 2 };
    return { top: frame.headBottom + 0.5 + HEAD_DISTANCE };
  }
  let line = Math.min(2 * frame.headTop, STAFF_SPACES + 1);
  if (keepTogether > 0) line = Math.min(line, 1 + keepTogether * 2);
  if (line > 1) return { center: (((line + 1) & ~1) - 3) / 2 };
  return { bottom: frame.headTop - 0.5 - HEAD_DISTANCE };
}

function stackedEdge(
  frame: ChordFrame,
  previous: Mark,
  above: boolean,
  headSide: boolean,
): { top: number } | { bottom: number } | { center: number } {
  const center = (previous.box.y0 + previous.box.y1) / 2;
  if (!above) {
    const inStaff = headSide ? 2 * frame.headBottom < STAFF_SPACES - 2 : center < STAFF_HEIGHT - 0.5;
    return inStaff ? { center: center + 1 } : { top: previous.box.y1 + MIN_DISTANCE };
  }
  const inStaff = headSide ? 2 * frame.headTop > 2 : center > 0;
  return inStaff ? { center: center - 1 } : { bottom: previous.box.y0 - MIN_DISTANCE };
}

export function clearSlurs(marks: readonly Mark[], curves: CurvesResult): Mark[] {
  const settled = marks.map((m) => ({ ...m, box: { ...m.box } }));
  for (const curve of curves.shapes) {
    if (curve.cls !== 'slur' || !curve.covers) continue;
    const above = curve.dir === 1;
    const { outer } = curvePoints(curve.d);
    for (const el of curve.covers) {
      const own = settled.filter(
        (m) => m.el === el && m.above === above && m.systemIndex === curve.systemIndex && !m.insideSlurs,
      );
      for (const m of own) {
        const under = polylineYs(outer, m.box.x0, m.box.x1);
        if (under.length === 0) continue;
        const shift = above
          ? Math.max(0, m.box.y1 - (Math.min(...under) - MIN_DISTANCE))
          : Math.max(0, Math.max(...under) + MIN_DISTANCE - m.box.y0);
        if (shift === 0) continue;
        const delta = above ? -shift : shift;
        for (const other of own) {
          if (above ? other.box.y1 > m.box.y1 + 1e-9 : other.box.y0 < m.box.y0 - 1e-9) continue;
          other.y += delta;
          other.box.y0 += delta;
          other.box.y1 += delta;
        }
      }
    }
  }
  return settled;
}
