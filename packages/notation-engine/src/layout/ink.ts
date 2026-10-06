import type { PenStroke } from '@polyhymnia/notation-fonts';
import type { RectShape } from './types.js';

function phaseOf(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  return ((hash >>> 0) / 0xffffffff) * Math.PI * 2;
}

const positive = (n: number | undefined): number => (n && Number.isFinite(n) && n > 0 ? n : 0);

const SCALE = 1e5;

/** `Number(n.toFixed(5))` without formatting a string per coordinate. Below 2^31 the scaled
 * product is off by at most 2.4e-7, so only a value within 1e-6 of a tie can round differently;
 * those, and larger values, go through toFixed, which rounds the exact value.
 */
function round5(n: number): number {
  const scaled = Math.abs(n) * SCALE;
  const whole = Math.floor(scaled);
  const fraction = scaled - whole;
  if (!(scaled < 2 ** 31) || Math.abs(fraction - 0.5) < 1e-6) return Number(n.toFixed(5));
  const rounded = (fraction > 0.5 ? whole + 1 : whole) / SCALE;
  return n < 0 ? -rounded : rounded;
}

/** Closed outline through the points, coordinates rounded to 5 decimals. */
function outlinePath(points: readonly (readonly [number, number])[]): string {
  let path = 'M';
  for (let i = 0; i < points.length; i += 1) {
    const [x, y] = points[i]!;
    path += `${i === 0 ? ' ' : ' L '}${round5(x)} ${round5(y)}`;
  }
  return `${path} Z`;
}

// One shallow pen sweep, with unequal shoulders, rather than periodic jitter.
// Both endpoints stay attached. The reference shafts deviate in their course,
// not by becoming wider; this displacement is independent of pen thickness.
function sweep(t: number, phase: number): number {
  const a = Math.cos(phase) * 1.3;
  const b = Math.sin(phase + 0.7) * 0.9;
  return 3 * t * (1 - t) * (a * (1 - t) + b * t);
}

/** Filled pen strokes. Bounds include the displaced ink; logical note positions
 * and interaction targets are unchanged. Horizontal ruling keeps its old path.
 */
export function inkRules(
  rects: readonly RectShape[],
  variation: number | undefined,
  wander?: number,
): readonly RectShape[] {
  const pressure = positive(variation);
  const displacement = positive(wander);
  if (!pressure && !displacement) return rects;
  return rects.map((rect) => {
    if (rect.outline) return rect;
    const horizontal = rect.w >= rect.h;
    const length = horizontal ? rect.w : rect.h;
    const breadth = horizontal ? rect.h : rect.w;
    if (length <= 0 || breadth <= 0) return rect;
    const penned = rect.cls === 'stem' || rect.cls === 'barline';
    const amount = Math.min(pressure, breadth * 0.3);
    // Preserve the original ruling exactly, including its phase function.
    let hash = 0;
    const seed = `${rect.cls}:${rect.el ?? ''}:${rect.x}:${rect.y}`;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    const phase = penned ? phaseOf(seed) : ((hash >>> 0) / 0xffffffff) * Math.PI * 2;
    const count = Math.max(penned ? 16 : 4, Math.ceil(length / (penned ? 0.25 : 1.5)));
    const edge = (i: number, far: boolean): [number, number] => {
      const t = i / count;
      const along = t * length;
      const shift = penned ? displacement * Math.min(1, length / 3) * sweep(t, phase) : 0;
      const inset =
        amount * Math.sin(Math.PI * t) ** 0.5 * (1 + 0.65 * Math.sin(along * 0.79 + phase + (far ? 1.7 : 0)));
      const across = shift + (far ? breadth - inset : inset);
      return [rect.x + (horizontal ? along : across), rect.y + (horizontal ? across : along)];
    };
    const points: [number, number][] = [];
    for (let i = 0; i <= count; i += 1) points.push(edge(i, false));
    for (let i = count; i >= 0; i -= 1) points.push(edge(i, true));
    const outline = outlinePath(points);
    if (!penned || !displacement) return { ...rect, outline };
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const x = Math.min(...xs),
      y = Math.min(...ys);
    return { ...rect, x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, outline };
  });
}

