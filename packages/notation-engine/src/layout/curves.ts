import type { Diagnostic } from '@polyhymnia/notation-model';
import { engravingDefaults } from '../font/metadata.js';
import type { NotationOptions } from '../options.js';
import type { BeamsResult } from './beams.js';
import type { JustifiedScore, JustifiedSystem } from './justify.js';
import type { NormalizedSlur, NoteId, NormalizedTie } from './records.js';
import { MIDDLE_LINE, STAFF_HEIGHT } from './staff.js';
import { stemX, type NoteheadLayout, type VerticalElement, type VerticalScore } from './vertical.js';

const GAP = 0.3;
const V_OFFSET = 0.5;
const MIN_SPAN = 0.6;
const ARCH_BASE = 0.35;
const ARCH_PER_SP = 0.03;
const ARCH_MIN = 0.35;
const ARCH_MAX = 1.0;
const SYSTEM_END_MARGIN = 0.5;
const SYSTEM_START_MARGIN = 1.5;
const LINE_CLEARANCE = 0.2;
const ENDPOINT_NUDGE = 0.25;
const APEX_ARCH_FRACTION = 0.75;

const SLUR_ARCH_BASE = 0.9;
const SLUR_ARCH_PER_SP = 0.03;
const SLUR_ARCH_MIN = 0.9;
const SLUR_ARCH_MAX = 3.0;
const SLUR_CLEARANCE_PAD = 0.25;
const SLUR_CLEARANCE_ITERS = 4;
const SLUR_SAMPLES = 8;

export interface CurveShape {
  systemIndex: number;
  d: string;
  cls: 'tie' | 'slur';
  el: string;
}

export interface CurvesResult {
  shapes: readonly CurveShape[];
  diagnostics: readonly Diagnostic[];
}

interface PlacedNote {
  el: VerticalElement;
  head: NoteheadLayout;
  x: number;
  systemIndex: number;
}

export function curves(
  justified: JustifiedScore,
  placedScore: VerticalScore,
  beamsResult: BeamsResult,
  ties: readonly NormalizedTie[],
  slurs: readonly NormalizedSlur[],
  _options?: NotationOptions,
): CurvesResult {
  const noteMap = buildNoteMap(justified);
  const elementsBySystem = buildElementsBySystem(justified);
  const twoVoiceMeasures = new Set(placedScore.elements.filter((e) => e.voice === 1).map((e) => e.measureIndex));
  const chordTies = new Map<NoteId, NormalizedTie[]>();
  for (const tie of ties) {
    const from = noteMap.get(tie.from);
    if (!from || from.el.kind !== 'chord') continue;
    const list = chordTies.get(from.el.id) ?? [];
    list.push(tie);
    chordTies.set(from.el.id, list);
  }

  const diagnostics: Diagnostic[] = [];
  const shapes: CurveShape[] = [];

  for (const tie of ties) {
    const from = noteMap.get(tie.from);
    const to = noteMap.get(tie.to);
    if (!from || !to) {
      diagnostics.push({
        severity: 'warning',
        code: 'tie-unplaced',
        message: `Tie ${tie.id} could not be drawn; one or both endpoints were not laid out.`,
        measureIndex: tie.measureIndex,
      });
      continue;
    }

    const siblingTies = from.el.kind === 'chord' ? (chordTies.get(from.el.id) ?? [tie]) : [tie];
    const siblings = siblingTies.map((t) => noteMap.get(t.from)).filter((p): p is PlacedNote => p !== undefined);
    const dir =
      tie.side === 'up'
        ? 1
        : tie.side === 'down'
          ? -1
          : directionFor(from, siblings, twoVoiceMeasures.has(tie.measureIndex));

    for (const span of spansBetween(from, to, justified)) shapes.push(tieShape(tie.id, span, dir));
  }

  for (const slur of slurs) {
    const from0 = noteMap.get(slur.from);
    const to0 = noteMap.get(slur.to);
    if (!from0 || !to0) continue;
    const dir = slurDirection(slur, from0, to0, twoVoiceMeasures.has(slur.measureIndex), elementsBySystem);
    const from = (dir === -1 && slur.fromBottom ? noteMap.get(slur.fromBottom) : undefined) ?? from0;
    const to = (dir === -1 && slur.toBottom ? noteMap.get(slur.toBottom) : undefined) ?? to0;

    for (const span of spansBetween(from, to, justified)) {
      shapes.push(slurShape(slur.id, span, dir, beamsResult, elementsBySystem));
    }
  }

  return { shapes, diagnostics };
}

