import {
  FLAT_ORDER,
  keyAlterOf as keyAlterOfLetter,
  SHARP_ORDER,
  STEP_LETTERS,
  stepNumberOf,
} from '@polyhymnia/music-theory';
import { stepIndex, type ClefChange, type ClefSpec, type KeySpec, type StaffPitch } from './records.js';

export const STAFF_LINES = 5;
export const STAFF_HEIGHT = STAFF_LINES - 1;
export const MIDDLE_LINE = STAFF_HEIGHT / 2;

const TOP_LINE_STEP: Record<ClefSpec['kind'], number> = {
  treble: 38,
  bass: 26,
  alto: 32,
  tenor: 30,
};

const CLEF_ANCHOR_STEP: Record<ClefSpec['kind'], number> = {
  treble: 32,
  bass: 24,
  alto: 28,
  tenor: 28,
};

function topLineStep(clef: ClefSpec): number {
  return TOP_LINE_STEP[clef.kind] + 7 * (clef.octaveShift ?? 0);
}

export function staffPositionOf(p: StaffPitch, clef: ClefSpec): number {
  return (topLineStep(clef) - stepIndex(p)) * 0.5;
}

export function stepIndexAt(staffPosition: number, clef: ClefSpec): number {
  return topLineStep(clef) - staffPosition * 2;
}

export function clefGlyph(clef: ClefSpec): string {
  const shift = clef.octaveShift ?? 0;
  switch (clef.kind) {
    case 'treble':
      return shift === -1 ? 'gClef8vb' : shift === 1 ? 'gClef8va' : 'gClef';
    case 'bass':
      return shift === -1 ? 'fClef8vb' : shift === 1 ? 'fClef8va' : 'fClef';
    default:
      return 'cClef';
  }
}

export function clefChangeGlyph(clef: ClefSpec): string {
  if ((clef.octaveShift ?? 0) !== 0) return clefGlyph(clef);
  switch (clef.kind) {
    case 'treble':
      return 'gClefChange';
    case 'bass':
      return 'fClefChange';
    default:
      return 'cClefChange';
  }
}

export function clefAt(measure: { clef: ClefSpec; clefChanges: readonly ClefChange[] }, measureTick: number): ClefSpec {
  let clef = measure.clef;
  for (const change of measure.clefChanges) {
    if (change.tick > measureTick) break;
    clef = change.clef;
  }
  return clef;
}

export function lastClef(measure: { clef: ClefSpec; clefChanges: readonly ClefChange[] }): ClefSpec {
  return measure.clefChanges[measure.clefChanges.length - 1]?.clef ?? measure.clef;
}

export function clefGlyphY(clef: ClefSpec): number {
  return (TOP_LINE_STEP[clef.kind] - CLEF_ANCHOR_STEP[clef.kind]) * 0.5;
}

export function clefEquals(a: ClefSpec, b: ClefSpec): boolean {
  return a.kind === b.kind && (a.octaveShift ?? 0) === (b.octaveShift ?? 0);
}

const TREBLE_SHARP_Y: readonly number[] = [0, 1.5, -0.5, 1, 2.5, 0.5, 2];
const TREBLE_FLAT_Y: readonly number[] = [2, 0.5, 2.5, 1, 3, 1.5, 3.5];

export function keyAlterOf(key: KeySpec, step: number): -1 | 0 | 1 {
  const letter = STEP_LETTERS[step];
  return letter === undefined ? 0 : keyAlterOfLetter(key.fifths, letter);
}

function keyShift(clef: ClefSpec): number {
  const raw = (TOP_LINE_STEP[clef.kind] - TOP_LINE_STEP.treble) * 0.5;
  let best = raw;
  for (let k = -4; k <= 4; k += 1) {
    const candidate = raw + k * 3.5;
    if (Math.abs(candidate) < Math.abs(best)) best = candidate;
  }
  return best;
}

export interface KeyAccidental {
  step: number;
  alter: -1 | 1;
  glyph: string;
  y: number;
}

export function keySignature(key: KeySpec, clef: ClefSpec): readonly KeyAccidental[] {
  const count = Math.min(7, Math.abs(key.fifths));
  if (count === 0) return [];
  const sharps = key.fifths > 0;
  const order = sharps ? SHARP_ORDER : FLAT_ORDER;
  const pattern = sharps ? TREBLE_SHARP_Y : TREBLE_FLAT_Y;
  const shift = keyShift(clef);
  const out: KeyAccidental[] = [];
  for (let i = 0; i < count; i += 1) {
    const step = stepNumberOf(order[i]!);
    let y = pattern[i]! + shift;
    if (clef.kind === 'tenor' && sharps && y < 0) y += 3.5;
    out.push({ step, alter: sharps ? 1 : -1, glyph: sharps ? 'accidentalSharp' : 'accidentalFlat', y });
  }
  return out;
}

export function accidentalGlyph(alter: number): string {
  switch (alter) {
    case -2:
      return 'accidentalDoubleFlat';
    case -1:
      return 'accidentalFlat';
    case 1:
      return 'accidentalSharp';
    case 2:
      return 'accidentalDoubleSharp';
    default:
      return 'accidentalNatural';
  }
}
