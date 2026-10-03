import type { Clef, MeasureGlobal, PartMeasure } from '@polyhymnia/mnx';
import type { ClefSpec, KeySpec, NormalizedMeasure } from './records.js';
import { asArray, asObject, type Reader } from './normalize-reader.js';

const BARLINES: Partial<Record<string, NormalizedMeasure['barlineEnd']>> = {
  regular: 'single',
  double: 'double',
  dashed: 'dashed',
  final: 'final',
  noBarline: 'none',
};

export function resolveClef(value: unknown, measureIndex: number, reader: Reader): ClefSpec | null {
  const clef = asObject(value) as Partial<Clef> | undefined;
  if (!clef) return null;
  const { sign, staffPosition } = clef;
  let kind: ClefSpec['kind'] | undefined;
  if (sign === 'G' && staffPosition === -2) kind = 'treble';
  else if (sign === 'F' && staffPosition === 2) kind = 'bass';
  else if (sign === 'C' && staffPosition === 0) kind = 'alto';
  else if (sign === 'C' && staffPosition === 2) kind = 'tenor';

  if (!kind) {
    if (sign === 'P') {
      reader.unsupported('percussion clef', measureIndex, 'the previous clef is kept');
      return null;
    }
    const fallback = sign === 'F' ? 'bass' : sign === 'C' ? 'alto' : sign === 'G' ? 'treble' : undefined;
    if (!fallback) {
      reader.unsupported(`unrecognized clef sign ${JSON.stringify(sign)}`, measureIndex, 'the previous clef is kept');
      return null;
    }
    reader.unsupported(
      `${String(sign)} clef on staff position ${String(staffPosition)}`,
      measureIndex,
      `drawn as a ${fallback} clef`,
    );
    kind = fallback;
  }

  for (const key of ['glyph', 'hide', 'showOctave', 'color'] as const) {
    if (clef[key] !== undefined) reader.unsupported(`clef ${key}`, measureIndex, 'ignored');
  }
  const octave = clef.octave ?? 0;
  if (octave === 1 || octave === -1) return { kind, octaveShift: octave };
  if (octave !== 0) {
    reader.unsupported(`clef octave ${String(octave)}`, measureIndex, 'drawn without an octave shift');
  }
  return { kind };
}

export function resolveKey(value: unknown, fallback: KeySpec, measureIndex: number, reader: Reader): KeySpec {
  const fifths = asObject(value)?.fifths;
  if (typeof fifths !== 'number' || !Number.isFinite(fifths)) {
    reader.diagnostics.push({
      severity: 'warning',
      code: 'invalid-key-signature',
      message: `Invalid key signature ${JSON.stringify(value)}; inheriting ${fallback.fifths} fifths.`,
      measureIndex,
    });
    return fallback;
  }
  const clamped = Math.max(-7, Math.min(7, Math.round(fifths)));
  if (clamped !== fifths) {
    reader.unsupported(`key signature with ${fifths} fifths`, measureIndex, `drawn with ${clamped} fifths`);
  }
  return { fifths: clamped };
}

export function barlineEndOf(
  g: MeasureGlobal,
  measureIndex: number,
  reader: Reader,
): { barlineEnd?: NormalizedMeasure['barlineEnd'] } {
  if (g.repeatEnd) {
    const times = asObject(g.repeatEnd)?.times;
    if (typeof times === 'number' && times !== 2) {
      reader.unsupported(`repeat played ${times} times`, measureIndex, 'drawn as a plain end repeat');
    }
    return { barlineEnd: 'repeat-end' };
  }
  const type = asObject(g.barline)?.type;
  if (type === undefined) return {};
  const mapped = typeof type === 'string' ? BARLINES[type] : undefined;
  if (mapped) return { barlineEnd: mapped };
  reader.unsupported(`${String(type)} barline`, measureIndex, 'drawn as a single barline');
  return { barlineEnd: 'single' };
}

export function reportGlobalConstructs(g: MeasureGlobal, measureIndex: number, reader: Reader): void {
  if (g.ending) reader.unsupported('ending', measureIndex, 'not drawn');
  if (g.jump) reader.unsupported('jump', measureIndex, 'not drawn');
  if (g.segno) reader.unsupported('segno', measureIndex, 'not drawn');
  if (g.fine) reader.unsupported('fine', measureIndex, 'not drawn');
  if (g.number !== undefined) reader.unsupported('measure number override', measureIndex, 'ignored');
}

export function reportPartConstructs(pm: Partial<PartMeasure>, measureIndex: number, reader: Reader): void {
  if (asArray(pm.ottavas).length > 0) reader.unsupported('ottavas', measureIndex, 'not drawn');
  if (asArray(pm.arpeggios).length > 0) reader.unsupported('arpeggios', measureIndex, 'not drawn');
  if (asArray(pm.nonArpeggios).length > 0) reader.unsupported('non-arpeggios', measureIndex, 'not drawn');
  if (asArray(pm.staffConfigs).length > 0) reader.unsupported('staff configs', measureIndex, 'ignored');
  if (pm.measureRepeat) reader.unsupported('measure repeat', measureIndex, 'not drawn');
}
