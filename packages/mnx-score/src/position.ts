import { Rational as R } from '@polyhymnia/mnx';
import type { Diagnostic } from '@polyhymnia/mnx';
import { fractionOf } from './read.js';
import { asObject } from './report.js';
import type { PositionTick, Timeline, TimelineMeasure } from './types.js';

export function positionTick(timeline: Timeline, measureIndex: number, position: unknown): PositionTick {
  const measure = timeline.measures.find((m) => m.index === measureIndex);
  if (!measure) {
    return {
      tick: 0,
      measureTick: 0,
      diagnostic: invalid(`Measure ${measureIndex} does not exist; a position in it is placed at tick 0.`),
    };
  }
  if (position === undefined) return at(measure, 0);
  const raw = asObject(position)?.fraction;
  const fraction = fractionOf(raw);
  if (!fraction) {
    return {
      ...at(measure, 0),
      diagnostic: invalid(
        `Measure ${measureIndex} has a position with an unreadable fraction ${JSON.stringify(raw)}; placed at the measure start.`,
        measureIndex,
      ),
    };
  }
  const capacity = measure.endTick - measure.startTick;
  const ticks = R.toTicks(fraction, timeline.divisions);
  if (ticks > capacity) {
    return {
      ...at(measure, capacity),
      diagnostic: invalid(
        `Measure ${measureIndex} has a position ${JSON.stringify(raw)} past its end; placed at the measure end.`,
        measureIndex,
      ),
    };
  }
  return at(measure, ticks);
}

function at(measure: TimelineMeasure, measureTick: number): PositionTick {
  return { tick: measure.startTick + measureTick, measureTick };
}

function invalid(message: string, measureIndex?: number): Diagnostic {
  return {
    severity: 'warning',
    code: 'invalid-position',
    message,
    ...(measureIndex !== undefined ? { measureIndex } : {}),
  };
}
