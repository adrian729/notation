import type { Performance, PerformanceEvent, PerformanceOptions, Timeline, TimelineEntry } from './types.js';

interface Sounding {
  head: TimelineEntry;
  durationTicks: number;
}

export function performance(timeline: Timeline, options: PerformanceOptions = {}): Performance {
  const { tempo } = options;
  const seconds = (tick: number): number => timeline.writtenTickToSeconds(tick, tempo);
  const sounding = mergeTies(timeline.entries).filter((s) => s.head.kind === 'note' || s.head.kind === 'chord');
  const events: PerformanceEvent[] = [];
  let offset = 0;
  for (const segment of timeline.playOrder) {
    const base = seconds(segment.fromTick);
    for (const { head, durationTicks } of sounding) {
      if (head.tick < segment.fromTick || head.tick >= segment.toTick) continue;
      const startSeconds = offset + seconds(head.tick) - base;
      const end = seconds(Math.min(head.tick + durationTicks, segment.toTick));
      const durationSeconds = end - seconds(head.tick);
      for (const note of head.notes) events.push({ id: note.id, midi: note.midi, startSeconds, durationSeconds });
    }
    offset += seconds(segment.toTick) - base;
  }
  events.sort((a, b) => a.startSeconds - b.startSeconds);
  return {
    events,
    durationSeconds: offset,
    tickAtSeconds: (s) => writtenTickAtSeconds(timeline, s, options),
  };
}

function writtenTickAtSeconds(timeline: Timeline, seconds: number, { tempo }: PerformanceOptions): number {
  const segments = timeline.playOrder;
  if (segments.length === 0) return timeline.secondsToWrittenTick(seconds, tempo);
  const toSeconds = (tick: number): number => timeline.writtenTickToSeconds(tick, tempo);
  let remaining = Math.max(0, seconds);
  for (const segment of segments) {
    const length = toSeconds(segment.toTick) - toSeconds(segment.fromTick);
    if (remaining < length) return timeline.secondsToWrittenTick(toSeconds(segment.fromTick) + remaining, tempo);
    remaining -= length;
  }
  return segments[segments.length - 1]!.toTick;
}

function mergeTies(entries: readonly TimelineEntry[]): Sounding[] {
  const voices = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    if (entry.kind === 'space') continue;
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
      const durationTicks = ordered.slice(i, last + 1).reduce((sum, e) => sum + e.durationTicks, 0);
      merged.push({ head: ordered[i]!, durationTicks });
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
