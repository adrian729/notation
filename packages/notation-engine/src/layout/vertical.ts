import type { Diagnostic } from '@polyhymnia/mnx';
import { mensuralStyle, type GlyphStyle } from '@polyhymnia/notation-fonts';
import type { FontContext } from '../font/context.js';
import type {
  ClefSpec,
  Duration,
  DurationBase,
  ElementNote,
  NormalizedMeasure,
  NormalizedScore,
  NoteId,
  StaffPitch,
} from './records.js';
import { accidentalOf, type AccidentalScore } from './accidentals.js';
import { MIDDLE_LINE, clefAt, staffPositionOf } from './staff.js';
import { elementsByStaffMeasureKey, indexElementsByStaffMeasure } from './temporal.js';
import type { TemporalElement, TemporalScore } from './temporal.js';

const STEM_LENGTH = 3.5;

const ACCIDENTAL_GAP = 0.16;
const ACCIDENTAL_COLUMN_GAP = 0.12;
const ACCIDENTAL_PAD = 0.2;
const DOT_GAP = 0.2;
const DOT_SPACING = 0.1;
const BREATH_GAP = 0.35;

const MODERN_NOTEHEAD_GLYPH: Record<DurationBase, string> = {
  breve: 'noteheadDoubleWhole',
  whole: 'noteheadWhole',
  half: 'noteheadHalf',
  quarter: 'noteheadBlack',
  eighth: 'noteheadBlack',
  '16th': 'noteheadBlack',
  '32nd': 'noteheadBlack',
  '64th': 'noteheadBlack',
};

// Both tables are keyed by the whole DurationBase, and both are exhaustive on it.
// Longa and maxima therefore have nowhere to land: the outlines are subset into
// the mensural family, but extending DurationBase is a product decision about
// which note values ear training should offer, so it is not an engraving fix.
const MENSURAL_NOTEHEAD_GLYPH: Record<DurationBase, string> = {
  breve: 'mensuralWhiteBrevis',
  whole: 'mensuralWhiteSemibrevis',
  half: 'mensuralNoteheadMinimaWhite',
  quarter: 'mensuralNoteheadSemiminimaWhite',
  eighth: 'mensuralNoteheadSemiminimaWhite',
  '16th': 'mensuralNoteheadSemiminimaWhite',
  '32nd': 'mensuralNoteheadSemiminimaWhite',
  '64th': 'mensuralNoteheadSemiminimaWhite',
};

const MODERN_REST_GLYPH: Record<DurationBase, string> = {
  breve: 'restDoubleWhole',
  whole: 'restWhole',
  half: 'restHalf',
  quarter: 'restQuarter',
  eighth: 'rest8th',
  '16th': 'rest16th',
  '32nd': 'rest32nd',
  '64th': 'rest64th',
};

const MENSURAL_REST_GLYPH: Record<DurationBase, string> = {
  breve: 'mensuralRestLongaPerfecta',
  whole: 'mensuralRestSemibrevis',
  half: 'mensuralRestMinima',
  quarter: 'mensuralRestSemiminima',
  eighth: 'mensuralRestFusa',
  '16th': 'mensuralRestSemifusa',
  '32nd': 'mensuralRestSemifusa',
  '64th': 'mensuralRestSemifusa',
};

const FLAG_GLYPH: Partial<Record<DurationBase, readonly [string, string]>> = {
  eighth: ['flag8thUp', 'flag8thDown'],
  '16th': ['flag16thUp', 'flag16thDown'],
  '32nd': ['flag32ndUp', 'flag32ndDown'],
  '64th': ['flag64thUp', 'flag64thDown'],
};

const STEMLESS: ReadonlySet<DurationBase> = new Set<DurationBase>(['breve', 'whole']);

export interface AccidentalLayout {
  glyph: string;
  parenthesized: boolean;
  dx: number;
  y: number;
  width: number;
}

export interface NoteheadLayout {
  id: NoteId;
  pitch: StaffPitch;
  staffPosition: number;
  glyph: string;
  width: number;
  dx: number;
  accidental?: AccidentalLayout;
  ledgerLines: readonly number[];
  dots: readonly { dx: number; y: number }[];
}

