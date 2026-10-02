import { DEFAULT_OPTIONS, type NotationOptions } from '../options.js';
import type { Diagnostic } from '@polyhymnia/mnx';
import { measureWidth, type HorizontalMeasure, type HorizontalScore, type MeasureChrome } from './horizontal.js';

export interface SystemMeasure extends HorizontalMeasure {
  systemIndex: number;
  chrome: MeasureChrome;
  showCourtesy: boolean;
}

export interface SystemAssignment {
  index: number;
  measures: readonly SystemMeasure[];
  naturalWidth: number;
}

export interface BreakScore {
  systems: readonly SystemAssignment[];
  diagnostics: readonly Diagnostic[];
}

export function breakSystems(score: HorizontalScore, options?: NotationOptions): BreakScore {
  const widthSp = options?.widthSp ?? DEFAULT_OPTIONS.widthSp;
  const systems: SystemAssignment[] = [];
  let current: SystemMeasure[] = [];
  let width = 0;

  const flush = (): void => {
    const last = current[current.length - 1];
    if (!last) return;
    if (last.courtesy) {
      current[current.length - 1] = { ...last, showCourtesy: true };
      width += last.courtesy.width;
    }
    systems.push({ index: systems.length, measures: current, naturalWidth: width });
    current = [];
    width = 0;
  };

  for (const measure of score.measures) {
    if (current.length > 0 && width + measureWidth(measure, false, true) > widthSp) flush();
    const startsSystem = current.length === 0;
    current.push({
      ...measure,
      systemIndex: systems.length,
      chrome: startsSystem ? measure.startChrome : measure.midChrome,
      showCourtesy: false,
    });
    width += measureWidth(measure, startsSystem);
    if (measure.systemBreak) flush();
  }
  flush();

  return { systems, diagnostics: [] };
}
