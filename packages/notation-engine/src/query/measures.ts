import type { PositionedMeasure } from '../layout/justify.js';
import type { MeasureBox } from '../layout/types.js';

export interface ContentBounds {
  contentX: number;
  contentRight: number;
}

export function contentBounds(measure: PositionedMeasure): ContentBounds {
  const contentRight = measure.x + measure.width - measure.chrome.endBarlineWidth;
  const contentX = measure.columns[0]?.xStart ?? contentRight;
  return { contentX, contentRight };
}

export function buildMeasureBox(measure: PositionedMeasure, bounds: ContentBounds): MeasureBox {
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
  };
}