export interface StemLayout {
  dir: 1 | -1;
  dx: number;
  width: number;
  yTop: number;
  yBottom: number;
  drawn: boolean;
  flag?: { glyph: string; dx: number; y: number };
}

export interface BreathLayout {
  glyph: string;
  dx: number;
  y: number;
}

export interface RestLayout {
  glyph: string;
  y: number;
  width: number;
  wholeBar: boolean;
  dots: readonly { dx: number; y: number }[];
}

export interface VerticalElement {
  id: NoteId;
  kind: 'note' | 'chord' | 'rest';
  source: TemporalElement;
  staffIndex: number;
  measureIndex: number;
  voice: 0 | 1;
  tick: number;
  measureTick: number;
  durationTicks: number;
  duration: Duration;
  noteheads: readonly NoteheadLayout[];
  rest?: RestLayout;
  dir?: 1 | -1;
  stem?: StemLayout;
  breath?: BreathLayout;
  leftWidth: number;
  rightWidth: number;
}

export interface VerticalScore {
  elements: readonly VerticalElement[];
  diagnostics: readonly Diagnostic[];
}

export function vertical(
  normalized: NormalizedScore,
  score: TemporalScore,
  resolved: AccidentalScore,
  fonts: FontContext,
): VerticalScore {
  const diagnostics: Diagnostic[] = [];
  const elements: VerticalElement[] = [];
  const styled: StyledFonts = { fonts, policy: stylePolicy(fonts.style) };
  const twoVoice = twoVoiceMeasures(score);
  const upVoice = computeUpVoice(normalized, score, twoVoice);
  const elementBeam = beamDirectionsByElement(normalized, score, twoVoice, upVoice, diagnostics);
  const elementIndex = indexElementsByStaffMeasure(score);

  for (const staff of normalized.staves) {
    for (const measure of staff.measures) {
      const rows = elementIndex.get(elementsByStaffMeasureKey(staff.index, measure.index)) ?? [];
      const key = measureKey(staff.index, measure.index);
      const shared = twoVoice.has(key);
      const laidOut = rows.map((row) =>
        layOut(row, measure, resolved, shared, upVoice.get(key) ?? 0, elementBeam.get(row.id), styled),
      );
      if (shared) {
        resolveSharedTicks(fonts, laidOut);
        resolveSharedRests(fonts, laidOut, upVoice.get(key) ?? 0);
      }
      elements.push(...laidOut);
    }
  }

  return { elements, diagnostics };
}

function measureKey(staffIndex: number, measureIndex: number): string {
  return `${staffIndex}:${measureIndex}`;
}

function twoVoiceMeasures(score: TemporalScore): Set<string> {
  const keys = new Set<string>();
  for (const el of score.elements) {
    if (el.voice === 1) keys.add(measureKey(el.staffIndex, el.measureIndex));
  }
  return keys;
}

function voiceDirection(voice: 0 | 1, upVoice: 0 | 1): 1 | -1 {
  return voice === upVoice ? 1 : -1;
}

type ClefLookup = (el: TemporalElement) => ClefSpec;

function clefLookup(normalized: NormalizedScore): ClefLookup {
  const byMeasure = new Map<string, NormalizedMeasure>();
  for (const staff of normalized.staves) {
    for (const measure of staff.measures) byMeasure.set(measureKey(staff.index, measure.index), measure);
  }
  return (el) => {
    const measure = byMeasure.get(measureKey(el.staffIndex, el.measureIndex));
    return measure ? clefAt(measure, el.measureTick) : { kind: 'treble' };
  };
}

