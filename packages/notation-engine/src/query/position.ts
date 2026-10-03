import type { LayoutResult } from '../layout/types.js';

export interface TickPosition {
  systemIndex: number;
  x: number;
  yTop: number;
  yBottom: number;
}

interface Onset {
  tick: number;
  end: number;
  measureIndex: number;
  systemIndex: number;
  x: number;
}

export function positionAtTick(layout: LayoutResult, tick: number): TickPosition | null {
  const onsets = onsetsOf(layout);
  if (onsets.length === 0) return null;

  let i = 0;
  while (i + 1 < onsets.length && onsets[i + 1]!.tick <= tick) i += 1;
  const onset = onsets[i]!;
  if (tick <= onset.tick) return at(layout, onset.systemIndex, onset.x);

  const next = onsets[i + 1];
  const measure = layout.placements.measures[onset.measureIndex];
  const targetX = next && next.systemIndex === onset.systemIndex ? next.x : measure ? measure.x + measure.w : onset.x;
  const span = Math.max(1, (next ? next.tick : onset.end) - onset.tick);
  const ratio = Math.min(1, (tick - onset.tick) / span);
  return at(layout, onset.systemIndex, onset.x + (targetX - onset.x) * ratio);
}

function onsetsOf(layout: LayoutResult): Onset[] {
  const byTick = new Map<number, Onset>();
  for (const entry of layout.timeline.entries) {
    if (entry.kind === 'grace') continue;
    const place = layout.placements.entries[entry.id];
    if (!place) continue;
    const end = entry.tick + entry.durationTicks;
    const existing = byTick.get(entry.tick);
    if (existing) existing.end = Math.max(existing.end, end);
    else {
      byTick.set(entry.tick, {
        tick: entry.tick,
        end,
        measureIndex: entry.measureIndex,
        systemIndex: place.systemIndex,
        x: place.x,
      });
    }
  }
  return [...byTick.values()].sort((a, b) => a.tick - b.tick);
}

function at(layout: LayoutResult, systemIndex: number, x: number): TickPosition {
  const system = layout.systems.find((s) => s.index === systemIndex);
  return { systemIndex, x, yTop: system ? system.y : 0, yBottom: system ? system.y + system.h : 0 };
}
