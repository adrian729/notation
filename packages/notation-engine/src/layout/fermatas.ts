import type { FontContext } from '../font/context.js';
import { wholeBarRestX } from '../query/measures.js';
import { chordFrame, placeMark, twoVoiceKeys, type Mark } from './articulations.js';
import type { BeamsResult } from './beams.js';
import { BARLINE_PAD, endBarlineWidth, isClefColumn } from './horizontal.js';
import type { JustifiedScore, PositionedMeasure } from './justify.js';
import type { FermataSpec, NormalizedScore } from './records.js';
import type { Skyline } from './skyline.js';
import { STAFF_HEIGHT } from './staff.js';
import type { VerticalElement } from './vertical.js';

const FERMATA_OFFSET = 0.5;
const FERMATA_MIN_DISTANCE = 0.4;

export function fermatas(
  justified: JustifiedScore,
  beams: BeamsResult,
  normalized: NormalizedScore,
  sky: Skyline,
  fonts: FontContext,
): Mark[] {
  const lastStaff = normalized.staves.length - 1;
  const twoVoice = twoVoiceKeys(justified);
  const marks: Mark[] = [];
  const place = (
    el: string,
    systemIndex: number,
    staffIndex: number,
    cx: number,
    spec: FermataSpec,
    above: boolean,
  ): void => {
    const glyph = (spec.pointing ? spec.pointing === 'up' : above) ? 'fermataAbove' : 'fermataBelow';
    const { box } = placeMark(fonts, glyph, cx, { center: 0 });
    const placed = above
      ? placeMark(fonts, glyph, cx, {
          bottom: Math.min(-FERMATA_OFFSET, sky.top(systemIndex, staffIndex, box.x0, box.x1) - FERMATA_MIN_DISTANCE),
        })
      : placeMark(fonts, glyph, cx, {
          top: Math.max(
            STAFF_HEIGHT + FERMATA_OFFSET,
            sky.bottom(systemIndex, staffIndex, box.x0, box.x1) + FERMATA_MIN_DISTANCE,
          ),
        });
    const mark: Mark = { el, systemIndex, staffIndex, glyph, cls: 'fermata', ...placed, above, insideSlurs: false };
    sky.add(systemIndex, staffIndex, mark.box);
    marks.push(mark);
  };

  for (const system of justified.systems) {
    for (const measure of system.measures) {
      for (const column of measure.columns) {
        if (isClefColumn(column)) continue;
        for (const el of column.elements) {
          const spec = normalized.events.get(el.id)?.fermata;
          if (!spec) continue;
          const shared = twoVoice.has(`${el.staffIndex}:${el.measureIndex}`);
          const above = spec.placement ? spec.placement === 'above' : defaultAbove(el, shared, lastStaff);
          place(
            el.id,
            system.index,
            el.staffIndex,
            centerOf(el, column.x, measure, system.index, beams, fonts),
            spec,
            above,
          );
        }
      }
      const spec = normalized.staves[0]?.measures[measure.index]?.fermata;
      if (!spec) continue;
      const right = measure.x + measure.width;
      const group = measure.barlineEnd === 'none' ? 0 : endBarlineWidth(fonts, measure.barlineEnd) - BARLINE_PAD;
      const cx = right - group / 2;
      const el = `m${measure.index}.fermata`;
      if (spec.placement !== 'below') place(el, system.index, 0, cx, spec, true);
      if (spec.placement === 'below' || (spec.placement === undefined && lastStaff > 0)) {
        place(el, system.index, lastStaff, cx, spec, false);
      }
    }
  }
  return marks;
}

function centerOf(
  el: VerticalElement,
  x: number,
  measure: PositionedMeasure,
  systemIndex: number,
  beams: BeamsResult,
  fonts: FontContext,
): number {
  if (!el.rest) return chordFrame(el, x, systemIndex, beams, fonts).centerX;
  const { bBoxNE, bBoxSW } = fonts.bbox(el.rest.glyph);
  const restX = el.rest.wholeBar ? wholeBarRestX(measure, el.rest.width) : x;
  return restX + (bBoxNE[0] + bBoxSW[0]) / 2;
}

function defaultAbove(el: VerticalElement, shared: boolean, lastStaff: number): boolean {
  const upper = el.rest ? el.voice === 0 : el.dir === 1;
  if (shared) return upper;
  return lastStaff === 0 || el.staffIndex < lastStaff;
}