function computeUpVoice(
  normalized: NormalizedScore,
  score: TemporalScore,
  twoVoice: ReadonlySet<string>,
): Map<string, 0 | 1> {
  const clefOf = clefLookup(normalized);
  const totals = new Map<string, [number, number, number, number]>();
  for (const el of score.elements) {
    if (el.kind === 'rest') continue;
    const key = measureKey(el.staffIndex, el.measureIndex);
    if (!twoVoice.has(key)) continue;
    const clef = clefOf(el);
    const entry = totals.get(key) ?? [0, 0, 0, 0];
    for (const note of el.notes) {
      const pos = staffPositionOf(note.pitch, clef);
      if (el.voice === 0) {
        entry[0] += pos;
        entry[1] += 1;
      } else {
        entry[2] += pos;
        entry[3] += 1;
      }
    }
    totals.set(key, entry);
  }
  const result = new Map<string, 0 | 1>();
  for (const [key, [sum0, count0, sum1, count1]] of totals) {
    if (count0 === 0 && count1 === 0) continue;
    const mean0 = count0 > 0 ? sum0 / count0 : Infinity;
    const mean1 = count1 > 0 ? sum1 / count1 : Infinity;
    result.set(key, mean0 <= mean1 ? 0 : 1);
  }
  return result;
}

interface BeamMembership {
  beamId: string;
  dir: 1 | -1;
}

function beamDirectionsByElement(
  normalized: NormalizedScore,
  score: TemporalScore,
  twoVoice: ReadonlySet<string>,
  upVoice: ReadonlyMap<string, 0 | 1>,
  diagnostics: Diagnostic[],
): Map<NoteId, BeamMembership> {
  const clefOf = clefLookup(normalized);
  const byId = new Map<NoteId, TemporalElement>();
  for (const el of score.elements) byId.set(el.id, el);

  const result = new Map<NoteId, BeamMembership>();
  for (const beam of normalized.beams) {
    const notes = beam.elements
      .map((id) => byId.get(id))
      .filter((el): el is TemporalElement => el !== undefined && el.kind !== 'rest');
    if (notes.length === 0) continue;

    const overrides = notes.map((el) => el.stem).filter((s): s is 'up' | 'down' => s === 'up' || s === 'down');

    let dir: 1 | -1;
    if (overrides.length > 0) {
      const first = overrides[0]!;
      if (overrides.some((o) => o !== first)) {
        diagnostics.push({
          severity: 'warning',
          code: 'mnx-unsupported',
          message: 'mixed stem directions in a beam',
          measureIndex: beam.measureIndex,
          voice: beam.voice,
        });
      }
      dir = first === 'up' ? 1 : -1;
    } else if (twoVoice.has(measureKey(notes[0]!.staffIndex, beam.measureIndex))) {
      dir = voiceDirection(beam.voice, upVoice.get(measureKey(notes[0]!.staffIndex, beam.measureIndex)) ?? 0);
    } else {
      let furthest = 0;
      let below = false;
      let above = false;
      for (const el of notes) {
        const clef = clefOf(el);
        for (const note of el.notes) {
          const pos = staffPositionOf(note.pitch, clef);
          const dist = Math.abs(pos - MIDDLE_LINE);
          if (dist > furthest + 1e-9) {
            furthest = dist;
            below = pos > MIDDLE_LINE;
            above = pos < MIDDLE_LINE;
          } else if (Math.abs(dist - furthest) < 1e-9) {
            below = below || pos > MIDDLE_LINE;
            above = above || pos < MIDDLE_LINE;
          }
        }
      }
      dir = below && !above ? 1 : -1;
    }

    for (const id of beam.elements) result.set(id, { beamId: beam.id, dir });
  }
  return result;
}

