import { noteValueLength } from '@polyhymnia/mnx';
import type { Key, NoteValue, Pitch, Time } from '@polyhymnia/mnx';
import type { FontFamily, LayoutResult } from '@polyhymnia/notation-engine';
import type { CSSProperties } from 'react';
import { scaleFifths, type ScaleName } from '@polyhymnia/music-theory';

export interface RevealBaseProps {
  font?: FontFamily;
  className?: string;
  style?: CSSProperties;
  onLayout?: (layout: LayoutResult) => void;
}

export function fittingMeter(duration: NoteValue, count: number): Time {
  const length = noteValueLength(duration);
  if (!length) throw new RangeError(`Unsupported note value base: ${duration.base}`);
  let noteCount = length.n * count;
  let unit = length.d;
  while (noteCount % 2 === 0 && unit % 2 === 0 && unit > 4) {
    noteCount /= 2;
    unit /= 2;
  }
  return { count: noteCount, unit: unit as Time['unit'] };
}

export function durationKey(duration: NoteValue): string {
  return `${duration.base}.${duration.dots ?? 0}`;
}

export function scaleKey(root: Pitch, scale: ScaleName): Key {
  return { fifths: scaleFifths(root, scale) };
}
