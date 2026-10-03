import type { TimelineEntry } from './types.js';

export const DEFAULT_VELOCITY = 0.8;

const SCALE = [
  'pppppp',
  'ppppp',
  'pppp',
  'ppp',
  'pp',
  'p',
  'mp',
  'mf',
  'f',
  'ff',
  'fff',
  'ffff',
  'fffff',
  'ffffff',
] as const;

const PPP = SCALE.indexOf('ppp');
const MF = SCALE.indexOf('mf');
const FFF = SCALE.indexOf('fff');
const PPP_VELOCITY = 0.25;
const FFF_VELOCITY = 1;

function scaleVelocity(index: number): number {
  if (index <= MF) return PPP_VELOCITY * (DEFAULT_VELOCITY / PPP_VELOCITY) ** ((index - PPP) / (MF - PPP));
  return Math.min(FFF_VELOCITY, DEFAULT_VELOCITY * (FFF_VELOCITY / DEFAULT_VELOCITY) ** ((index - MF) / (FFF - MF)));
}

const VELOCITY: ReadonlyMap<string, number> = new Map<string, number>([
  ...SCALE.map((value, i) => [value, scaleVelocity(i)] as const),
  ['n', 0],
]);

export interface DynamicMark {
  part: number;
  staff?: number;
  tick: number;
  type: 'immediate' | 'accent' | 'gradual';
  value?: string;
  residualValue?: string;
  wedge?: 'increasing' | 'decreasing';
  endTick?: number;
}

export function dynamicVelocity(value: unknown): number | undefined {
  return typeof value === 'string' ? VELOCITY.get(value) : undefined;
}

function stepped(from: number, wedge: 'increasing' | 'decreasing'): number {
  let nearest = 0;
  SCALE.forEach((_, i) => {
    if (Math.abs(scaleVelocity(i) - from) < Math.abs(scaleVelocity(nearest) - from)) nearest = i;
  });
  const index = Math.max(0, Math.min(SCALE.length - 1, nearest + (wedge === 'increasing' ? 1 : -1)));
  return scaleVelocity(index);
}

interface Ramp {
  start: number;
  end: number;
  from: number;
  to: number;
}

function rampAt(ramp: Ramp, tick: number): number {
  if (tick >= ramp.end || ramp.end <= ramp.start) return ramp.to;
  return ramp.from + ((ramp.to - ramp.from) * (tick - ramp.start)) / (ramp.end - ramp.start);
}

function levelAt(marks: readonly DynamicMark[], tick: number): number {
  let level = DEFAULT_VELOCITY;
  let ramp: Ramp | undefined;
  let attack: number | undefined;
  const current = (at: number): number => (ramp ? rampAt(ramp, at) : level);
  for (const mark of marks) {
    if (mark.tick > tick) break;
    if (ramp && mark.tick >= ramp.end) {
      level = ramp.to;
      ramp = undefined;
    }
    const value = dynamicVelocity(mark.value);
    if (mark.type === 'immediate' && value !== undefined) {
      level = value;
      ramp = undefined;
    } else if (mark.type === 'accent') {
      if (mark.tick === tick && value !== undefined) attack = value;
      const residual = dynamicVelocity(mark.residualValue);
      if (residual !== undefined) {
        level = residual;
        ramp = undefined;
      }
    } else if (mark.type === 'gradual' && mark.wedge && mark.endTick !== undefined) {
      const from = value ?? current(mark.tick);
      const closing = marks.find(
        (m) => m.type === 'immediate' && m.tick === mark.endTick && dynamicVelocity(m.value) !== undefined,
      );
      const to = closing ? dynamicVelocity(closing.value)! : stepped(from, mark.wedge);
      level = from;
      ramp = { start: mark.tick, end: mark.endTick, from, to };
    }
  }
  return attack ?? current(tick);
}

export function applyDynamics(entries: readonly TimelineEntry[], marks: readonly DynamicMark[]): TimelineEntry[] {
  if (marks.length === 0) return [...entries];
  const ordered = [...marks].sort((a, b) => a.tick - b.tick);
  return entries.map((entry) => {
    if (entry.kind !== 'note' && entry.kind !== 'chord') return entry;
    const applicable = ordered.filter(
      (m) => m.part === entry.part && (m.staff === undefined || m.staff === entry.staff),
    );
    if (applicable.length === 0) return entry;
    const level = levelAt(applicable, entry.tick);
    return Math.abs(level - DEFAULT_VELOCITY) < 1e-9 ? entry : { ...entry, dynamicLevel: level };
  });
}