function layOut(
  row: TemporalElement,
  measure: NormalizedMeasure,
  resolved: AccidentalScore,
  shared: boolean,
  upVoice: 0 | 1,
  beamInfo: BeamMembership | undefined,
  styled: StyledFonts,
): VerticalElement {
  const { fonts } = styled;
  const duration: Duration = {
    base: row.base,
    dots: row.dots,
    ...(row.tuplet ? { tuplet: row.tuplet } : {}),
  };
  const base: Omit<VerticalElement, 'noteheads' | 'leftWidth' | 'rightWidth'> = {
    id: row.id,
    kind: row.kind,
    source: row,
    staffIndex: row.staffIndex,
    measureIndex: row.measureIndex,
    voice: row.voice,
    tick: row.tick,
    measureTick: row.measureTick,
    durationTicks: row.durationTicks,
    duration,
  };

  if (row.kind === 'rest') {
    const rest = layOutRest(row, duration, shared, upVoice, styled);
    return {
      ...base,
      noteheads: [],
      rest,
      leftWidth: 0,
      rightWidth: rest.width + dotsWidth(fonts, duration.dots),
    };
  }

  const notes = row.notes;
  const glyph = styled.policy.noteheads[duration.base];
  const width = fonts.advanceWidth(glyph);
  const clef = clefAt(measure, row.measureTick);
  const heads = notes.map((note) => ({
    note,
    staffPosition: staffPositionOf(note.pitch, clef),
  }));

  const dir = beamInfo
    ? beamInfo.dir
    : shared && row.stem !== 'up' && row.stem !== 'down'
      ? voiceDirection(row.voice, upVoice)
      : stemDirection(heads, row.stem);
  const shifts = clusterShifts(heads, width, dir);

  const noteheads: NoteheadLayout[] = heads.map((head, i) => {
    const dx = shifts[i] ?? 0;
    const acc = accidentalOf(resolved, head.note.id);
    return {
      id: head.note.id,
      pitch: head.note.pitch,
      staffPosition: head.staffPosition,
      glyph,
      width,
      dx,
      ledgerLines: ledgerLines(head.staffPosition),
      dots: [],
      ...(acc.glyph
        ? {
            accidental: {
              glyph: acc.glyph,
              parenthesized: acc.parenthesized,
              dx: 0,
              y: head.staffPosition,
              width: fonts.advanceWidth(acc.glyph),
            },
          }
        : {}),
    } satisfies NoteheadLayout;
  });

  const leftWidth = packAccidentals(fonts, noteheads);
  const stem = layOutStem(duration, dir, noteheads, row.stem, beamInfo !== undefined, styled);
  const element: VerticalElement = {
    ...base,
    noteheads,
    dir,
    ...(stem ? { stem } : {}),
    leftWidth,
    rightWidth: 0,
  };
  placeRight(fonts, element, headExtent(noteheads), shared);
  return element;
}

function headExtent(noteheads: readonly NoteheadLayout[]): number {
  return noteheads.reduce((max, n) => Math.max(max, n.dx + n.width), 0);
}

function placeRight(fonts: FontContext, element: VerticalElement, extent: number, shared: boolean): void {
  const { dots } = element.duration;
  const below = shared && element.voice === 1;
  for (const head of element.noteheads) {
    head.dots = dotPositions(fonts, dots, extent, head.staffPosition, below);
  }
  const noteRight = extent + dotsWidth(fonts, dots);
  const breath = layOutBreath(element.source.breath, noteRight);
  if (breath) element.breath = breath;
  element.rightWidth = noteRight + (breath ? BREATH_GAP + fonts.advanceWidth(breath.glyph) : 0);
}

function resolveSharedTicks(fonts: FontContext, elements: readonly VerticalElement[]): void {
  const byTick = new Map<number, VerticalElement[]>();
  for (const el of elements) {
    if (el.noteheads.length === 0) continue;
    const bucket = byTick.get(el.tick);
    if (bucket) bucket.push(el);
    else byTick.set(el.tick, [el]);
  }

  for (const group of byTick.values()) {
    const upper = group.find((e) => e.voice === 0);
    const lower = group.find((e) => e.voice === 1);
    if (!upper || !lower) continue;

    const shift = crossVoiceShift(upper, lower);
    if (shift) shiftElement(shift.element, shift.by);

    const extent = Math.max(...group.map((e) => headExtent(e.noteheads)));
    for (const el of group) placeRight(fonts, el, extent, true);

    const leftWidth = packAccidentals(
      fonts,
      group.flatMap((e) => e.noteheads),
    );
    for (const el of group) el.leftWidth = leftWidth;
  }
}

function restRange(fonts: FontContext, el: VerticalElement): [number, number] {
  const bbox = fonts.bbox(el.rest!.glyph);
  return [el.rest!.y - bbox.bBoxNE[1], el.rest!.y - bbox.bBoxSW[1]];
}

