import { GRACE_SCALE } from './records.js';
import type { FontContext } from '../font/context.js';
import { wholeBarRestX } from '../query/measures.js';
import type { BeamsResult } from './beams.js';
import type { CurvesResult } from './curves.js';
import { isClefColumn } from './horizontal.js';
import type { JustifiedScore } from './justify.js';
import type { Mark } from './articulations.js';
import { STAFF_HEIGHT } from './staff.js';
import type { TupletsResult } from './tuplets.js';
import { stemX, type VerticalElement } from './vertical.js';

export interface InkBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Skyline {
  add(systemIndex: number, staffIndex: number, box: InkBox): void;
  boxes(systemIndex: number, staffIndex: number, x0: number, x1: number): readonly InkBox[];
  top(systemIndex: number, staffIndex: number, x0: number, x1: number): number;
  bottom(systemIndex: number, staffIndex: number, x0: number, x1: number): number;
}

export interface SkylineInput {
  justified: JustifiedScore;
  beams: BeamsResult;
  tuplets: TupletsResult;
  curves: CurvesResult;
  marks: readonly Mark[];
}

const CURVE_SAMPLES = 16;
const BEAM_SLICES = 4;

export function skyline(input: SkylineInput, fonts: FontContext): Skyline {
  const byStaff = new Map<string, InkBox[]>();
  const keyOf = (systemIndex: number, staffIndex: number): string => `${systemIndex}:${staffIndex}`;
  const result: Skyline = {
    add(systemIndex, staffIndex, box) {
      const key = keyOf(systemIndex, staffIndex);
      const list = byStaff.get(key);
      if (list) list.push(box);
      else byStaff.set(key, [box]);
    },
    boxes(systemIndex, staffIndex, x0, x1) {
      return (byStaff.get(keyOf(systemIndex, staffIndex)) ?? []).filter((b) => b.x1 > x0 && b.x0 < x1);
    },
    top(systemIndex, staffIndex, x0, x1) {
      return Math.min(0, ...result.boxes(systemIndex, staffIndex, x0, x1).map((b) => b.y0));
    },
    bottom(systemIndex, staffIndex, x0, x1) {
      return Math.max(STAFF_HEIGHT, ...result.boxes(systemIndex, staffIndex, x0, x1).map((b) => b.y1));
    },
  };

  for (const system of input.justified.systems) {
    for (const measure of system.measures) {
      for (const column of measure.columns) {
        if (isClefColumn(column)) continue;
        for (const el of column.elements) {
          const x = el.rest?.wholeBar ? wholeBarRestX(measure, el.rest.width) : column.x;
          for (const box of elementBoxes(el, x, input.beams, fonts)) result.add(system.index, el.staffIndex, box);
        }
      }
    }
  }
  for (const poly of input.beams.polygons) {
    for (const box of parallelogramBoxes(poly.points)) result.add(poly.systemIndex, poly.staffIndex, box);
  }
  for (const rect of input.tuplets.brackets) {
    result.add(rect.systemIndex, rect.staffIndex, { x0: rect.x, x1: rect.x + rect.w, y0: rect.y, y1: rect.y + rect.h });
  }
  for (const numeral of input.tuplets.numerals) {
    result.add(numeral.systemIndex, numeral.staffIndex, glyphBox(fonts, numeral.name, numeral.x, numeral.y));
  }
  for (const curve of input.curves.shapes) {
    for (const box of curveBoxes(curve.d)) result.add(curve.systemIndex, curve.staffIndex, box);
  }
  for (const mark of input.marks) result.add(mark.systemIndex, mark.staffIndex, mark.box);
  return result;
}

export function glyphBox(fonts: FontContext, glyph: string, x: number, y: number, scale = 1): InkBox {
  const { bBoxNE, bBoxSW } = fonts.bbox(glyph);
  return { x0: x + bBoxSW[0] * scale, x1: x + bBoxNE[0] * scale, y0: y - bBoxNE[1] * scale, y1: y - bBoxSW[1] * scale };
}