function buildNoteMap(justified: JustifiedScore): Map<NoteId, PlacedNote> {
  const map = new Map<NoteId, PlacedNote>();
  for (const system of justified.systems) {
    for (const measure of system.measures) {
      for (const column of measure.columns) {
        for (const el of column.elements) {
          for (const head of el.noteheads) {
            map.set(head.id, { el, head, x: column.x, systemIndex: measure.systemIndex });
          }
        }
      }
    }
  }
  return map;
}

interface PlacedElement {
  el: VerticalElement;
  x: number;
  systemIndex: number;
}

type ElementsBySystem = ReadonlyMap<number, readonly PlacedElement[]>;

function buildElementsBySystem(justified: JustifiedScore): ElementsBySystem {
  const bySystem = new Map<number, PlacedElement[]>();
  for (const system of justified.systems) {
    for (const measure of system.measures) {
      let bucket = bySystem.get(measure.systemIndex);
      if (!bucket) {
        bucket = [];
        bySystem.set(measure.systemIndex, bucket);
      }
      for (const column of measure.columns) {
        for (const el of column.elements) {
          bucket.push({ el, x: column.x, systemIndex: measure.systemIndex });
        }
      }
    }
  }
  return bySystem;
}

interface Obstacle {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function directionFor(from: PlacedNote, siblings: readonly PlacedNote[], twoVoice: boolean): 1 | -1 {
  if (twoVoice) return from.el.voice === 0 ? 1 : -1;
  if (from.el.kind === 'chord' && siblings.length > 1) {
    const coincident = siblings.filter((s) => s.head.staffPosition === from.head.staffPosition);
    if (coincident.length > 1) {
      const alters = coincident.map((s) => s.head.pitch.alter);
      if (from.head.pitch.alter === Math.max(...alters)) return 1;
      if (from.head.pitch.alter === Math.min(...alters)) return -1;
    }
    const positions = siblings.map((s) => s.head.staffPosition);
    const top = Math.min(...positions);
    const bottom = Math.max(...positions);
    if (from.head.staffPosition === top) return 1;
    if (from.head.staffPosition === bottom) return -1;
    const mid = (top + bottom) / 2;
    return from.head.staffPosition < mid ? 1 : -1;
  }
  if (from.el.stem) return from.el.stem.dir === 1 ? -1 : 1;
  return from.head.staffPosition <= MIDDLE_LINE ? 1 : -1;
}

function archFor(span: number): number {
  return Math.min(ARCH_MAX, Math.max(ARCH_MIN, ARCH_BASE + Math.max(0, span) * ARCH_PER_SP));
}

function rightEdge(note: PlacedNote): number {
  return note.x + note.head.dx + note.head.width;
}

function leftEdge(note: PlacedNote): number {
  return note.x + note.head.dx;
}

function withinStaff(y: number): boolean {
  return y >= 0 && y <= STAFF_HEIGHT;
}

function nearLine(y: number): boolean {
  return withinStaff(y) && Math.abs(y - Math.round(y)) < LINE_CLEARANCE;
}

function endpointY(note: PlacedNote, dir: 1 | -1): number {
  const y = note.head.staffPosition - dir * V_OFFSET;
  return nearLine(y) ? y - dir * ENDPOINT_NUDGE : y;
}

function clearApex(y0: number, y3: number, dir: 1 | -1, arch: number): number {
  const base = (y0 + y3) / 2;
  const apex = base - dir * APEX_ARCH_FRACTION * arch;
  if (!nearLine(apex)) return arch;
  const target = Math.round(apex) - dir * LINE_CLEARANCE;
  const needed = (dir * (base - target)) / APEX_ARCH_FRACTION;
  return Math.max(arch, needed, ARCH_MIN);
}

type CurveSpan =
  | { kind: 'whole'; from: PlacedNote; to: PlacedNote }
  | { kind: 'start'; from: PlacedNote; system: JustifiedSystem }
  | { kind: 'end'; to: PlacedNote; system: JustifiedSystem };

interface CurveGeometry {
  systemIndex: number;
  x0: number;
  x3: number;
  y0: number;
  y3: number;
  lo: number;
  hi: number;
}

function spansBetween(from: PlacedNote, to: PlacedNote, justified: JustifiedScore): readonly CurveSpan[] {
  if (from.systemIndex === to.systemIndex) return [{ kind: 'whole', from, to }];
  const fromSystem = justified.systems[from.systemIndex];
  const toSystem = justified.systems[to.systemIndex];
  if (!fromSystem || !toSystem) return [];
  return [
    { kind: 'start', from, system: fromSystem },
    { kind: 'end', to, system: toSystem },
  ];
}

function lastColumnX(system: JustifiedSystem): number {
  const measure = system.measures[system.measures.length - 1];
  const column = measure?.columns[measure.columns.length - 1];
  return column ? column.x : system.width;
}

function firstColumnX(system: JustifiedSystem): number {
  const measure = system.measures[0];
  const column = measure?.columns[0];
  return column ? column.x : 0;
}

function curveSpan(span: CurveSpan, endpointYOf: (note: PlacedNote) => number): CurveGeometry {
  switch (span.kind) {
    case 'whole': {
      const { from, to } = span;
      const x0 = rightEdge(from) + GAP;
      const x3 = Math.max(leftEdge(to) - GAP, x0 + MIN_SPAN);
      return {
        systemIndex: from.systemIndex,
        x0,
        x3,
        y0: endpointYOf(from),
        y3: endpointYOf(to),
        lo: from.x,
        hi: to.x,
      };
    }
    case 'start': {
      const { from, system } = span;
      const x0 = rightEdge(from) + GAP;
      const x3 = Math.max(x0 + MIN_SPAN, Math.min(system.width, lastColumnX(system) + SYSTEM_END_MARGIN));
      const y = endpointYOf(from);
      return { systemIndex: from.systemIndex, x0, x3, y0: y, y3: y, lo: from.x, hi: x3 };
    }
    case 'end': {
      const { to, system } = span;
      const x3 = leftEdge(to) - GAP;
      const x0 = Math.min(x3 - MIN_SPAN, Math.max(0, firstColumnX(system) - SYSTEM_START_MARGIN));
      const y = endpointYOf(to);
      return { systemIndex: to.systemIndex, x0, x3, y0: y, y3: y, lo: x0, hi: to.x };
    }
  }
}

function curveShape(id: string, cls: CurveShape['cls'], g: CurveGeometry, dir: 1 | -1, arch: number): CurveShape {
  const e = engravingDefaults;
  const [endT, midT] =
    cls === 'tie'
      ? [e.tieEndpointThickness, e.tieMidpointThickness]
      : [e.slurEndpointThickness, e.slurMidpointThickness];
  return {
    el: id,
    systemIndex: g.systemIndex,
    cls,
    d: curvePath([g.x0, g.y0], [g.x3, g.y3], dir, arch, endT, midT),
  };
}

function tieShape(id: string, span: CurveSpan, dir: 1 | -1): CurveShape {
  const g = curveSpan(span, (note) => endpointY(note, dir));
  const arch = clearApex(g.y0, g.y3, dir, archFor(g.x3 - g.x0));
  return curveShape(id, 'tie', g, dir, arch);
}

function slurDirection(
  slur: NormalizedSlur,
  from: PlacedNote,
  to: PlacedNote,
  twoVoice: boolean,
  elementsBySystem: ElementsBySystem,
): 1 | -1 {
  if (slur.side === 'up') return 1;
  if (slur.side === 'down') return -1;
  if (twoVoice) return from.el.voice === 0 ? 1 : -1;
  return anyStemDownInSpan(from, to, elementsBySystem) ? 1 : -1;
}

function anyStemDownInSpan(from: PlacedNote, to: PlacedNote, elementsBySystem: ElementsBySystem): boolean {
  if (from.systemIndex === to.systemIndex) {
    const bucket = elementsBySystem.get(from.systemIndex) ?? [];
    for (const pe of bucket) {
      if (pe.el.stem?.dir === -1 && pe.x >= from.x && pe.x <= to.x) return true;
    }
    return false;
  }
  const fromBucket = elementsBySystem.get(from.systemIndex) ?? [];
  for (const pe of fromBucket) {
    if (pe.el.stem?.dir === -1 && pe.x >= from.x) return true;
  }
  const toBucket = elementsBySystem.get(to.systemIndex) ?? [];
  for (const pe of toBucket) {
    if (pe.el.stem?.dir === -1 && pe.x <= to.x) return true;
  }
  return false;
}

function slurArchFor(span: number): number {
  return Math.min(SLUR_ARCH_MAX, Math.max(SLUR_ARCH_MIN, SLUR_ARCH_BASE + Math.max(0, span) * SLUR_ARCH_PER_SP));
}

function isOuterChordMember(note: PlacedNote, dir: 1 | -1): boolean {
  const heads = note.el.noteheads;
  if (heads.length <= 1) return true;
  const positions = heads.map((h) => h.staffPosition);
  const extreme = dir === 1 ? Math.min(...positions) : Math.max(...positions);
  return note.head.staffPosition === extreme;
}

function slurEndpointY(note: PlacedNote, dir: 1 | -1, stemOverrides: BeamsResult['stemOverrides']): number {
  const stem = note.el.stem;
  if (stem?.drawn && stem.dir === dir && isOuterChordMember(note, dir)) {
    const override = stemOverrides.get(note.el.id);
    return dir === 1 ? (override?.yTop ?? stem.yTop) : (override?.yBottom ?? stem.yBottom);
  }
  return note.head.staffPosition - dir * V_OFFSET;
}

function slurShape(
  id: string,
  span: CurveSpan,
  dir: 1 | -1,
  beamsResult: BeamsResult,
  elementsBySystem: ElementsBySystem,
): CurveShape {
  const g = curveSpan(span, (note) => slurEndpointY(note, dir, beamsResult.stemOverrides));
  const arch = clearSlur(
    slurArchFor(g.x3 - g.x0),
    [g.x0, g.y0],
    [g.x3, g.y3],
    dir,
    slurObstacles(g.systemIndex, g.lo, g.hi, beamsResult, elementsBySystem),
  );
  return curveShape(id, 'slur', g, dir, arch);
}

function clearSlur(
  arch: number,
  p0: readonly [number, number],
  p3: readonly [number, number],
  dir: 1 | -1,
  obstacles: readonly Obstacle[],
): number {
  let current = arch;
  for (let iter = 0; iter < SLUR_CLEARANCE_ITERS; iter += 1) {
    let raise = 0;
    for (let i = 1; i <= SLUR_SAMPLES; i += 1) {
      const t = i / (SLUR_SAMPLES + 1);
      const [px, py] = bezierPoint(p0, p3, dir, current, t);
      for (const ob of obstacles) {
        if (px < ob.x0 || px > ob.x1) continue;
        if (py < ob.y0 || py > ob.y1) continue;
        const penetration = dir === 1 ? py - ob.y0 : ob.y1 - py;
        const sensitivity = 3 * (1 - t) * t;
        raise = Math.max(raise, (penetration + SLUR_CLEARANCE_PAD) / Math.max(sensitivity, 0.1));
      }
    }
    if (raise <= 0) break;
    current += raise;
  }
  return current;
}

function bezierPoint(
  p0: readonly [number, number],
  p3: readonly [number, number],
  dir: 1 | -1,
  arch: number,
  t: number,
): [number, number] {
  const [x0, y0] = p0;
  const [x3, y3] = p3;
  const dx = x3 - x0;
  const c1y = y0 + (y3 - y0) * 0.25 - dir * arch;
  const c2y = y0 + (y3 - y0) * 0.75 - dir * arch;
  const mt = 1 - t;
  const x = mt * mt * mt * x0 + 3 * mt * mt * t * (x0 + dx * 0.25) + 3 * mt * t * t * (x0 + dx * 0.75) + t * t * t * x3;
  const y = mt * mt * mt * y0 + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * y3;
  return [x, y];
}

function slurObstacles(
  systemIndex: number,
  lo: number,
  hi: number,
  beamsResult: BeamsResult,
  elementsBySystem: ElementsBySystem,
): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const bucket = elementsBySystem.get(systemIndex) ?? [];
  for (const pe of bucket) {
    if (pe.x <= lo || pe.x >= hi) continue;
    for (const head of pe.el.noteheads) {
      obstacles.push({
        x0: pe.x + head.dx,
        x1: pe.x + head.dx + head.width,
        y0: head.staffPosition - 0.5,
        y1: head.staffPosition + 0.5,
      });
    }
    if (pe.el.stem?.drawn) {
      const override = beamsResult.stemOverrides.get(pe.el.id);
      const yTop = override?.yTop ?? pe.el.stem.yTop;
      const yBottom = override?.yBottom ?? pe.el.stem.yBottom;
      obstacles.push({
        x0: stemX(pe.x, pe.el.stem),
        x1: stemX(pe.x, pe.el.stem) + pe.el.stem.width,
        y0: yTop,
        y1: yBottom,
      });
    }
  }
  for (const poly of beamsResult.polygons) {
    if (poly.systemIndex !== systemIndex) continue;
    const xs = poly.points.map(([x]) => x);
    const ys = poly.points.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    if (maxX < lo || minX > hi) continue;
    obstacles.push({ x0: minX, x1: maxX, y0: Math.min(...ys), y1: Math.max(...ys) });
  }
  return obstacles;
}

