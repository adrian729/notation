import type { Pitch as MnxPitch } from '@polyhymnia/mnx';
import { toMnxPitch, type ClefSpec, type NoteId, type StepNumber } from '../layout/records.js';
import { keyAlterOf, stepIndexAt } from '../layout/staff.js';
import type { Box, ElementBox, LayoutResult, MeasureBox, Slot, SystemBox } from '../layout/types.js';
import { clefAtX } from './measures.js';

export type HitKind = 'element' | 'slot' | 'point';

export interface HitOptions {
  kinds?: readonly HitKind[];
  voice?: 0 | 1;
  radius?: number;
  insertAlteration?: 'key' | 'natural';
}

export type HitResult =
  | {
      kind: 'element';
      id: NoteId;
      part: 'notehead' | 'rest';
      box: ElementBox;
      staffPosition: number;
      pitch: MnxPitch | null;
      staff?: number;
    }
  | { kind: 'slot'; slot: Slot; staffPosition: number; pitch: MnxPitch; staff?: number }
  | {
      kind: 'point';
      measureIndex: number;
      systemIndex: number;
      x: number;
      tick: number;
      staffPosition: number;
      pitch: MnxPitch;
      staff?: number;
    };

const DEFAULT_KINDS: readonly HitKind[] = ['element', 'slot', 'point'];
const DEFAULT_RADIUS = 0.5;
export const HIT_STAFF_MARGIN = 4;

function pitchAt(
  staffPosition: number,
  measureBox: MeasureBox,
  clef: ClefSpec,
  insertAlteration: 'key' | 'natural',
): MnxPitch {
  const stepIdx = stepIndexAt(staffPosition, clef);
  const step = (((stepIdx % 7) + 7) % 7) as StepNumber;
  const octave = Math.floor(stepIdx / 7);
  const alter = insertAlteration === 'natural' ? 0 : keyAlterOf(measureBox.key, step);
  return toMnxPitch({ step, alter, octave });
}

function findSystem(layout: LayoutResult, y: number): SystemBox | undefined {
  return layout.systems.find((s) => y >= s.y - HIT_STAFF_MARGIN && y <= s.y + s.h + HIT_STAFF_MARGIN);
}

interface StaffHit {
  y: number;
  tag: { staff?: number };
  index: number;
}

function nearestStaff(system: SystemBox, y: number): StaffHit {
  if (!system.staves || system.staves.length === 0) return { y: system.y, tag: {}, index: 0 };
  let best = system.staves[0]!;
  let bestDist = Infinity;
  for (const staff of system.staves) {
    const dist = y < staff.y ? staff.y - y : y > staff.y + staff.h ? y - staff.y - staff.h : 0;
    if (dist < bestDist) {
      bestDist = dist;
      best = staff;
    }
  }
  return { y: best.y, tag: { staff: best.index }, index: best.index };
}

function staffY(system: SystemBox | undefined, staff: number | undefined): number {
  return system?.staves?.[staff ?? 0]?.y ?? system?.y ?? 0;
}

function findMeasure(layout: LayoutResult, systemIndex: number, x: number): MeasureBox | undefined {
  return layout.measures.find((m) => m.systemIndex === systemIndex && x >= m.x && x < m.x + m.w);
}

function inflatedContains(box: Box, p: { x: number; y: number }, radius: number): boolean {
  return (
    p.x >= box.x - radius && p.x <= box.x + box.w + radius && p.y >= box.y - radius && p.y <= box.y + box.h + radius
  );
}

function hitElement(
  layout: LayoutResult,
  p: { x: number; y: number },
  radius: number,
  voice: 0 | 1 | undefined,
): HitResult | null {
  const systemByIndex = new Map(layout.systems.map((s) => [s.index, s] as const));
  let best: ElementBox | undefined;
  let bestDist = Infinity;
  let bestDx = Infinity;
  for (const box of Object.values(layout.elements)) {
    if (voice !== undefined && box.voice !== voice) continue;
    if (!inflatedContains(box.hitBox, p, radius)) continue;
    const y = staffY(systemByIndex.get(box.systemIndex), box.staff);
    const dist = Math.abs(box.staffPosition - (p.y - y));
    const dx = Math.abs(box.x + box.w / 2 - p.x);
    if (dist < bestDist || (dist === bestDist && dx < bestDx)) {
      bestDist = dist;
      bestDx = dx;
      best = box;
    }
  }
  if (!best) return null;

  const pitch = best.pitch ? toMnxPitch(best.pitch) : null;
  return {
    kind: 'element',
    id: best.id,
    part: best.kind === 'rest' ? 'rest' : 'notehead',
    box: best,
    staffPosition: best.staffPosition,
    pitch,
    ...(best.staff !== undefined ? { staff: best.staff } : {}),
  };
}

function hitSlot(
  layout: LayoutResult,
  measureBox: MeasureBox,
  staff: StaffHit,
  p: { x: number; y: number },
  voice: 0 | 1 | undefined,
  insertAlteration: 'key' | 'natural',
): HitResult | null {
  const slot = layout.slots.find(
    (s) =>
      s.measureIndex === measureBox.index &&
      (s.staff ?? 0) === staff.index &&
      p.x >= s.x &&
      p.x < s.x + s.w &&
      (voice === undefined || s.voice === voice),
  );
  if (!slot) return null;
  const staffPosition = Math.round((p.y - staff.y) * 2) / 2;
  const pitch = pitchAt(staffPosition, measureBox, clefAtX(measureBox, p.x, staff.tag.staff), insertAlteration);
  return { kind: 'slot', slot, staffPosition, pitch, ...staff.tag };
}

function hitPoint(
  layout: LayoutResult,
  measureBox: MeasureBox,
  systemIndex: number,
  staff: StaffHit,
  p: { x: number; y: number },
  insertAlteration: 'key' | 'natural',
): HitResult {
  const staffPosition = Math.round((p.y - staff.y) * 2) / 2;
  const pitch = pitchAt(staffPosition, measureBox, clefAtX(measureBox, p.x, staff.tag.staff), insertAlteration);
  const slotHere = layout.slots.find(
    (s) => s.measureIndex === measureBox.index && (s.staff ?? 0) === staff.index && p.x >= s.x && p.x < s.x + s.w,
  );
  const tick = slotHere ? slotHere.tick - measureBox.startTick : 0;
  return {
    kind: 'point',
    measureIndex: measureBox.index,
    systemIndex,
    x: p.x,
    tick,
    staffPosition,
    pitch,
    ...staff.tag,
  };
}

export function hitTest(layout: LayoutResult, p: { x: number; y: number }, opts: HitOptions = {}): HitResult | null {
  const kinds = opts.kinds ?? DEFAULT_KINDS;
  const radius = opts.radius ?? DEFAULT_RADIUS;
  const insertAlteration = opts.insertAlteration ?? 'key';

  if (kinds.includes('element')) {
    const hit = hitElement(layout, p, radius, opts.voice);
    if (hit) return hit;
  }

  const system = findSystem(layout, p.y);
  if (!system) return null;

  const measureBox = findMeasure(layout, system.index, p.x);
  if (!measureBox) return null;
  const staff = nearestStaff(system, p.y);

  if (kinds.includes('slot')) {
    const hit = hitSlot(layout, measureBox, staff, p, opts.voice, insertAlteration);
    if (hit) return hit;
  }

  if (kinds.includes('point')) {
    return hitPoint(layout, measureBox, system.index, staff, p, insertAlteration);
  }

  return null;
}
