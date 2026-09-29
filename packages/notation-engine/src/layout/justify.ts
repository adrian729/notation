import { DEFAULT_OPTIONS, type NotationOptions } from '../options.js';
import type { Diagnostic } from '@polyhymnia/notation-model';
import { chromeWidth, measureWidth, type HorizontalColumn } from './horizontal.js';
import type { BreakScore, SystemMeasure } from './break.js';

export interface PositionedColumn extends HorizontalColumn {
  xStart: number;
  x: number;
}

export interface PositionedMeasure extends Omit<SystemMeasure, 'columns'> {
  columns: readonly PositionedColumn[];
  x: number;
  width: number;
}

export interface JustifiedSystem {
  index: number;
  measures: readonly PositionedMeasure[];
  width: number;
  naturalWidth: number;
}

export interface JustifiedScore {
  systems: readonly JustifiedSystem[];
  width: number;
  diagnostics: readonly Diagnostic[];
}

export function justify(broken: BreakScore, options?: NotationOptions): JustifiedScore {
  const widthSp = options?.widthSp ?? DEFAULT_OPTIONS.widthSp;
  const maxLastFill = options?.maxLastSystemFill ?? DEFAULT_OPTIONS.maxLastSystemFill;

  const systems: JustifiedSystem[] = [];
  for (const system of broken.systems) {
    const isLast = system.index === broken.systems.length - 1;
    const natural = system.measures.reduce((sum, m, i) => sum + measureWidth(m, i === 0), 0);
    const target = isLast ? Math.max(natural, Math.min(widthSp, maxLastFill * widthSp)) : Math.max(natural, widthSp);
    const slack = Math.max(0, target - natural);
    const totalStretch = system.measures.reduce((sum, m) => sum + m.columns.reduce((s, c) => s + c.stretch, 0), 0);

    let x = 0;
    const measures: PositionedMeasure[] = [];
    for (const measure of system.measures) {
      const measureX = x;
      x += chromeWidth(measure.chrome);
      const columns = measure.columns.map((column): PositionedColumn => {
        const positioned = { ...column, xStart: x, x: x + column.leftWidth };
        const extra = totalStretch > 0 ? (slack * column.stretch) / totalStretch : 0;
        x += column.width + extra;
        return positioned;
      });
      if (measure.columns.length === 0) x += measure.contentWidth;
      x += measure.chrome.endBarlineWidth;
      measures.push({ ...measure, columns, x: measureX, width: x - measureX });
    }

    systems.push({ index: system.index, measures, width: x, naturalWidth: natural });
  }

  return {
    systems,
    width: systems.reduce((max, s) => Math.max(max, s.width), 0),
    diagnostics: [],
  };
}
