import type { Diagnostic } from '@polyhymnia/notation-model';
import type { MeasureFlows } from '../layout/records.js';

export interface PlaySegment {
  fromTick: number;
  toTick: number;
  playedStartTick: number;
}

interface Span {
  index: number;
  startTick: number;
  endTick: number;
}

export interface PlayOrder {
  segments: readonly PlaySegment[];
  diagnostics: readonly Diagnostic[];
}

const MAX_STEPS = 10000;

export function resolvePlayOrder(flow: MeasureFlows, spans: readonly Span[]): PlayOrder {
  const ordered = [...spans].sort((a, b) => a.startTick - b.startTick);
  if (ordered.length === 0) return { segments: [], diagnostics: [] };
  const written = withPlayedStarts([{ from: ordered[0]!.startTick, to: ordered[ordered.length - 1]!.endTick }]);

  const failure = (construct: string, measureIndex?: number): PlayOrder => ({
    segments: written,
    diagnostics: [
      {
        severity: 'warning',
        code: 'mnx-unsupported',
        message: `Unsupported MNX: ${construct}${measureIndex === undefined ? '' : ` in measure ${measureIndex}`}; playback follows written order.`,
        ...(measureIndex === undefined ? {} : { measureIndex }),
      },
    ],
  });

  const active = flow.some(
    (f) => f.repeatEnd !== undefined || f.ending || f.segno !== undefined || f.fine !== undefined || f.jump || f.invalid,
  );
  if (!active) return { segments: written, diagnostics: [] };

  const invalid = flow.findIndex((f) => f.invalid !== undefined);
  if (invalid >= 0) return failure(flow[invalid]!.invalid!, invalid);

  const indexes = (pick: (f: MeasureFlows[number]) => boolean): number[] =>
    flow.flatMap((f, i) => (pick(f) ? [i] : []));
  const jumps = indexes((f) => f.jump !== undefined);
  const segnos = indexes((f) => f.segno !== undefined);
  const fines = indexes((f) => f.fine !== undefined);
  const hasEndings = flow.some((f) => f.ending);
  const n = Math.min(flow.length, ordered.length);

  if (jumps.length > 1 || (jumps.length === 1 && (segnos.length > 1 || fines.length > 1))) {
    return failure('multiple jumps, segnos or fines');
  }
  let open = false;
  for (let k = 0; k < flow.length; k += 1) {
    if (flow[k]!.repeatStart) {
      if (open) return failure('nested repeats', k);
      open = true;
    }
    if (flow[k]!.repeatEnd !== undefined) open = false;
  }
  if (jumps.length === 1) {
    if (hasEndings) return failure('jump combined with endings', jumps[0]);
    const j = jumps[0]!;
    const jump = flow[j]!.jump!;
    if (segnos.length !== 1 || segnos[0]! > j) return failure('jump without a preceding segno', j);
    if (jump.offset < ordered[j]!.endTick - ordered[j]!.startTick) return failure('jump inside a measure', j);
    if (jump.type === 'dsalfine' && (fines.length !== 1 || fines[0]! < segnos[0]!)) {
      return failure('dal segno al fine without a following fine', j);
    }
  }

  const raw: { from: number; to: number }[] = [];
  const jump = jumps[0];
  const segno = segnos[0];
  const fine = fines[0];
  let jumped = false;
  let repeatStart = 0;
  let pass = 1;
  let leftPass = 0;
  let steps = 0;
  let i = 0;
  let fresh = true;

  while (i < n) {
    steps += 1;
    if (steps > MAX_STEPS) return failure('repeat structure too long to unroll');
    const f = flow[i]!;
    const span = ordered[i]!;
    if (!jumped && fresh && f.repeatStart) {
      repeatStart = i;
      pass = 1;
    }
    fresh = true;
    if (!jumped && f.ending) {
      const number = leftPass > 0 ? leftPass : pass;
      if (!f.ending.numbers.includes(number)) {
        leftPass = 0;
        i += Math.max(1, f.ending.duration);
        continue;
      }
    }
    leftPass = 0;

    let from = span.startTick;
    let to = span.endTick;
    if (jumped && i === segno && segno !== undefined) from += flow[i]!.segno!;
    if (jumped && jump !== undefined && flow[jump]!.jump!.type === 'dsalfine' && i === fine) {
      to = Math.min(to, span.startTick + f.fine!);
      raw.push({ from, to });
      break;
    }
    raw.push({ from, to });

    if (!jumped && i === jump) {
      jumped = true;
      i = segno!;
      continue;
    }
    if (!jumped && f.repeatEnd !== undefined) {
      if (pass < Math.max(f.repeatEnd, lastEndingNumber(flow, i))) {
        pass += 1;
        i = repeatStart;
        fresh = false;
        continue;
      }
      leftPass = pass;
      repeatStart = i + 1;
      pass = 1;
    }
    i += 1;
  }

  return { segments: withPlayedStarts(raw), diagnostics: [] };
}

function lastEndingNumber(flow: MeasureFlows, at: number): number {
  let start = flow.findIndex((f, k) => f.ending !== undefined && k <= at && at < k + Math.max(1, f.ending.duration));
  if (start < 0) start = flow[at + 1]?.ending ? at + 1 : -1;
  let highest = 0;
  while (start >= 0 && start < flow.length && flow[start]!.ending) {
    const ending = flow[start]!.ending!;
    highest = Math.max(highest, ...ending.numbers);
    start += Math.max(1, ending.duration);
  }
  return highest;
}

function withPlayedStarts(raw: readonly { from: number; to: number }[]): PlaySegment[] {
  const merged: { from: number; to: number }[] = [];
  for (const seg of raw) {
    if (seg.to <= seg.from) continue;
    const last = merged[merged.length - 1];
    if (last && last.to === seg.from) last.to = seg.to;
    else merged.push({ ...seg });
  }
  let played = 0;
  return merged.map((seg) => {
    const out = { fromTick: seg.from, toTick: seg.to, playedStartTick: played };
    played += seg.to - seg.from;
    return out;
  });
}
