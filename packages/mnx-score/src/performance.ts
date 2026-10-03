import { noteValueLength, Rational as R } from '@polyhymnia/mnx';
import { fermataClock, fermataFactor } from './fermata.js';
import { DEFAULT_VELOCITY } from './dynamics.js';
import type {
  ArticulationKind,
  Performance,
  PerformanceEvent,
  PerformanceOptions,
  Timeline,
  TimelineEntry,
} from './types.js';

interface Sounding {
  head: TimelineEntry;
  durationTicks: number;
  velocity: number;
}

const ACCENT_GAIN: Partial<Record<ArticulationKind, number>> = { accent: 0.1, strongAccent: 0.15 };
const LENGTH_SCALE: Partial<Record<ArticulationKind, number>> = { staccato: 0.5, staccatissimo: 0.25 };

interface PlaybackSpan {
  start: number;
  end: number;
  from: number;
  to: number;
  hold?: boolean;
}

export function performance(timeline: Timeline, options: PerformanceOptions = {}): Performance {
  const clock = fermataClock(timeline, options.tempo);
  const seconds = clock.tickToSeconds;
  const sounding = mergeTies(timeline.entries);
  const events: PerformanceEvent[] = [];
  const spans: PlaybackSpan[] = [];
  let offset = 0;
  for (const segment of timeline.playOrder) {
    const base = seconds(segment.fromTick);
    const groups = new Map<string, TimelineEntry[]>();
    for (const entry of timeline.entries) {
      if (entry.kind !== 'grace' || entry.tick < segment.fromTick || entry.tick >= segment.toTick) continue;
      const key = `${entry.part}:${entry.staff}:${entry.voice}:${entry.tick}`;
      const group = groups.get(key) ?? [];
      group.push(entry);
      groups.set(key, group);
    }
    const lengthOf = (entry: TimelineEntry): number => {
      const duration =
        entry.slash !== false
          ? 0.06
          : timeline.writtenTickToSeconds(
              entry.tick + R.toTicks(noteValueLength({ base: entry.base, dots: entry.dots })!, timeline.divisions),
              options.tempo,
            ) - timeline.writtenTickToSeconds(entry.tick, options.tempo);
      return duration * fermataFactor(entry.fermata);
    };
    const added = new Map<number, number>();
    for (const group of groups.values()) {
      if (group[0]!.graceType !== 'makeTime') continue;
      added.set(
        group[0]!.tick,
        Math.max(
          added.get(group[0]!.tick) ?? 0,
          group.reduce((sum, e) => sum + lengthOf(e), 0),
        ),
      );
    }
    const additions = [...added].sort(([a], [b]) => a - b);
    const at = (tick: number, include = true): number =>
      offset +
      seconds(tick) -
      base +
      additions.reduce(
        (sum, [position, length]) => sum + (position < tick || (include && position === tick) ? length : 0),
        0,
      );
    const local = sounding
      .filter(({ head }) => head.tick >= segment.fromTick && head.tick < segment.toTick)
      .map((sound) => ({
        ...sound,
        start: at(sound.head.tick),
        end: at(Math.min(sound.head.tick + sound.durationTicks, segment.toTick), false),
      }));
    for (const group of groups.values()) {
      group.sort((a, b) => (b.graceIndex ?? 0) - (a.graceIndex ?? 0));
      const head = group[0]!;
      const sameVoice = (e: TimelineEntry): boolean =>
        e.part === head.part && e.staff === head.staff && e.voice === head.voice;
      const following = local.find(
        (s) => sameVoice(s.head) && (s.head.tick >= head.tick || s.head.tick + s.durationTicks > head.tick),
      );
      const previous = local.filter((s) => sameVoice(s.head) && s.head.tick < head.tick).at(-1);
      let length = group.reduce((sum, e) => sum + lengthOf(e), 0);
      let start = at(head.tick);
      if (head.graceType === 'makeTime') {
        start = at(head.tick, false);
      } else if (head.graceType === 'stealPrevious' && previous) {
        length = Math.min(length, Math.max(0, Math.min(previous.end, at(head.tick, false)) - previous.start) / 2);
        start = Math.max(previous.start, at(head.tick, false) - length);
        previous.end = Math.min(previous.end, start);
      } else {
        start = following ? Math.max(at(head.tick), following.start) : start;
        length = following ? Math.min(length, Math.max(0, following.end - start) / 2) : 0;
        if (following && following.head.tick >= head.tick) {
          following.start += length;
        }
      }
      const total = group.reduce((sum, e) => sum + lengthOf(e), 0);
      for (const entry of group) {
        const duration = total > 0 ? (length * lengthOf(entry)) / total : 0;
        for (const note of entry.notes) {
          const velocity = velocityOf(entry);
          events.push({
            id: note.id,
            midi: note.midi,
            startSeconds: start,
            durationSeconds: duration,
            ...(Math.abs(velocity - DEFAULT_VELOCITY) < 1e-9 ? {} : { velocity }),
          });
        }
        start += duration;
      }
    }
    for (const { head, start, end, velocity } of local) {
      const loudness = Math.abs(velocity - DEFAULT_VELOCITY) < 1e-9 ? {} : { velocity };
      for (const note of head.notes) {
        events.push({
          id: note.id,
          midi: note.midi,
          startSeconds: start,
          durationSeconds: Math.max(0, end - start),
          ...loudness,
        });
      }
    }
    let cursor = segment.fromTick;
    for (const [tick, length] of additions) {
      spans.push({ start: at(cursor), end: at(tick, false), from: cursor, to: tick });
      spans.push({ start: at(tick, false), end: at(tick), from: tick, to: tick, hold: true });
      cursor = tick;
    }
    spans.push({ start: at(cursor), end: at(segment.toTick, false), from: cursor, to: segment.toTick });
    offset = at(segment.toTick, false);
  }
  events.sort((a, b) => a.startSeconds - b.startSeconds);
  return {
    events,
    durationSeconds: offset,
    tickAtSeconds: (value) => {
      const s = Math.max(0, value);
      const span = spans.find((span) => s < span.end);
      if (!span) return spans.at(-1)?.to ?? clock.secondsToTick(s);
      return span.hold ? span.from : clock.secondsToTick(seconds(span.from) + s - span.start);
    },
  };
}