function curvePath(
  p0: readonly [number, number],
  p3: readonly [number, number],
  dir: 1 | -1,
  arch: number,
  endT: number,
  midT: number,
): string {
  const [x0, y0] = p0;
  const [x3, y3] = p3;
  const dx = x3 - x0;
  const outer0: [number, number] = [x0, y0 - (dir * endT) / 2];
  const outer3: [number, number] = [x3, y3 - (dir * endT) / 2];
  const inner0: [number, number] = [x0, y0 + (dir * endT) / 2];
  const inner3: [number, number] = [x3, y3 + (dir * endT) / 2];
  const innerArch = Math.max(0, arch - midT);
  const outerAt = (t: number): number => outer0[1] + (outer3[1] - outer0[1]) * t;
  const innerAt = (t: number): number => inner0[1] + (inner3[1] - inner0[1]) * t;
  const oc1: [number, number] = [outer0[0] + dx * 0.25, outerAt(0.25) - dir * arch];
  const oc2: [number, number] = [outer0[0] + dx * 0.75, outerAt(0.75) - dir * arch];
  const ic1: [number, number] = [inner3[0] - dx * 0.25, innerAt(0.75) - dir * innerArch];
  const ic2: [number, number] = [inner3[0] - dx * 0.75, innerAt(0.25) - dir * innerArch];
  const f = (n: number): string => n.toFixed(3);
  return (
    `M${f(outer0[0])},${f(outer0[1])} ` +
    `C${f(oc1[0])},${f(oc1[1])} ${f(oc2[0])},${f(oc2[1])} ${f(outer3[0])},${f(outer3[1])} ` +
    `L${f(inner3[0])},${f(inner3[1])} ` +
    `C${f(ic1[0])},${f(ic1[1])} ${f(ic2[0])},${f(ic2[1])} ${f(inner0[0])},${f(inner0[1])} Z`
  );
}
