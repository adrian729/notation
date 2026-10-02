import { buildTimeline, type Timeline } from '@polyhymnia/mnx-score';
import type { MnxDocument } from '@polyhymnia/mnx';

const cache = new WeakMap<object, Map<number | undefined, Timeline>>();

export function timelineFor(doc: MnxDocument, divisions: number | undefined): Timeline {
  const build = (): Timeline => buildTimeline(doc, divisions === undefined ? {} : { divisions });
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
