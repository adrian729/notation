import { fontContext } from '../font/context.js';
import type { NotationOptions } from '../options.js';
import type { Diagnostic, MnxDocument } from '@polyhymnia/mnx';
import { accidentals } from './accidentals.js';
import { articulations, clearNotes, clearSlurs } from './articulations.js';
import { beams } from './beams.js';
import { breakSystems } from './break.js';
import { curves } from './curves.js';
import { dynamics, spaceDynamics } from './dynamics.js';
import { emit } from './emit.js';
import { fermatas } from './fermatas.js';
import { grouping } from './grouping.js';
import { horizontal } from './horizontal.js';
import { justify } from './justify.js';
import { contentMargins, staffOffsetsOf } from './margins.js';
import { normalize } from './normalize.js';
import { skyline } from './skyline.js';
import { temporal } from './temporal.js';
import { timelineFor } from './timeline.js';
import { tuplets } from './tuplets.js';
import type { LayoutResult } from './types.js';
import { vertical } from './vertical.js';

const isCollision = (d: Diagnostic): boolean => d.code === 'id-collision';

export function layoutScore(doc: MnxDocument, options?: NotationOptions): LayoutResult {
  const fonts = fontContext(options);
  const timeline = timelineFor(doc, options?.divisions);
  const beamIds = timeline.ids.fork();
  const normalized = normalize(doc, options, timeline, beamIds);
  const timed = temporal(normalized);
  const resolvedAccidentals = accidentals(normalized, timed, options);
  const groups = grouping(normalized, timed, options);
  const placed = vertical(normalized, timed, resolvedAccidentals, fonts);
  const staffCount = Math.max(1, normalized.staves.length);
  const spaced = spaceDynamics(
    horizontal(normalized, timed, placed, fonts, options),
    normalized.dynamics,
    staffCount,
    fonts,
  );
  const broken = breakSystems(spaced, options);
  const justified = justify(broken, options);
  const beamed = beams(justified, normalized.beams, fonts);
  const tupletShapes = tuplets(justified, groups.tuplets, normalized.beams, beamed, fonts, options);
  const marks = articulations(justified, beamed, normalized.events, fonts);
  const curveShapes = curves(justified, placed, beamed, normalized.ties, normalized.slurs, marks, fonts);
  const settled = clearNotes(clearSlurs(marks, curveShapes), justified, beamed, fonts);
  const sky = skyline({ justified, beams: beamed, tuplets: tupletShapes, curves: curveShapes, marks: settled }, fonts);
  const allMarks = [...settled, ...fermatas(justified, beamed, normalized, sky, fonts)];
  const marginsInput = {
    justified,
    beams: beamed,
    tuplets: tupletShapes,
    curves: curveShapes,
    marks: allMarks,
    staffCount,
  };
  const dynamicShapes = dynamics(
    justified,
    normalized.dynamics,
    sky,
    staffOffsetsOf(contentMargins(marginsInput, [], fonts)),
    fonts,
  );

  const diagnostics: Diagnostic[] = [
    ...timeline.diagnostics.filter((d) => !isCollision(d)),
    ...normalized.diagnostics,
    ...resolvedAccidentals.diagnostics,
    ...groups.diagnostics,
    ...placed.diagnostics,
    ...spaced.diagnostics,
    ...broken.diagnostics,
    ...justified.diagnostics,
    ...beamed.diagnostics,
    ...tupletShapes.diagnostics,
    ...curveShapes.diagnostics,
    ...timeline.diagnostics.filter(isCollision),
    ...beamIds.diagnostics,
  ];

  return emit(
    {
      ids: beamIds,
      dynamicRecords: normalized.dynamics,
      justified,
      temporal: timed,
      timeline,
      diagnostics,
      beams: beamed,
      tuplets: tupletShapes,
      curves: curveShapes,
      marks: allMarks,
      dynamics: dynamicShapes,
      margins: contentMargins(marginsInput, dynamicShapes.outer, fonts),
    },
    fonts,
  );
}
