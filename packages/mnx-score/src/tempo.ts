import { noteValueLength, Rational as R } from '@polyhymnia/mnx';
import type { BeatUnit, TempoOverride, TempoSegment } from './types.js';

const DEFAULT_TEMPO_BPM = 120;
const DEFAULT_BEAT_UNIT: BeatUnit = { base: 'quarter', dots: 0 };

export interface TempoEvent {
  tick: number;
  bpm: number;
  beatUnit?: BeatUnit;
}

interface Segment extends TempoSegment {
  secondsPerTick: number;
}

export interface TempoClock {
  segments: readonly TempoSegment[];
  tickToSeconds(tick: number, tempo?: TempoOverride): number;
  secondsToTick(seconds: number, tempo?: TempoOverride): number;
}

export function tempoClock(events: readonly TempoEvent[], divisions: number): TempoClock {
  const segments = buildSegments(events, divisions);
  const segmentsFor = (tempo?: TempoOverride): readonly Segment[] =>
    tempo === undefined
      ? segments
      : buildSegments(
          [{ tick: 0, bpm: tempo.bpm, ...(tempo.beatUnit ? { beatUnit: beatUnitOf(tempo.beatUnit) } : {}) }],
          divisions,
        );

  return {
    segments: segments.map(({ tick, seconds, bpm, beatUnit }) => ({ tick, seconds, bpm, beatUnit })),
    tickToSeconds(tick, tempo) {
      const segs = segmentsFor(tempo);
      const t = Math.max(0, tick);
      let segment = segs[0]!;
      for (const candidate of segs) {
        if (candidate.tick <= t) segment = candidate;
        else break;
      }
      return segment.seconds + (t - segment.tick) * segment.secondsPerTick;
    },
    secondsToTick(seconds, tempo) {
      const segs = segmentsFor(tempo);
      const s = Math.max(0, seconds);
      let segment = segs[0]!;
      for (const candidate of segs) {
        if (candidate.seconds <= s) segment = candidate;
        else break;
      }
      return segment.tick + (s - segment.seconds) / segment.secondsPerTick;
    },
  };
}

function beatUnitOf(value: { base: BeatUnit['base']; dots?: number }): BeatUnit {
  return { base: value.base, dots: value.dots ?? 0 };
}

function buildSegments(tempo: readonly TempoEvent[], divisions: number): Segment[] {
  const events = [...tempo].filter((e) => Number.isFinite(e?.bpm) && e.bpm > 0).sort((a, b) => a.tick - b.tick);
  if (events.length === 0 || (events[0]?.tick ?? 0) > 0) {
    events.unshift({ tick: 0, bpm: DEFAULT_TEMPO_BPM, beatUnit: DEFAULT_BEAT_UNIT });
  }

  const segments: Segment[] = [];
  let seconds = 0;
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i]!;
    const tick = Math.max(0, event.tick);
    const beatUnit = event.beatUnit ?? DEFAULT_BEAT_UNIT;
    const secondsPerTick = 60 / (event.bpm * ticksPerBeat(beatUnit, divisions));
    if (i > 0) {
      const previous = segments[segments.length - 1]!;
      seconds = previous.seconds + (tick - previous.tick) * previous.secondsPerTick;
    }
    segments.push({ tick, seconds, bpm: event.bpm, beatUnit, secondsPerTick });
  }
  return segments;
}

function ticksPerBeat(beatUnit: BeatUnit, divisions: number): number {
  const length = noteValueLength(beatUnit) ?? noteValueLength(DEFAULT_BEAT_UNIT)!;
  return divisions * R.toNumber(length) * 4;
}
