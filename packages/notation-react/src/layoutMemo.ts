import { layoutScore } from '@polyhymnia/notation-engine';
import type { LayoutResult, NotationOptions } from '@polyhymnia/notation-engine';
import type { MnxDocument } from '@polyhymnia/notation-model';

const NO_OPTIONS: NotationOptions = {};
const layouts = new WeakMap<MnxDocument, WeakMap<NotationOptions, LayoutResult>>();

export function memoLayout(score: MnxDocument, options: NotationOptions = NO_OPTIONS): LayoutResult {
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
