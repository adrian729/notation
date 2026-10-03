import type { FontContext } from '../font/context.js';
import type { Mark } from './articulations.js';
import type { BeamsResult } from './beams.js';
import type { CurvesResult } from './curves.js';
import type { JustifiedScore } from './justify.js';
import { PATH_POINT, type InkBox } from './skyline.js';
import { STAFF_HEIGHT } from './staff.js';
import type { TupletsResult } from './tuplets.js';

const STAFF_GAP = 6.5;
const CONTENT_PAD = 0.5;

export interface StaffInk {
  staffIndex: number;
  box: InkBox;
}

export interface StaffMargins {
  above: number;
  below: number;
}

export interface MarginsInput {
  justified: JustifiedScore;
  beams: BeamsResult;
  tuplets: TupletsResult;
  curves: CurvesResult;
  marks: readonly Mark[];
  staffCount: number;
}

export function contentMargins(input: MarginsInput, extra: readonly StaffInk[], fonts: FontContext): StaffMargins[] {
  const { justified, beams: beamsResult, tuplets: tupletsResult, curves: curvesResult, staffCount } = input;
  const minY = Array.from({ length: staffCount }, () => 0);
  const maxY = Array.from({ length: staffCount }, () => STAFF_HEIGHT);
  const extend = (staffIndex: number, lo: number, hi: number): void => {
    const s = Math.min(Math.max(0, staffIndex), staffCount - 1);
    minY[s] = Math.min(minY[s]!, lo);
    maxY[s] = Math.max(maxY[s]!, hi);
  };

  for (const system of justified.systems) {
    for (const measure of system.measures) {
      for (const column of measure.columns) {
        for (const el of column.elements) {
          for (const head of el.noteheads) {
            for (const y of head.ledgerLines) extend(el.staffIndex, y, y);
          }
          if (el.stem?.drawn) {
            const override = beamsResult.stemOverrides.get(el.id);
            extend(el.staffIndex, override?.yTop ?? el.stem.yTop, override?.yBottom ?? el.stem.yBottom);
          }
          if (el.rest) extend(el.staffIndex, el.rest.y - 1, el.rest.y + 1);
        }
      }
    }
  }

  for (const poly of beamsResult.polygons) {
    for (const [, y] of poly.points) extend(poly.staffIndex, y, y);
  }

  for (const rect of tupletsResult.brackets) extend(rect.staffIndex, rect.y, rect.y + rect.h);
  for (const numeral of tupletsResult.numerals) {
    const bbox = fonts.bbox(numeral.name);
    extend(numeral.staffIndex, numeral.y - bbox.bBoxNE[1], numeral.y - bbox.bBoxSW[1]);
  }

  for (const curve of curvesResult.shapes) {
    const [curveMin, curveMax] = pathYExtent(curve.d);
    extend(curve.staffIndex, curveMin, curveMax);
  }

  for (const { box, staffIndex } of [...input.marks, ...extra]) extend(staffIndex, box.y0, box.y1);

  return minY.map((lo, s) => ({
    above: Math.max(0, -lo) + CONTENT_PAD,
    below: Math.max(0, maxY[s]! - STAFF_HEIGHT) + CONTENT_PAD,
  }));
}

export function staffOffsetsOf(margins: readonly StaffMargins[]): number[] {
  const offsets = [0];
  for (let s = 1; s < margins.length; s += 1) {
    const gap = Math.max(STAFF_GAP, margins[s - 1]!.below + margins[s]!.above);
    offsets.push(offsets[s - 1]! + STAFF_HEIGHT + gap);
  }
  return offsets;
}

function pathYExtent(d: string): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const match of d.matchAll(PATH_POINT)) {
    const y = Number(match[2]);
    min = Math.min(min, y);
    max = Math.max(max, y);
  }
  return [Number.isFinite(min) ? min : 0, Number.isFinite(max) ? max : 0];
}
