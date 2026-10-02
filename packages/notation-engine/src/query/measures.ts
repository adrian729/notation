import { isClefColumn } from '../layout/horizontal.js';
import type { PositionedMeasure } from '../layout/justify.js';
import type { ClefSpec } from '../layout/records.js';
import type { MeasureBox, MeasureClefChange, MeasureStaff } from '../layout/types.js';

export interface ContentBounds {
  contentX: number;
  contentRight: number;
}

export function contentBounds(measure: PositionedMeasure): ContentBounds {
  const contentRight = measure.x + measure.width - measure.chrome.endBarlineWidth;
  const contentX = measure.columns.find((column) => !isClefColumn(column))?.xStart ?? contentRight;
  return { contentX, contentRight };
}

function clefChangesOf(measure: PositionedMeasure, staffIndex: number): MeasureClefChange[] {
  return measure.columns
    .filter(isClefColumn)
    .filter((column) => column.tick < measure.endTick)
    .flatMap((column) =>
      column.clefs
        .filter((c) => c.staffIndex === staffIndex)
        .map((c) => ({ x: column.x, tick: column.tick, clef: c.clef })),
    );
}

export function buildMeasureBox(measure: PositionedMeasure, bounds: ContentBounds, multi: boolean): MeasureBox {
  const clefChanges = clefChangesOf(measure, 0);
  const staves = multi
    ? measure.staves.map((staff, s): MeasureStaff => {
        const changes = clefChangesOf(measure, s);
        return { clef: staff.clef, key: staff.key, ...(changes.length > 0 ? { clefChanges: changes } : {}) };
      })
    : undefined;
  return {
    index: measure.index,
    systemIndex: measure.systemIndex,
    x: measure.x,
    w: measure.width,
    contentX: bounds.contentX,
    startTick: measure.startTick,
    capacityTicks: measure.capacityTicks,
    clef: measure.clef,
    key: measure.key,
    ...(clefChanges.length > 0 ? { clefChanges } : {}),
    ...(staves ? { staves } : {}),
  };
}

export function measureStaff(box: MeasureBox, staff: number | undefined): MeasureStaff {
  return box.staves?.[staff ?? 0] ?? box;
}

export function clefAtX(box: MeasureBox, x: number, staff?: number): ClefSpec {
  const { clef: start, clefChanges } = measureStaff(box, staff);
  let clef = start;
  for (const change of clefChanges ?? []) if (x >= change.x) clef = change.clef;
  return clef;
}