function mergeTies(entries: readonly TimelineEntry[]): Sounding[] {
  const voices = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    if (entry.kind === 'space' || entry.kind === 'grace') continue;
    const key = `${entry.part}:${entry.staff}:${entry.voice}`;
    let list = voices.get(key);
    if (!list) {
      list = [];
      voices.set(key, list);
    }
    list.push(entry);
  }
  const merged: Sounding[] = [];
  for (const ordered of voices.values()) {
    let i = 0;
    while (i < ordered.length) {
      let last = i;
      while (last + 1 < ordered.length && tiesInto(ordered[last]!, ordered[last + 1]!)) last += 1;
      const chain = ordered.slice(i, last + 1);
      const end = chain[chain.length - 1]!;
      const durationTicks =
        chain.reduce((sum, e) => sum + e.durationTicks, 0) - end.durationTicks * (1 - lengthScale(end));
      merged.push({ head: ordered[i]!, durationTicks, velocity: velocityOf(ordered[i]!) });
      i = last + 1;
    }
  }
  return merged.sort(
    (a, b) =>
      a.head.tick - b.head.tick ||
      a.head.part - b.head.part ||
      a.head.staff - b.head.staff ||
      a.head.voice - b.head.voice,
  );
}

function lengthScale(entry: TimelineEntry): number {
  if (entry.fermata && entry.fermata !== 'none') return 1;
  return Math.min(1, ...(entry.articulations ?? []).map((kind) => LENGTH_SCALE[kind] ?? 1));
}

function velocityOf(entry: TimelineEntry): number {
  const gain = Math.max(0, ...(entry.articulations ?? []).map((kind) => ACCENT_GAIN[kind] ?? 0));
  return Math.min(1, (entry.dynamicLevel ?? DEFAULT_VELOCITY) + gain);
}

function tiesInto(a: TimelineEntry, b: TimelineEntry): boolean {
  if (a.tick + a.durationTicks !== b.tick) return false;
  const from = a.notes;
  const to = b.notes;
  if (from.length === 0 || from.length !== to.length) return false;
  if (!from.every((n) => n.tie.start)) return false;
  if (!to.every((n) => n.tie.stop)) return false;
  return from.every((n, i) => {
    const m = to[i]!;
    return (
      n.pitch.step === m.pitch.step &&
      (n.pitch.alter ?? 0) === (m.pitch.alter ?? 0) &&
      n.pitch.octave === m.pitch.octave
    );
  });
}
