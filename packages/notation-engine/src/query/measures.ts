import { isClefColumn } from '../layout/horizontal.js';
import type { PositionedMeasure } from '../layout/justify.js';
import type { ClefSpec } from '../layout/records.js';
import type { MeasureBox, MeasureClefChange } from '../layout/types.js';

export interface ContentBounds {
  contentX: number;
  contentRight: number;
}

export function contentBounds(measure: PositionedMeasure): ContentBounds {
  const contentRight = measure.x + measure.width - measure.chrome.endBarlineWidth;
  const contentX = measure.columns.find((column) => !isClefColumn(column))?.xStart ?? contentRight;
  return { contentX, contentRight };
}

export function buildMeasureBox(measure: PositionedMeasure, bounds: ContentBounds): MeasureBox {
  const clefChanges: MeasureClefChange[] = measure.columns
    .filter((column) => column.clef && column.tick < measure.endTick)
    .map((column) => ({ x: column.x, tick: column.tick, clef: column.clef! }));
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
  };
}

export function clefAtX(box: MeasureBox, x: number): ClefSpec {
  let clef = box.clef;
  for (const change of box.clefChanges ?? []) if (x >= change.x) clef = change.clef;
  return clef;
}

export function clefAtTick(box: MeasureBox, tick: number): ClefSpec {
  let clef = box.clef;
  for (const change of box.clefChanges ?? []) if (tick >= change.tick) clef = change.clef;
  return clef;
}