function edgesAt(profile: PenStroke['profile'], t: number): readonly [number, number] {
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1]!,
      b = profile[i]!;
    if (t <= b[0]) {
      const u = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
      return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    }
  }
  const last = profile[profile.length - 1];
  return last ? [last[1], last[2]] : [0, 1];
}

/** Font-drawn shaft, oriented from the head to the tip. Joined tips retain
 * enough ink to seat the flag/beam; bare stems retain the pen's tapered entry.
 */
export function inkStem(
  rect: RectShape,
  dir: 1 | -1,
  joined: boolean,
  pen: PenStroke | undefined,
  scale: number,
): RectShape {
  if (!pen || pen.profile.length < 2) return rect;
  const phase = phaseOf(rect.el ?? `${rect.x}:${rect.y}`);
  const samples = new Set([...pen.profile.map((p) => p[0]), ...Array.from({ length: 25 }, (_, i) => i / 24)]);
  if (joined) samples.add(0.97);
  const positions = [...samples].sort((a, b) => a - b);
  const edge = (t: number, far: boolean): [number, number] => {
    let [left, right] = edgesAt(pen.profile, t);
    if (joined && t > 0.97) {
      const join = (t - 0.97) / 0.03;
      left *= 1 - join;
      right += (1 - right) * join;
    }
    const shift = positive(pen.wander) * scale * sweep(t, phase);
    return [rect.x + shift + rect.w * (far ? right : left), rect.y + rect.h * (dir === 1 ? 1 - t : t)];
  };
  const points = [...positions.map((t) => edge(t, false)), ...positions.reverse().map((t) => edge(t, true))];
  const xs = points.map((p) => p[0]);
  const x = Math.min(rect.x, ...xs);
  return {
    ...rect,
    x,
    w: Math.max(rect.x + rect.w, ...xs) - x,
    outline: outlinePath(points),
  };
}

/** Shared by every beam level and its stem connections. Width comes from the
 * font's pen outline, while the much smaller drift is independently controlled.
 */
export function beamInkAt(
  x: number,
  start: number,
  end: number,
  wander: number | undefined,
  seed: string,
  pen?: PenStroke,
): { shift: number; near: number; far: number } {
  const t = Math.max(0, Math.min(1, (x - start) / (end - start)));
  const phase = phaseOf(seed);
  const [near, far] = pen ? edgesAt(pen.profile, t) : [0, 1];
  return {
    shift: positive(pen?.wander ?? wander) * sweep(t, phase),
    near,
    far,
  };
}

export function inkBeam(
  points: readonly [number, number][],
  start: number,
  end: number,
  wander: number | undefined,
  seed: string,
  pen?: PenStroke,
): readonly [number, number][] {
  if (!positive(wander) && !pen) return points;
  const [left, right, , farLeft] = points;
  if (!left || !right || !farLeft || right[0] <= left[0]) return points;
  const away = farLeft[1] - left[1];
  const count = Math.max(8, Math.ceil((right[0] - left[0]) / 0.25));
  const xs = new Set(Array.from({ length: count + 1 }, (_, i) => left[0] + ((right[0] - left[0]) * i) / count));
  for (const [t] of pen?.profile ?? []) {
    const x = start + (end - start) * t;
    if (x > left[0] && x < right[0]) xs.add(x);
  }
  const positions = [...xs].sort((a, b) => a - b);
  const edge = (x: number, far: boolean): [number, number] => {
    const t = (x - left[0]) / (right[0] - left[0]);
    const ink = beamInkAt(x, start, end, wander, seed, pen);
    const y = left[1] + (right[1] - left[1]) * t + ink.shift;
    return [x, y + away * (far ? ink.far : ink.near)];
  };
  return [...positions.map((x) => edge(x, false)), ...positions.reverse().map((x) => edge(x, true))];
}
