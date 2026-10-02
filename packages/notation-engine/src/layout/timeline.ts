import { buildTimeline, type Timeline, type TimelineOptions } from '@polyhymnia/mnx-score';
import type { MnxDocument } from '@polyhymnia/mnx';

export const MAX_STAVES = 2;

const cache = new WeakMap<object, Map<number | undefined, Timeline>>();

export function declaredStaves(doc: MnxDocument): number {
  const parts = typeof doc === 'object' && doc !== null && Array.isArray(doc.parts) ? doc.parts : [];
  const part: unknown = parts[0];
  const staves = typeof part === 'object' && part !== null ? (part as { staves?: unknown }).staves : undefined;
  return typeof staves === 'number' && Number.isInteger(staves) && staves > 1 ? staves : 1;
}

export function laidOutStaves(doc: MnxDocument): number {
  return Math.min(MAX_STAVES, declaredStaves(doc));
}

function timelineOptions(doc: MnxDocument, divisions: number | undefined): TimelineOptions {
  const staves = laidOutStaves(doc);
  return {
    ...(divisions === undefined ? {} : { divisions }),
    ...(staves > 1 ? { scope: { staves: Array.from({ length: staves }, (_, i) => i + 1) } } : {}),
  };
}

export function timelineFor(doc: MnxDocument, divisions: number | undefined): Timeline {
  const build = (): Timeline => buildTimeline(doc, timelineOptions(doc, divisions));
  if (typeof doc !== 'object' || doc === null) return build();
  let byDivisions = cache.get(doc);
  if (!byDivisions) {
    byDivisions = new Map();
    cache.set(doc, byDivisions);
  }
  let timeline = byDivisions.get(divisions);
  if (!timeline) {
    timeline = build();
    byDivisions.set(divisions, timeline);
  }
  return timeline;
}
