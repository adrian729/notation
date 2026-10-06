import { layoutScore } from '@polyhymnia/notation-engine';
import type { LayoutResult, NotationOptions } from '@polyhymnia/notation-engine';
import type { MnxDocument } from '@polyhymnia/mnx';

const NO_OPTIONS: NotationOptions = {};
const layouts = new WeakMap<MnxDocument, WeakMap<NotationOptions, LayoutResult>>();

/**
 * The layout `<Notation>` draws for this score and options object, computed once per pair. A caller
 * that needs it too (to size or label a score) gets the same result without laying it out again,
 * as long as it passes the same objects.
 */
export function cachedLayout(score: MnxDocument, options: NotationOptions = NO_OPTIONS): LayoutResult {
  let byOptions = layouts.get(score);
  if (!byOptions) {
    byOptions = new WeakMap();
    layouts.set(score, byOptions);
  }
  let layout = byOptions.get(options);
  if (!layout) {
    layout = layoutScore(score, options === NO_OPTIONS ? undefined : options);
    byOptions.set(options, layout);
  }
  return layout;
}