export function elementBoxes(el: VerticalElement, x: number, beams: BeamsResult, fonts: FontContext): InkBox[] {
  const boxes: InkBox[] = [];
  const scale = el.kind === 'grace' ? GRACE_SCALE : 1;
  const { legerLineExtension, legerLineThickness } = fonts.engravingDefaults;
  for (const head of el.noteheads) {
    const headX = x + head.dx;
    boxes.push(glyphBox(fonts, head.glyph, headX, head.staffPosition, scale));
    for (const y of head.ledgerLines) {
      boxes.push({
        x0: headX - legerLineExtension * scale,
        x1: headX + head.width + legerLineExtension * scale,
        y0: y - (legerLineThickness * scale) / 2,
        y1: y + (legerLineThickness * scale) / 2,
      });
    }
    if (head.accidental)
      boxes.push(glyphBox(fonts, head.accidental.glyph, x + head.accidental.dx, head.accidental.y, scale));
    for (const dot of head.dots) boxes.push(glyphBox(fonts, 'augmentationDot', x + dot.dx, dot.y, scale));
  }
  if (el.stem?.drawn) {
    const override = beams.stemOverrides.get(el.id);
    const left = stemX(x, el.stem);
    boxes.push({
      x0: left,
      x1: left + el.stem.width,
      y0: override?.yTop ?? el.stem.yTop,
      y1: override?.yBottom ?? el.stem.yBottom,
    });
    if (el.stem.flag) boxes.push(glyphBox(fonts, el.stem.flag.glyph, left, el.stem.flag.y, scale));
  }
  if (el.rest) {
    boxes.push(glyphBox(fonts, el.rest.glyph, x, el.rest.y));
    for (const dot of el.rest.dots) boxes.push(glyphBox(fonts, 'augmentationDot', x + dot.dx, dot.y, scale));
  }
  if (el.breath) boxes.push(glyphBox(fonts, el.breath.glyph, x + el.breath.dx, el.breath.y));
  return boxes;
}

function parallelogramBoxes(points: readonly (readonly [number, number])[]): InkBox[] {
  const [[x0, y0], [x1, y1], , [, y3]] = points as readonly [number, number][];
  const away = y3! - y0!;
  const boxes: InkBox[] = [];
  for (let i = 0; i < BEAM_SLICES; i += 1) {
    const a = i / BEAM_SLICES;
    const b = (i + 1) / BEAM_SLICES;
    const ya = y0! + (y1! - y0!) * a;
    const yb = y0! + (y1! - y0!) * b;
    boxes.push({
      x0: x0! + (x1! - x0!) * a,
      x1: x0! + (x1! - x0!) * b,
      y0: Math.min(ya, yb, ya + away, yb + away),
      y1: Math.max(ya, yb, ya + away, yb + away),
    });
  }
  return boxes;
}

export const PATH_POINT = /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g;

export function curvePoints(d: string): { outer: [number, number][]; inner: [number, number][] } {
  const p = [...d.matchAll(PATH_POINT)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
  const sample = (a: number, b: number, c: number, e: number): [number, number][] =>
    Array.from({ length: CURVE_SAMPLES + 1 }, (_, i) => cubic(p[a]!, p[b]!, p[c]!, p[e]!, i / CURVE_SAMPLES));
  return { outer: sample(0, 1, 2, 3), inner: sample(4, 5, 6, 7).reverse() };
}

export function polylineYs(points: readonly (readonly [number, number])[], x0: number, x1: number): number[] {
  const ys: number[] = [];
  for (let i = 0; i + 1 < points.length; i += 1) {
    const [ax, ay] = points[i]!;
    const [bx, by] = points[i + 1]!;
    const lo = Math.max(x0, Math.min(ax, bx));
    const hi = Math.min(x1, Math.max(ax, bx));
    if (lo > hi) continue;
    const at = (x: number): number => (bx === ax ? ay : ay + ((by - ay) * (x - ax)) / (bx - ax));
    ys.push(at(lo), at(hi));
  }
  return ys;
}

function curveBoxes(d: string): InkBox[] {
  const { outer, inner } = curvePoints(d);
  const boxes: InkBox[] = [];
  for (let i = 0; i < CURVE_SAMPLES; i += 1) {
    const ys = [outer[i]![1], outer[i + 1]![1], inner[i]![1], inner[i + 1]![1]];
    const xs = [outer[i]![0], outer[i + 1]![0], inner[i]![0], inner[i + 1]![0]];
    boxes.push({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
  }
  return boxes;
}

function cubic(
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
  p3: readonly [number, number],
  t: number,
): [number, number] {
  const u = 1 - t;
  const at = (k: 0 | 1): number =>
    u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k];
  return [at(0), at(1)];
}
