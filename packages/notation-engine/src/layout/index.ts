import { fontContext } from '../font/context.js';
import type { NotationOptions } from '../options.js';
import type { Diagnostic, MnxDocument } from '@polyhymnia/mnx';
import { accidentals } from './accidentals.js';
import { beams } from './beams.js';
import { breakSystems } from './break.js';
import { curves } from './curves.js';
import { emit } from './emit.js';
import { grouping } from './grouping.js';
import { horizontal } from './horizontal.js';
import { justify } from './justify.js';
import { normalize } from './normalize.js';
import { temporal } from './temporal.js';
import { tuplets } from './tuplets.js';
import type { LayoutResult } from './types.js';
import { vertical } from './vertical.js';

export function layoutScore(doc: MnxDocument, options?: NotationOptions): LayoutResult {
  const fonts = fontContext(options);
  const normalized = normalize(doc, options);
  const timed = temporal(normalized, options);
  const resolvedAccidentals = accidentals(normalized, timed, options);
  const groups = grouping(normalized, timed, options);
  const placed = vertical(normalized, timed, resolvedAccidentals, fonts);
  const spaced = horizontal(normalized, timed, placed, fonts, options);
  const broken = breakSystems(spaced, options);
  const justified = justify(broken, options);
  const beamed = beams(justified, normalized.beams, fonts);
  const tupletShapes = tuplets(justified, groups.tuplets, normalized.beams, beamed, fonts, options);
  const curveShapes = curves(justified, placed, beamed, normalized.ties, normalized.slurs, fonts);

  const diagnostics: Diagnostic[] = [
    ...normalized.diagnostics,
    ...timed.diagnostics,
    ...resolvedAccidentals.diagnostics,
    ...groups.diagnostics,
    ...placed.diagnostics,
    ...spaced.diagnostics,
    ...broken.diagnostics,
    ...justified.diagnostics,
    ...beamed.diagnostics,
    ...tupletShapes.diagnostics,
    ...curveShapes.diagnostics,
  ];

  return emit(
    {
      justified,
      temporal: timed,
      tempo: normalized.tempo,
      flow: normalized.flow,
      divisions: normalized.divisions,
      diagnostics,
      beams: beamed,
      tuplets: tupletShapes,
      curves: curveShapes,
    },
    fonts,
  );
}
