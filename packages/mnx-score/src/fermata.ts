import type { FermataDuration } from '@polyhymnia/mnx';
import type { Timeline, TempoOverride } from './types.js';

const FACTORS: Record<FermataDuration, number> = {
  none: 1,
  veryShort: 1.25,
  short: 1.5,
  auto: 2,
  normal: 2,
  long: 3,
  veryLong: 4,
};

export function fermataFactor(duration?: FermataDuration): number {
  return duration ? FACTORS[duration] : 1;
}

export function fermataClock(
  timeline: Timeline,
  tempo?: TempoOverride,
): {
  tickToSeconds(tick: number): number;
  secondsToTick(seconds: number): number;
} {
  const base = (tick: number): number => timeline.writtenTickToSeconds(tick, tempo);
  const intervals = timeline.entries
    .filter((e) => e.fermata && e.durationTicks > 0)
    .map((e) => ({
      from: e.tick,
      to: e.tick + e.durationTicks,
      factor: FACTORS[e.fermata!],
    }));
  for (const measure of timeline.measures) {
    if (!measure.fermata) continue;
    intervals.push({
      from: Math.max(measure.startTick, measure.endTick - timeline.divisions),
      to: measure.endTick,
      factor: FACTORS[measure.fermata],
    });
  }
  const boundaries = [...new Set(intervals.flatMap((i) => [i.from, i.to]))].sort((a, b) => a - b);
  let extra = 0;
  const spans: { from: number; to: number; start: number; end: number; factor: number; extra: number }[] = [];
  for (let i = 0; i + 1 < boundaries.length; i += 1) {
    const from = boundaries[i]!;
    const to = boundaries[i + 1]!;
    const factor = Math.max(1, ...intervals.filter((s) => s.from <= from && s.to >= to).map((s) => s.factor));
    const duration = base(to) - base(from);
    spans.push({ from, to, start: base(from) + extra, end: base(from) + extra + duration * factor, factor, extra });
    extra += duration * (factor - 1);
  }
  return {
    tickToSeconds(tick) {
      const span = spans.find((s) => tick < s.to);
      if (!span) return base(tick) + extra;
      if (tick < span.from) return base(tick) + span.extra;
      return span.start + (base(tick) - base(span.from)) * span.factor;
    },
    secondsToTick(seconds) {
      const span = spans.find((s) => seconds < s.end);
      if (!span) return timeline.secondsToWrittenTick(seconds - extra, tempo);
      if (seconds < span.start) return timeline.secondsToWrittenTick(seconds - span.extra, tempo);
      return timeline.secondsToWrittenTick(base(span.from) + (seconds - span.start) / span.factor, tempo);
    },
  };
}
