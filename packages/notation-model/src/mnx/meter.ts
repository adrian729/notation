export interface Meter {
  readonly beats: number;
  readonly beatType: number;
}

export interface GroupingOptions {
  mergeBeats?: boolean;
  beatGrouping?: Readonly<Record<string, readonly number[]>>;
}

export interface Grouping {
  readonly sizes: readonly number[];
  readonly unit: number;
}

export interface GroupingResult extends Grouping {
  readonly invalid: boolean;
}

function meterKey(meter: Meter): string {
  return `${meter.beats}/${meter.beatType}`;
}

function totalEighths(meter: Meter): number {
  return meter.beats * (8 / meter.beatType);
}

function unitGrouping(beats: number): number[] {
  if (beats === 5) return [3, 2];
  if (beats === 7) return [2, 2, 3];
  const sizes: number[] = [];
  let remaining = beats;
  while (remaining > 3) {
    sizes.push(3);
    remaining -= 3;
  }
  sizes.push(remaining);
  return sizes;
}

function defaultGrouping(meter: Meter, mergeBeats: boolean): Grouping {
  const { beats, beatType } = meter;
  if (beatType === 8) {
    if (beats % 3 === 0) return { sizes: Array<number>(beats / 3).fill(3), unit: 8 };
    return { sizes: unitGrouping(beats), unit: 8 };
  }
  if (beatType === 2 || beatType === 1) {
    const unit = beatType === 2 ? 4 : 8;
    return { sizes: Array<number>(beats).fill(unit), unit: 8 };
  }
  if (beatType === 4 && beats === 2) return { sizes: mergeBeats ? [4] : [2, 2], unit: 8 };
  if (beatType === 4 && beats === 3) return { sizes: mergeBeats ? [6] : [2, 2, 2], unit: 8 };
  if (beatType === 4 && beats === 4) return { sizes: mergeBeats ? [4, 4] : [2, 2, 2, 2], unit: 8 };
  if (beatType > 8) {
    if (beats % 3 === 0) return { sizes: Array<number>(beats / 3).fill(3), unit: beatType };
    return { sizes: unitGrouping(beats), unit: beatType };
  }
  const unit = Math.max(1, Math.round(8 / beatType));
  return { sizes: Array<number>(beats).fill(unit), unit: 8 };
}

export function microGrouping(meter: Meter): Grouping {
  return defaultGrouping(meter, false);
}

export function beatGroupingFor(meter: Meter, opts?: GroupingOptions): GroupingResult {
  const key = meterKey(meter);
  const custom = opts?.beatGrouping?.[key];
  if (custom) {
    const unit = meter.beatType > 8 ? meter.beatType : 8;
    const targetSum = meter.beatType > 8 ? meter.beats : totalEighths(meter);
    const sum = custom.reduce((a, b) => a + b, 0);
    const valid = sum === targetSum && custom.every((n) => Number.isInteger(n) && n > 0);
    if (valid) return { sizes: custom, unit, invalid: false };
    const fallback = defaultGrouping(meter, opts?.mergeBeats ?? true);
    return { sizes: fallback.sizes, unit: fallback.unit, invalid: true };
  }
  const fallback = defaultGrouping(meter, opts?.mergeBeats ?? true);
  return { sizes: fallback.sizes, unit: fallback.unit, invalid: false };
}