function noteRange(fonts: FontContext, el: VerticalElement): [number, number] {
  let top = Infinity;
  let bottom = -Infinity;
  for (const head of el.noteheads) {
    const bbox = fonts.bbox(head.glyph);
    top = Math.min(top, head.staffPosition - bbox.bBoxNE[1]);
    bottom = Math.max(bottom, head.staffPosition - bbox.bBoxSW[1]);
  }
  if (el.stem) {
    top = Math.min(top, el.stem.yTop);
    bottom = Math.max(bottom, el.stem.yBottom);
  }
  return [top, bottom];
}

function rangesOverlap(a: readonly [number, number], b: readonly [number, number]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

function clearRest(fonts: FontContext, el: VerticalElement, avoid: readonly [number, number][], dir: 1 | -1): void {
  const rest = el.rest!;
  const bbox = fonts.bbox(rest.glyph);
  const topOffset = -bbox.bBoxNE[1];
  const bottomOffset = -bbox.bBoxSW[1];
  let y = rest.y;
  let moved = false;
  for (let guard = 0; guard < 40; guard += 1) {
    const range: [number, number] = [y + topOffset, y + bottomOffset];
    if (!avoid.some((a) => rangesOverlap(range, a))) break;
    y += dir * 0.25;
    moved = true;
  }
  if (moved) y = dir === -1 ? Math.floor(y) : Math.ceil(y);
  rest.y = y;
  rest.dots = dotPositions(fonts, rest.dots.length as 0 | 1 | 2, rest.width, y, false);
}

function symmetricClearRests(fonts: FontContext, upEl: VerticalElement, downEl: VerticalElement): void {
  const upBBox = fonts.bbox(upEl.rest!.glyph);
  const downBBox = fonts.bbox(downEl.rest!.glyph);
  const upBottomOffset = -upBBox.bBoxSW[1];
  const downTopOffset = -downBBox.bBoxNE[1];
  let upY = upEl.rest!.y;
  let downY = downEl.rest!.y;
  let moved = false;
  for (let guard = 0; guard < 40; guard += 1) {
    if (upY + upBottomOffset <= downY + downTopOffset) break;
    upY -= 0.25;
    downY += 0.25;
    moved = true;
  }
  if (moved) {
    upY = Math.floor(upY);
    downY = Math.ceil(downY);
  }
  upEl.rest!.y = upY;
  upEl.rest!.dots = dotPositions(fonts, upEl.rest!.dots.length as 0 | 1 | 2, upEl.rest!.width, upY, false);
  downEl.rest!.y = downY;
  downEl.rest!.dots = dotPositions(fonts, downEl.rest!.dots.length as 0 | 1 | 2, downEl.rest!.width, downY, false);
}

function resolveSharedRests(fonts: FontContext, elements: readonly VerticalElement[], upVoice: 0 | 1): void {
  const byTick = new Map<number, VerticalElement[]>();
  for (const el of elements) {
    const bucket = byTick.get(el.tick);
    if (bucket) bucket.push(el);
    else byTick.set(el.tick, [el]);
  }

  for (const group of byTick.values()) {
    const upper = group.find((e) => e.voice === 0);
    const lower = group.find((e) => e.voice === 1);
    if (!upper || !lower) continue;
    const [upEl, downEl] = upVoice === 0 ? [upper, lower] : [lower, upper];
    const upFree = upEl.rest && upEl.source.staffPosition === undefined;
    const downFree = downEl.rest && downEl.source.staffPosition === undefined;

    if (upEl.rest && downEl.rest && upFree && downFree) {
      symmetricClearRests(fonts, upEl, downEl);
      continue;
    }
    if (upFree) clearRest(fonts, upEl, [downEl.rest ? restRange(fonts, downEl) : noteRange(fonts, downEl)], -1);
    if (downFree) clearRest(fonts, downEl, [upEl.rest ? restRange(fonts, upEl) : noteRange(fonts, upEl)], 1);
  }
}

function crossVoiceShift(
  upper: VerticalElement,
  lower: VerticalElement,
): { element: VerticalElement; by: number } | undefined {
  const pairs = upper.noteheads.flatMap((a) => lower.noteheads.map((b) => [a, b] as const));
  const apart = (a: NoteheadLayout, b: NoteheadLayout): number => Math.abs(a.staffPosition - b.staffPosition);

  if (pairs.some(([a, b]) => Math.abs(apart(a, b) - 0.5) < 1e-9)) {
    return { element: upper, by: headExtent(lower.noteheads) };
  }
  const unisons = pairs.filter(([a, b]) => apart(a, b) < 1e-9);
  if (unisons.length === 0) return undefined;
  const identical =
    upper.duration.dots === lower.duration.dots &&
    unisons.every(([a, b]) => a.glyph === b.glyph && a.pitch.alter === b.pitch.alter);
  if (identical) return undefined;
  return { element: lower, by: headExtent(upper.noteheads) };
}

function shiftElement(element: VerticalElement, by: number): void {
  for (const head of element.noteheads) head.dx += by;
  if (element.stem) {
    element.stem.dx += by;
    if (element.stem.flag) element.stem.flag.dx += by;
  }
}

const BREATH_GLYPH: Record<NonNullable<TemporalElement['breath']>, string> = {
  comma: 'breathMarkComma',
  caesura: 'caesura',
};

const BREATH_Y = 0;

function layOutBreath(breath: TemporalElement['breath'], noteRight: number): BreathLayout | undefined {
  if (!breath) return undefined;
  return { glyph: BREATH_GLYPH[breath], dx: noteRight + BREATH_GAP, y: BREATH_Y };
}

const REST_Y: Partial<Record<DurationBase, number>> = {
  whole: 1.0,
};
const REST_BASELINE = MIDDLE_LINE;

function layOutRest(
  row: TemporalElement,
  duration: Duration,
  shared: boolean,
  upVoice: 0 | 1,
  { fonts, policy }: StyledFonts,
): RestLayout {
  const glyph = row.wholeBar ? 'restWhole' : policy.rests[duration.base];
  const anchor = row.wholeBar ? REST_Y.whole! : (REST_Y[duration.base] ?? REST_BASELINE);
  const y = row.staffPosition ?? anchor + (shared ? -voiceDirection(row.voice, upVoice) : 0);
  const width = fonts.advanceWidth(glyph);
  return {
    glyph,
    y,
    width,
    wholeBar: row.wholeBar === true,
    dots: row.wholeBar ? [] : dotPositions(fonts, duration.dots, width, y, false),
  };
}

interface Head {
  note: ElementNote;
  staffPosition: number;
}

function stemDirection(heads: readonly Head[], override: TemporalElement['stem']): 1 | -1 {
  if (override === 'up' || override === 'down') return override === 'up' ? 1 : -1;

  let furthest = 0;
  for (const head of heads) furthest = Math.max(furthest, Math.abs(head.staffPosition - MIDDLE_LINE));
  const extremes = heads.filter((h) => Math.abs(Math.abs(h.staffPosition - MIDDLE_LINE) - furthest) < 1e-9);
  const below = extremes.some((h) => h.staffPosition > MIDDLE_LINE);
  const above = extremes.some((h) => h.staffPosition < MIDDLE_LINE);
  if (below && !above) return 1;
  return -1;
}

function clusterShifts(heads: readonly Head[], width: number, dir: 1 | -1): number[] {
  const pitchKey = (head: Head): string => `${head.staffPosition}:${head.note.pitch.alter}`;
  const distinct = [...new Map(heads.map((head) => [pitchKey(head), head])).values()].sort(
    (a, b) => dir * (b.staffPosition - a.staffPosition || a.note.pitch.alter - b.note.pitch.alter),
  );
  const columnOf = new Map<string, number>();
  const placed: { position: number; column: number }[] = [];
  for (const head of distinct) {
    let column = 0;
    while (placed.some((p) => p.column === column && Math.abs(p.position - head.staffPosition) <= 0.5 + 1e-9)) {
      column += 1;
    }
    placed.push({ position: head.staffPosition, column });
    columnOf.set(pitchKey(head), column);
  }
  return heads.map((head) => dir * columnOf.get(pitchKey(head))! * width);
}

function layOutStem(
  duration: Duration,
  dir: 1 | -1,
  noteheads: readonly NoteheadLayout[],
  stemOverride: TemporalElement['stem'],
  beamed: boolean,
  styled: StyledFonts,
): StemLayout | undefined {
  if (STEMLESS.has(duration.base) || noteheads.length === 0) return undefined;
  const glyph = noteheads[0]!.glyph;
  const thickness = styled.fonts.engravingDefaults.stemThickness;
  const top = Math.min(...noteheads.map((n) => n.staffPosition));
  const bottom = Math.max(...noteheads.map((n) => n.staffPosition));
  const anchor = stemAnchor(styled, glyph, dir, thickness);
  const attachX = anchor ? anchor[0] : dir === 1 ? noteheads[0]!.width : 0;
  const attachY = anchor ? -anchor[1] : 0;

  const yTop = dir === 1 ? top - STEM_LENGTH : top + attachY;
  const yBottom = dir === 1 ? bottom + attachY : bottom + STEM_LENGTH;
  const dx = dir === 1 ? attachX - thickness : attachX;
  const drawn = stemOverride !== 'none';

  const flagPair = beamed ? undefined : FLAG_GLYPH[duration.base];
  const flag = flagPair
    ? {
        glyph: dir === 1 ? flagPair[0] : flagPair[1],
        dx,
        y: dir === 1 ? yTop : yBottom,
      }
    : undefined;

  return { dir, dx, width: thickness, yTop, yBottom, drawn, ...(flag ? { flag } : {}) };
}

/**
 * A round notehead takes its stem at the tangent point SMuFL records in
 * `stemUpSE`/`stemDownNW`. A lozenge notehead instead takes it at the horizontal
 * centre, and SMuFL does not record that: the lozenges carry no anchors, and
 * where one is present it sits on the vertical midline at the bounding-box
 * edge, exactly as for a round head. So the centred attachment is synthesised
 * from the bounding box instead.
 *
 * A lozenge also meets the stem on its diagonal edges, so a stem stopping at the
 * vertex leaves a white wedge between the stem's sides and the head. Burying it
 * exactly to the depth where the lozenge has widened to the stem's own width
 * closes that wedge with nothing to spare: any deeper and the stem reaches into
 * the hollow of a white notehead.
 */
const LOZENGE_NOTEHEADS = new Set(['mensuralNoteheadMinimaWhite', 'mensuralNoteheadSemiminimaWhite']);

function stemAnchor(
  { fonts, policy }: StyledFonts,
  glyph: string,
  dir: 1 | -1,
  thickness: number,
): readonly [number, number] | undefined {
  if (policy.centredStems.has(glyph)) {
    const { bBoxNE, bBoxSW } = fonts.bbox(glyph);
    const halfWidth = (bBoxNE[0] + bBoxSW[0]) / 2;
    const bury = (halfHeight: number): number => (halfHeight * (thickness / 2)) / halfWidth;
    return dir === 1
      ? [halfWidth + thickness / 2, bBoxNE[1] - bury(bBoxNE[1])]
      : [halfWidth - thickness / 2, bBoxSW[1] + bury(-bBoxSW[1])];
  }
  return fonts.anchor(glyph, dir === 1 ? 'stemUpSE' : 'stemDownNW');
}

interface StylePolicy {
  noteheads: Readonly<Record<DurationBase, string>>;
  rests: Readonly<Record<DurationBase, string>>;
  centredStems: ReadonlySet<string>;
}

interface StyledFonts {
  fonts: FontContext;
  policy: StylePolicy;
}

const MODERN_POLICY: StylePolicy = {
  noteheads: MODERN_NOTEHEAD_GLYPH,
  rests: MODERN_REST_GLYPH,
  centredStems: new Set(),
};

const MENSURAL_POLICY: StylePolicy = {
  noteheads: MENSURAL_NOTEHEAD_GLYPH,
  rests: MENSURAL_REST_GLYPH,
  centredStems: LOZENGE_NOTEHEADS,
};

function stylePolicy(style: GlyphStyle): StylePolicy {
  return style === mensuralStyle ? MENSURAL_POLICY : MODERN_POLICY;
}

export function stemX(elementX: number, stem: StemLayout): number {
  return elementX + stem.dx;
}

function ledgerLines(staffPosition: number): number[] {
  const lines: number[] = [];
  if (staffPosition < 0) {
    for (let y = -1; y >= staffPosition - 1e-9; y -= 1) lines.push(y);
  } else if (staffPosition > 4) {
    for (let y = 5; y <= staffPosition + 1e-9; y += 1) lines.push(y);
  }
  return lines;
}

function dotPositions(
  fonts: FontContext,
  dots: 0 | 1 | 2,
  fromX: number,
  y: number,
  below: boolean,
): { dx: number; y: number }[] {
  if (!dots) return [];
  const width = fonts.advanceWidth('augmentationDot');
  const onLine = Math.abs(y - Math.round(y)) < 1e-9;
  const dotY = onLine ? (below ? y + 0.5 : y - 0.5) : y;
  const out: { dx: number; y: number }[] = [];
  for (let i = 0; i < dots; i += 1) {
    out.push({ dx: fromX + DOT_GAP + i * (width + DOT_SPACING), y: dotY });
  }
  return out;
}

function dotsWidth(fonts: FontContext, dots: 0 | 1 | 2): number {
  if (!dots) return 0;
  const width = fonts.advanceWidth('augmentationDot');
  return DOT_GAP + dots * width + (dots - 1) * DOT_SPACING;
}

function packAccidentals(fonts: FontContext, noteheads: readonly NoteheadLayout[]): number {
  const withAccidental = noteheads
    .filter((n) => n.accidental)
    .sort((a, b) => a.staffPosition - b.staffPosition || b.dx - a.dx);
  const headsLeft = Math.min(0, ...noteheads.map((n) => n.dx));
  if (withAccidental.length === 0) return -headsLeft;

  const parensRight = (acc: AccidentalLayout): number =>
    acc.parenthesized ? fonts.advanceWidth('accidentalParensRight') : 0;
  const unitWidth = (acc: AccidentalLayout): number =>
    acc.width + (acc.parenthesized ? fonts.advanceWidth('accidentalParensLeft') + parensRight(acc) : 0);

  const columns: { top: number; bottom: number }[][] = [];
  const assigned: { head: NoteheadLayout; column: number }[] = [];

  for (const head of withAccidental) {
    const acc = head.accidental!;
    const bbox = fonts.bbox(acc.glyph);
    let top = acc.y - bbox.bBoxNE[1];
    let bottom = acc.y - bbox.bBoxSW[1];
    if (acc.parenthesized) {
      const parens = fonts.bbox('accidentalParensLeft');
      top = Math.min(top, acc.y - parens.bBoxNE[1]);
      bottom = Math.max(bottom, acc.y - parens.bBoxSW[1]);
    }
    const span = { top: top - ACCIDENTAL_PAD, bottom: bottom + ACCIDENTAL_PAD };
    let column = 0;
    while (columns[column]?.some((placed) => span.top < placed.bottom && placed.top < span.bottom)) {
      column += 1;
    }
    (columns[column] ??= []).push(span);
    assigned.push({ head, column });
  }

  const widths = columns.map((_, i) =>
    assigned.filter((a) => a.column === i).reduce((max, a) => Math.max(max, unitWidth(a.head.accidental!)), 0),
  );

  for (const { head, column } of assigned) {
    let right = headsLeft - ACCIDENTAL_GAP;
    for (let i = 0; i < column; i += 1) right -= widths[i]! + ACCIDENTAL_COLUMN_GAP;
    head.accidental!.dx = right - parensRight(head.accidental!) - head.accidental!.width;
  }

  return (
    -headsLeft +
    ACCIDENTAL_GAP +
    widths.reduce((sum, w) => sum + w, 0) +
    Math.max(0, widths.length - 1) * ACCIDENTAL_COLUMN_GAP
  );
}
