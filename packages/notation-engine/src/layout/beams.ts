import { GRACE_SCALE } from './records.js';
import type { Diagnostic } from '@polyhymnia/mnx';
import type { FontContext } from '../font/context.js';
import type { JustifiedScore } from './justify.js';
import type { NormalizedBeam, NoteId } from './records.js';
import { MIDDLE_LINE } from './staff.js';
import { stemX, type VerticalElement } from './vertical.js';
import { beamInkAt, inkBeam } from './ink.js';

const MIN_STEM = 3.0;
const MAX_SLOPE = 0.25;
const MAX_RISE = 2.5;
const HOOK_LENGTH = 1.0;
const EPS = 1e-9;

export interface BeamPolygon {
  el: string;
  systemIndex: number;
  staffIndex: number;
  points: readonly [number, number][];
}

export interface BeamsResult {
  polygons: readonly BeamPolygon[];
  stemOverrides: ReadonlyMap<NoteId, { yTop: number; yBottom: number }>;
  suppressedGraceSlashes: ReadonlySet<NoteId>;
  diagnostics: readonly Diagnostic[];
}

interface Placed {
  el: VerticalElement;
  x: number;
  systemIndex: number;
}

export function beams(justified: JustifiedScore, groups: readonly NormalizedBeam[], fonts: FontContext): BeamsResult {
  const placedById = new Map<NoteId, Placed>();
  for (const system of justified.systems) {
    for (const measure of system.measures) {
      for (const column of measure.columns) {
        for (const el of column.elements) {
          placedById.set(el.id, { el, x: column.x, systemIndex: measure.systemIndex });
        }
      }
    }
  }

  const e = fonts.engravingDefaults;
  const twoVoiceMeasures = new Set<string>();
  for (const p of placedById.values()) {
    if (p.el.voice === 1) twoVoiceMeasures.add(`${p.el.staffIndex}:${p.el.measureIndex}`);
  }

  const polygons: BeamPolygon[] = [];
  const stemOverrides = new Map<NoteId, { yTop: number; yBottom: number }>();
  const diagnostics: Diagnostic[] = [];
  const suppressedGraceSlashes = new Set<NoteId>();

  for (const group of groups) {
    const noteOrder = group.elements
      .map((id) => placedById.get(id))
      .filter((p): p is Placed => p !== undefined && p.el.kind !== 'rest' && p.el.stem !== undefined);
    if (noteOrder.length < 2) continue;

    const scale = noteOrder[0]!.el.kind === 'grace' ? GRACE_SCALE : 1;
    const thickness = e.beamThickness * scale;
    const stack = (e.beamThickness + e.beamSpacing) * scale;
    const stemW = e.stemThickness * scale;
    const beamPen = e.beamStroke ? { ...e.beamStroke, wander: e.beamStroke.wander * scale } : undefined;
    const beamWander = (e.strokeWander ?? 0) * scale;
    if (scale !== 1) for (const p of noteOrder.slice(1)) suppressedGraceSlashes.add(p.el.id);
    const dir = noteOrder[0]!.el.stem!.dir;
    const tip = (p: Placed): number => (dir === 1 ? p.el.stem!.yTop : p.el.stem!.yBottom);
    const attach = (p: Placed): number => (dir === 1 ? p.el.stem!.yBottom : p.el.stem!.yTop);
    const x = (p: Placed): number => stemX(p.x, p.el.stem!);

    const first = noteOrder[0]!;
    const last = noteOrder[noteOrder.length - 1]!;
    const x0 = x(first);
    const x1 = x(last);
    const span = Math.max(EPS, x1 - x0);

    let slope = Math.abs(tip(last) - tip(first)) < EPS ? 0 : (tip(last) - tip(first)) / span;
    slope = clamp(slope, -MAX_SLOPE, MAX_SLOPE);
    const rise = clamp(slope * span, -MAX_RISE, MAX_RISE);
    slope = span > EPS ? rise / span : 0;

    const mid = (tip(first) + tip(last)) / 2;
    let yLeft = Math.round((mid - rise / 2) * 4) / 4;
    const beamYAt = (px: number): number => yLeft + slope * (px - x0);

    const levelOf = levelsOf(
      group,
      noteOrder.map((p) => p.el.id),
    );

    let shift = 0;
    for (const p of noteOrder) {
      const level = levelOf.get(p.el.id) ?? 1;
      const innerY = beamYAt(x(p)) + dir * (level - 1) * stack;
      const stemLen = dir === 1 ? attach(p) - innerY : innerY - attach(p);
      if (stemLen < MIN_STEM * scale) shift = Math.max(shift, MIN_STEM * scale - stemLen);

      if (scale === 1 && !twoVoiceMeasures.has(`${group.staffIndex}:${group.measureIndex}`)) {
        const primaryY = beamYAt(x(p));
        const reach = dir === 1 ? primaryY - MIDDLE_LINE : MIDDLE_LINE - primaryY;
        if (reach > EPS) shift = Math.max(shift, reach);
      }
    }
    yLeft -= dir * shift;

    for (const p of noteOrder) {
      let beamY = beamYAt(x(p)) - dir * thickness;
      if (beamPen || beamWander > 0) {
        // Seat both corners inside the actual outer edge, including the
        // beam's slope and its pressure changes across the stem's width.
        const outer = [x(p), x(p) + stemW / 2, x(p) + stemW].map((px) => {
          const ink = beamInkAt(px, x0, x1 + stemW, beamWander, group.id, beamPen);
          return beamYAt(px) + ink.shift - dir * thickness * ink.far;
        });
        beamY = (dir === 1 ? Math.max(...outer) : Math.min(...outer)) + dir * 0.015 * scale;
      }
      const a = attach(p);
      stemOverrides.set(p.el.id, dir === 1 ? { yTop: beamY, yBottom: a } : { yTop: a, yBottom: beamY });
    }

    const polygonStart = polygons.length;
    const xEnd = x1 + stemW;
    const at = { systemIndex: first.systemIndex, staffIndex: group.staffIndex };
    polygons.push(rectPolygon(group.id, at, x0, beamYAt(x0), xEnd, beamYAt(xEnd), thickness, dir));

    for (const seg of group.segments) {
      const iFirst = noteOrder.findIndex((p) => p.el.id === seg.first);
      const iLast = noteOrder.findIndex((p) => p.el.id === seg.last);
      if (iFirst === -1 || iLast === -1) continue;
      const offset = dir * (seg.level - 1) * stack;

      if (seg.first !== seg.last) {
        const sx0 = x(noteOrder[iFirst]!);
        const sx1 = x(noteOrder[iLast]!) + stemW;
        polygons.push(
          rectPolygon(group.id, at, sx0, beamYAt(sx0) + offset, sx1, beamYAt(sx1) + offset, thickness, dir),
        );
        continue;
      }

      const px = x(noteOrder[iFirst]!);
      const prevX = iFirst > 0 ? x(noteOrder[iFirst - 1]!) : undefined;
      const nextX = iFirst < noteOrder.length - 1 ? x(noteOrder[iFirst + 1]!) : undefined;
      const toward = seg.hook === 'left' ? prevX : nextX;
      const other = seg.hook === 'left' ? nextX : prevX;
      const bound = toward ?? other;
      const gap = bound !== undefined ? Math.abs(bound - px) / 2 : HOOK_LENGTH;
      const length = Math.min(HOOK_LENGTH, gap);
      const nearX = seg.hook === 'left' ? px + stemW : px;
      const farX = seg.hook === 'left' ? px - length : px + stemW + length;
      const nearY = beamYAt(nearX) + offset;
      const farY = beamYAt(farX) + offset;
      polygons.push(
        rectPolygon(
          group.id,
          at,
          Math.min(nearX, farX),
          seg.hook === 'left' ? farY : nearY,
          Math.max(nearX, farX),
          seg.hook === 'left' ? nearY : farY,
          thickness,
          dir,
        ),
      );
    }
    for (let i = polygonStart; i < polygons.length; i += 1) {
      const polygon = polygons[i]!;
      polygon.points = inkBeam(polygon.points, x0, xEnd, beamWander, group.id, beamPen);
    }
  }

  return { polygons, stemOverrides, suppressedGraceSlashes, diagnostics };
}

function levelsOf(group: NormalizedBeam, order: readonly NoteId[]): Map<NoteId, number> {
  const indexOf = new Map(order.map((id, i) => [id, i] as const));
  const levels = new Map<NoteId, number>(order.map((id) => [id, 1] as const));
  for (const seg of group.segments) {
    const a = indexOf.get(seg.first);
    const b = indexOf.get(seg.last);
    if (a === undefined || b === undefined) continue;
    for (let i = Math.min(a, b); i <= Math.max(a, b); i += 1) {
      const id = order[i]!;
      levels.set(id, Math.max(levels.get(id) ?? 1, seg.level));
    }
  }
  return levels;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rectPolygon(
  el: string,
  at: { systemIndex: number; staffIndex: number },
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thickness: number,
  dir: 1 | -1,
): BeamPolygon {
  const away = -dir * thickness;
  return {
    el,
    ...at,
    points: [
      [x0, y0],
      [x1, y1],
      [x1, y1 + away],
      [x0, y0 + away],
    ],
  };
}
