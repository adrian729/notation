import { GRACE_SCALE } from './records.js';
import type { Diagnostic } from '@polyhymnia/mnx';
import type { Timeline } from '@polyhymnia/mnx-score';
import type { EngravingDefaults } from '@polyhymnia/notation-fonts';
import type { FontContext } from '../font/context.js';
import { describePitch, type Duration, type DurationBase, type NoteId, type TimeSpec } from './records.js';
import type { Mark } from './articulations.js';
import type { BeamsResult } from './beams.js';
import type { CurvesResult } from './curves.js';
import type { DynamicsResult } from './dynamics.js';
import type { StaffMargins } from './margins.js';
import { PATH_POINT } from './skyline.js';
import type { TupletsResult } from './tuplets.js';
import { buildMeasureBox, contentBounds, wholeBarRestX } from '../query/measures.js';
import { measureSlots } from '../query/slots.js';
import { COURTESY_LEAD, digitsWidth, isClefColumn, layOutKeyGlyphs } from './horizontal.js';
import type { JustifiedScore, PositionedMeasure } from './justify.js';
import { STAFF_HEIGHT, STAFF_LINES, clefChangeGlyph, clefGlyph, clefGlyphY } from './staff.js';
import type { TemporalScore } from './temporal.js';
import type {
  Box,
  ElementBox,
  EntryPlacement,
  GlyphRun,
  LayoutResult,
  MeasureBox,
  MeasurePlacement,
  PathShape,
  RectShape,
  Slot,
  SystemBox,
} from './types.js';
import { stemX, type NoteheadLayout, type VerticalElement } from './vertical.js';

const TOP_MARGIN = 4;
const BOTTOM_MARGIN = 4;
const SIDE_MARGIN = 1;
const SYSTEM_GAP = 8;
const BRACE_GAP = 0.35;
const BRACE_WIDTH = 0.9;

export interface EmitInput {
  justified: JustifiedScore;
  temporal: TemporalScore;
  timeline: Timeline;
  diagnostics: readonly Diagnostic[];
  beams: BeamsResult;
  tuplets: TupletsResult;
  curves: CurvesResult;
  marks: readonly Mark[];
  dynamics: DynamicsResult;
  margins: readonly StaffMargins[];
}

interface MeasureTime {
  index: number;
  startTick: number;
  endTick: number;
  systemIndex: number;
  x: number;
  w: number;
}

interface Placement {
  systemIndex: number;
  x: number;
  y: number;
  staff?: number;
}

interface Brace {
  scale: number;
  scaleY: number;
  glyphWidth: number;
  left: number;
  bottom: number;
  width: number;
}

export function emit(input: EmitInput, fonts: FontContext): LayoutResult {
  const glyphs: GlyphRun[] = [];
  const rects: RectShape[] = [];
  const paths: PathShape[] = [];
  const elements: Record<string, ElementBox> = {};
  const systems: SystemBox[] = [];
  const measureTimes: MeasureTime[] = [];
  const measures: MeasureBox[] = [];
  const slots: Slot[] = [];
  const placement = new Map<NoteId, Placement>();

  const { margins } = input;
  const staffOffsets = input.dynamics.staffOffsets;
  const staffCount = staffOffsets.length;
  const multi = staffCount > 1;
  const width = Math.max(input.justified.width, 1);
  const marksOf = new Map<NoteId, Mark[]>();
  for (const mark of input.marks) {
    const list = marksOf.get(mark.el);
    if (list) list.push(mark);
    else marksOf.set(mark.el, [mark]);
  }
  const firstMargins = margins[0]!;
  const lastMargins = margins[staffCount - 1]!;
  const topMargin = Math.max(TOP_MARGIN, firstMargins.above);
  const bottomMargin = Math.max(BOTTOM_MARGIN, lastMargins.below);
  const systemGap = Math.max(SYSTEM_GAP, firstMargins.above + lastMargins.below);
  const systemHeight = staffOffsets[staffCount - 1]! + STAFF_HEIGHT;
  const brace = multi ? braceOf(fonts, systemHeight) : null;
  const staffTopsBySystem = new Map<number, readonly number[]>();

  for (const system of input.justified.systems) {
    const systemTop = topMargin + system.index * (systemHeight + systemGap);
    const staffTops = staffOffsets.map((offset) => systemTop + offset);
    staffTopsBySystem.set(system.index, staffTops);
    systems.push({
      index: system.index,
      x: 0,
      y: systemTop,
      w: system.width,
      h: systemHeight,
      ...(multi ? { staves: staffTops.map((y, index) => ({ index, y, h: STAFF_HEIGHT })) } : {}),
    });

    for (const staffTop of staffTops) {
      for (let line = 0; line < STAFF_LINES; line += 1) {
        rects.push(
          centeredRect(0, staffTop + line, system.width, fonts.engravingDefaults.staffLineThickness, 'staff-line'),
        );
      }
    }
    if (brace) emitSystemStart(brace, systemTop, systemHeight, glyphs, rects, fonts);

    for (const measure of system.measures) {
      emitChrome(measure, staffTops, glyphs, fonts);
      emitBarlines(measure, staffTops, glyphs, rects, fonts);
      emitCourtesy(measure, staffTops, glyphs, fonts);
      measureTimes.push({
        index: measure.index,
        startTick: measure.startTick,
        endTick: measure.endTick,
        systemIndex: system.index,
        x: measure.x,
        w: measure.width,
      });

      const bounds = contentBounds(measure);
      measures.push(buildMeasureBox(measure, bounds, multi));
      for (let s = 0; s < staffCount; s += 1) slots.push(...measureSlots(measure, bounds, s, multi));

      measure.columns.forEach((column) => {
        if (isClefColumn(column)) {
          for (const { staffIndex, clef } of column.clefs) {
            const staffTop = staffTops[staffIndex] ?? systemTop;
            glyphs.push(glyphRun(fonts, clefChangeGlyph(clef), column.x, staffTop + clefGlyphY(clef), 'clef-change'));
          }
          return;
        }
        for (const element of column.elements) {
          emitElement(element, {
            x: column.x,
            measure,
            staffTop: staffTops[element.staffIndex] ?? systemTop,
            ...(multi ? { staff: element.staffIndex } : {}),
            systemIndex: system.index,
            glyphs,
            rects,
            elements,
            placement,
            stemOverrides: input.beams.stemOverrides,
            suppressedGraceSlashes: input.beams.suppressedGraceSlashes,
            marks: marksOf.get(element.id) ?? [],
            fonts,
          });
        }
      });
      for (const mark of marksOf.get(`m${measure.index}.fermata`) ?? []) {
        glyphs.push(markRun(fonts, mark, staffTops[mark.staffIndex] ?? systemTop));
      }
    }
  }

  const staffTopOf = (systemIndex: number, staffIndex: number): number =>
    staffTopsBySystem.get(systemIndex)?.[staffIndex] ?? 0;
  for (const poly of input.beams.polygons) {
    const staffTop = staffTopOf(poly.systemIndex, poly.staffIndex);
    paths.push({
      d: pathFrom(poly.points, staffTop),
      cls: 'beam',
      el: poly.el,
    });
  }

  for (const rect of input.tuplets.brackets) {
    const staffTop = staffTopOf(rect.systemIndex, rect.staffIndex);
    rects.push({
      x: rect.x,
      y: staffTop + rect.y,
      w: rect.w,
      h: rect.h,
      cls: 'tuplet-bracket',
      el: rect.el,
    });
  }
  for (const numeral of input.tuplets.numerals) {
    const staffTop = staffTopOf(numeral.systemIndex, numeral.staffIndex);
    glyphs.push(glyphRun(fonts, numeral.name, numeral.x, staffTop + numeral.y, 'tuplet-number', numeral.el));
  }
  for (const curve of input.curves.shapes) {
    const staffTop = staffTopOf(curve.systemIndex, curve.staffIndex);
    paths.push({ d: offsetPathY(curve.d, staffTop), cls: curve.cls, el: curve.el });
  }
  for (const hairpin of input.dynamics.hairpins) {
    const staffTop = staffTopOf(hairpin.systemIndex, hairpin.staffIndex);
    paths.push({ d: offsetPathY(hairpin.d, staffTop), cls: 'hairpin', el: hairpin.el });
  }
  for (const dynamic of input.dynamics.glyphs) {
    const staffTop = staffTopOf(dynamic.systemIndex, dynamic.staffIndex);
    glyphs.push(glyphRun(fonts, dynamic.glyph, dynamic.x, staffTop + dynamic.y, 'dynamic', dynamic.el));
  }

  const height =
    topMargin + Math.max(1, systems.length) * systemHeight + Math.max(0, systems.length - 1) * systemGap + bottomMargin;

  const fontNames = tagFonts(glyphs, fonts);
  const leftMargin = SIDE_MARGIN + (brace?.width ?? 0);
  const markRights = [
    ...input.marks.map((m) => m.box.x1),
    ...input.dynamics.glyphs.map((g) => g.x + fonts.bbox(g.glyph).bBoxNE[0]),
  ];
  const right = Math.max(width, ...markRights) + SIDE_MARGIN;

  return {
    version: 1,
    viewBox: { x: -leftMargin, y: 0, w: right + leftMargin, h: height },
    systems,
    glyphs,
    rects,
    paths,
    elements,
    slots,
    measures,
    timeline: input.timeline,
    placements: placementsOf(placement, measureTimes),
    diagnostics: input.diagnostics,
    ...(fontNames ? { fonts: fontNames } : {}),
  };
}

function braceOf(fonts: FontContext, systemHeight: number): Brace {
  const bbox = fonts.bbox('brace');
  const natural = bbox.bBoxNE[1] - bbox.bBoxSW[1];
  const naturalWidth = bbox.bBoxNE[0] - bbox.bBoxSW[0];
  const scale = naturalWidth > 0 ? BRACE_WIDTH / naturalWidth : 1;
  const scaleY = natural > 0 ? systemHeight / (natural * scale) : 1;
  const glyphWidth = naturalWidth * scale;
  return {
    scale,
    scaleY,
    glyphWidth,
    left: bbox.bBoxSW[0] * scale,
    bottom: bbox.bBoxSW[1] * scale * scaleY,
    width: glyphWidth + BRACE_GAP,
  };
}

function emitSystemStart(
  brace: Brace,
  systemTop: number,
  systemHeight: number,
  glyphs: GlyphRun[],
  rects: RectShape[],
  fonts: FontContext,
): void {
  const thickness = fonts.engravingDefaults.thinBarlineThickness;
  rects.push({ x: 0, y: systemTop, w: thickness, h: systemHeight, cls: 'barline' });
  const x = -BRACE_GAP - brace.glyphWidth - brace.left;
  const y = systemTop + systemHeight + brace.bottom;
  glyphs.push({
    ...glyphRun(fonts, 'brace', x, y, 'brace'),
    scale: brace.scale,
    ...(brace.scaleY !== 1 ? { scaleY: brace.scaleY } : {}),
  });
}

function placementsOf(
  placement: ReadonlyMap<NoteId, Placement>,
  measureTimes: readonly MeasureTime[],
): LayoutResult['placements'] {
  const entries: Record<NoteId, EntryPlacement> = {};
  for (const [id, { x, y, systemIndex, staff }] of placement) {
    entries[id] = { x, y, systemIndex, ...(staff !== undefined ? { staff } : {}) };
  }
  const measures: MeasurePlacement[] = [];
  for (const { index, systemIndex, x, w } of measureTimes) measures[index] = { systemIndex, x, w };
  return { entries, measures };
}

function emitChrome(
  measure: PositionedMeasure,
  staffTops: readonly number[],
  glyphs: GlyphRun[],
  fonts: FontContext,
): void {
  staffTops.forEach((staffTop, s) => {
    const { clef, key } = measure.staves[s] ?? measure;
    let x = measure.x + measure.chrome.startBarlineWidth;

    if (measure.chrome.showClef) {
      if (measure.chrome.staffClefs[s] ?? true) {
        glyphs.push(glyphRun(fonts, clefGlyph(clef), x, staffTop + clefGlyphY(clef), 'clef'));
      }
      x += measure.chrome.clefWidth;
    }

    if (measure.chrome.keyWidth > 0) {
      const layout = layOutKeyGlyphs(fonts, key, clef, measure.chrome.cancelKey, measure.chrome.showKey, x);
      for (const acc of layout.glyphs) {
        glyphs.push(glyphRun(fonts, acc.glyph, acc.x, staffTop + acc.y, 'key-accidental'));
      }
      x = measure.x + measure.chrome.startBarlineWidth + measure.chrome.clefWidth + measure.chrome.keyWidth;
    }

    if (measure.chrome.showTime) emitTimeSignature(measure.time, x, staffTop, glyphs, fonts);
  });
}

function emitCourtesy(
  measure: PositionedMeasure,
  staffTops: readonly number[],
  glyphs: GlyphRun[],
  fonts: FontContext,
): void {
  const courtesy = measure.showCourtesy ? measure.courtesy : null;
  if (!courtesy) return;
  const clefX = measure.x + measure.width + COURTESY_LEAD;
  staffTops.forEach((staffTop, s) => {
    const staff = courtesy.staves[s] ?? courtesy;
    if (staff.showClef) {
      glyphs.push(
        glyphRun(fonts, clefChangeGlyph(staff.clef), clefX, staffTop + clefGlyphY(staff.clef), 'courtesy-clef'),
      );
    }
    const x = clefX + courtesy.clefWidth;
    if (courtesy.showKey) {
      const key = layOutKeyGlyphs(fonts, courtesy.key, staff.clef, courtesy.cancelKey, true, x);
      for (const acc of key.glyphs) {
        glyphs.push(glyphRun(fonts, acc.glyph, acc.x, staffTop + acc.y, 'courtesy-key'));
      }
    }
    if (courtesy.showTime) {
      emitTimeSignature(courtesy.time, x + courtesy.keyWidth, staffTop, glyphs, fonts, 'courtesy-time');
    }
  });
}

function emitTimeSignature(
  time: TimeSpec,
  x: number,
  staffTop: number,
  glyphs: GlyphRun[],
  fonts: FontContext,
  cls = 'time-signature',
): void {
  // Mensural C and O prolation is not drawable yet, and cannot be fixed here: the
  // pinned MNX schema types time.symbol as 'common' | 'cut' only, so no document
  // can carry a prolation sign. The outlines exist in the mensural subset — this
  // needs a schema decision before an engine change, not an engine change now.
  if (time.symbol === 'common' || time.symbol === 'cut') {
    const name = time.symbol === 'cut' ? 'timeSigCutCommon' : 'timeSigCommon';
    glyphs.push(glyphRun(fonts, name, x, staffTop + 2, cls));
    return;
  }
  const numerator = String(Math.max(0, Math.round(time.beats)));
  const denominator = String(Math.max(0, Math.round(time.beatType)));
  const blockWidth = Math.max(digitsWidth(fonts, time.beats), digitsWidth(fonts, time.beatType));
  const centre = x + blockWidth / 2;

  // Numerator and denominator get separate classes so they can be coloured apart:
  // two hues of similar lightness are hard to tell apart at this size.
  emitDigits(numerator, centre, staffTop + 1, `${cls}-numerator`, glyphs, fonts);
  emitDigits(denominator, centre, staffTop + 3, `${cls}-denominator`, glyphs, fonts);
}

function emitDigits(
  digits: string,
  centre: number,
  y: number,
  cls: string,
  glyphs: GlyphRun[],
  fonts: FontContext,
): void {
  const total = [...digits].reduce((sum, d) => sum + fonts.advanceWidth(`timeSig${d}`), 0);
  let x = centre - total / 2;
  for (const digit of digits) {
    const name = `timeSig${digit}`;
    glyphs.push(glyphRun(fonts, name, x, y, cls));
    x += fonts.advanceWidth(name);
  }
}

function emitBarlines(
  measure: PositionedMeasure,
  staffTops: readonly number[],
  glyphs: GlyphRun[],
  rects: RectShape[],
  fonts: FontContext,
): void {
  const e = fonts.engravingDefaults;
  const staffTop = staffTops[0]!;
  const bottom = staffTops[staffTops.length - 1]! + STAFF_HEIGHT;
  const repeatDots = (x: number): void => {
    for (const top of staffTops) {
      glyphs.push(glyphRun(fonts, 'repeatDot', x, top + 1.5, 'repeat-dot'));
      glyphs.push(glyphRun(fonts, 'repeatDot', x, top + 2.5, 'repeat-dot'));
    }
  };
  const line = (x: number, thickness: number): RectShape => ({
    x,
    y: staffTop,
    w: thickness,
    h: bottom - staffTop,
    cls: 'barline',
  });

  if (measure.barlineStart === 'repeat-start') {
    let x = measure.x;
    rects.push(line(x, e.thickBarlineThickness));
    x += e.thickBarlineThickness + e.thinThickBarlineSeparation;
    rects.push(line(x, e.thinBarlineThickness));
    x += e.thinBarlineThickness + e.repeatBarlineDotSeparation;
    repeatDots(x);
  }

  const right = measure.x + measure.width;
  switch (measure.barlineEnd) {
    case 'none':
      break;
    case 'dashed':
      rects.push(...dashes(e, right - e.dashedBarlineThickness, staffTop, bottom));
      break;
    case 'double':
      rects.push(line(right - e.thinBarlineThickness, e.thinBarlineThickness));
      rects.push(line(right - e.thinBarlineThickness * 2 - e.barlineSeparation, e.thinBarlineThickness));
      break;
    case 'final':
      rects.push(line(right - e.thickBarlineThickness, e.thickBarlineThickness));
      rects.push(
        line(
          right - e.thickBarlineThickness - e.thinThickBarlineSeparation - e.thinBarlineThickness,
          e.thinBarlineThickness,
        ),
      );
      break;
    case 'repeat-end': {
      rects.push(line(right - e.thickBarlineThickness, e.thickBarlineThickness));
      const thinX = right - e.thickBarlineThickness - e.thinThickBarlineSeparation - e.thinBarlineThickness;
      rects.push(line(thinX, e.thinBarlineThickness));
      repeatDots(thinX - e.repeatBarlineDotSeparation - fonts.advanceWidth('repeatDot'));
      break;
    }
    default:
      rects.push(line(right - e.thinBarlineThickness, e.thinBarlineThickness));
  }
}

function dashes(e: EngravingDefaults, x: number, staffTop: number, bottom: number): RectShape[] {
  const { dashedBarlineThickness, dashedBarlineDashLength, dashedBarlineGapLength } = e;
  const height = bottom - staffTop;
  const period = dashedBarlineDashLength + dashedBarlineGapLength;
  const count = Math.max(2, Math.round((height + dashedBarlineGapLength) / period));
  const run = count * dashedBarlineDashLength + (count - 1) * dashedBarlineGapLength;
  const first = staffTop + (height - run) / 2;

  const out: RectShape[] = [];
  for (let i = 0; i < count; i += 1) {
    const top = Math.max(staffTop, first + i * period);
    const end = Math.min(bottom, first + i * period + dashedBarlineDashLength);
    if (end - top <= 1e-9) continue;
    out.push({ x, y: top, w: dashedBarlineThickness, h: end - top, cls: 'barline' });
  }
  return out;
}

interface ElementContext {
  x: number;
  measure: PositionedMeasure;
  staffTop: number;
  staff?: number;
  systemIndex: number;
  glyphs: GlyphRun[];
  rects: RectShape[];
  elements: Record<string, ElementBox>;
  placement: Map<NoteId, Placement>;
  stemOverrides?: ReadonlyMap<NoteId, { yTop: number; yBottom: number }>;
  suppressedGraceSlashes: ReadonlySet<NoteId>;
  marks: readonly Mark[];
  fonts: FontContext;
}

function emitElement(element: VerticalElement, ctx: ElementContext): void {
  if (element.rest) {
    emitRest(element, ctx);
    return;
  }
  const { staffTop } = ctx;
  const scale = element.kind === 'grace' ? GRACE_SCALE : 1;
  const glyphStart = ctx.glyphs.length;

  for (const head of element.noteheads) {
    const headX = ctx.x + head.dx;

    if (head.accidental) {
      const accX = ctx.x + head.accidental.dx;
      const accY = staffTop + head.accidental.y;
      if (head.accidental.parenthesized) {
        ctx.glyphs.push(
          glyphRun(
            ctx.fonts,
            'accidentalParensLeft',
            accX - ctx.fonts.advanceWidth('accidentalParensLeft') * scale,
            accY,
            'accidental',
            head.id,
          ),
        );
        ctx.glyphs.push(
          glyphRun(ctx.fonts, 'accidentalParensRight', accX + head.accidental.width, accY, 'accidental', head.id),
        );
      }
      ctx.glyphs.push(glyphRun(ctx.fonts, head.accidental.glyph, accX, accY, 'accidental', head.id));
    }

    const { legerLineExtension, legerLineThickness } = ctx.fonts.engravingDefaults;
    for (const y of head.ledgerLines) {
      ctx.rects.push(
        centeredRect(
          headX - legerLineExtension * scale,
          staffTop + y,
          head.width + 2 * legerLineExtension * scale,
          legerLineThickness * scale,
          'ledger-line',
          head.id,
        ),
      );
    }

    ctx.glyphs.push(glyphRun(ctx.fonts, head.glyph, headX, staffTop + head.staffPosition, 'notehead', head.id));

    for (const dot of head.dots) {
      ctx.glyphs.push(glyphRun(ctx.fonts, 'augmentationDot', ctx.x + dot.dx, staffTop + dot.y, 'dot', head.id));
    }

    ctx.elements[head.id] = noteBox(element, head, headX, ctx);
  }

  const stem = element.stem;
  if (stem?.drawn) {
    const owner = element.noteheads[0]?.id;
    const override = ctx.stemOverrides?.get(element.id);
    const yTop = override?.yTop ?? stem.yTop;
    const yBottom = override?.yBottom ?? stem.yBottom;
    ctx.rects.push({
      x: stemX(ctx.x, stem),
      y: staffTop + yTop,
      w: stem.width,
      h: yBottom - yTop,
      cls: 'stem',
      ...(owner ? { el: owner } : {}),
    });
    if (stem.flag) {
      ctx.glyphs.push(glyphRun(ctx.fonts, stem.flag.glyph, stemX(ctx.x, stem), staffTop + stem.flag.y, 'flag', owner));
    }
  }

  if (element.kind === 'grace' && element.source.slash && stem?.drawn && !ctx.suppressedGraceSlashes.has(element.id)) {
    const tip = ctx.stemOverrides?.get(element.id)?.yTop ?? stem.yTop;
    ctx.glyphs.push(
      glyphRun(
        ctx.fonts,
        'graceNoteSlashStemUp',
        stemX(ctx.x, stem) - 0.5 * scale,
        staffTop + tip + (stem.flag ? 1.33 : 0.8) * scale,
        'grace',
        element.id,
      ),
    );
  }
  if (scale !== 1) {
    for (const glyph of ctx.glyphs.slice(glyphStart)) {
      glyph.scale = scale;
      glyph.cls = 'grace';
    }
  }

  const breath = element.breath;
  if (breath) {
    ctx.glyphs.push(glyphRun(ctx.fonts, breath.glyph, ctx.x + breath.dx, staffTop + breath.y, 'breath', element.id));
  }
  for (const mark of ctx.marks) ctx.glyphs.push(markRun(ctx.fonts, mark, staffTop));

  const first = element.noteheads[0];
  if (first) {
    ctx.placement.set(element.id, {
      systemIndex: ctx.systemIndex,
      x: ctx.x,
      y: staffTop + first.staffPosition,
      ...staffOf(ctx),
    });
  }
}

function emitRest(element: VerticalElement, ctx: ElementContext): void {
  const rest = element.rest!;
  const x = rest.wholeBar ? wholeBarRestX(ctx.measure, rest.width) : ctx.x;
  const y = ctx.staffTop + rest.y;
  ctx.glyphs.push(glyphRun(ctx.fonts, rest.glyph, x, y, 'rest', element.id));
  for (const dot of rest.dots) {
    ctx.glyphs.push(glyphRun(ctx.fonts, 'augmentationDot', x + dot.dx, ctx.staffTop + dot.y, 'dot', element.id));
  }
  for (const mark of ctx.marks) ctx.glyphs.push(markRun(ctx.fonts, mark, ctx.staffTop));

  const bbox = ctx.fonts.bbox(rest.glyph);
  const box: Box = {
    x,
    y: y - bbox.bBoxNE[1],
    w: rest.width,
    h: Math.max(0.5, bbox.bBoxNE[1] - bbox.bBoxSW[1]),
  };
  ctx.elements[element.id] = {
    id: element.id,
    kind: 'rest',
    systemIndex: ctx.systemIndex,
    measureIndex: element.measureIndex,
    voice: element.voice,
    ...staffOf(ctx),
    ...box,
    hitBox: pad(box),
    staffPosition: rest.y,
    tick: element.tick,
    durationTicks: element.durationTicks,
    label: restLabel(element, rest.wholeBar),
    eventId: element.id,
  };
  ctx.placement.set(element.id, { systemIndex: ctx.systemIndex, x, y, ...staffOf(ctx) });
}

function noteBox(element: VerticalElement, head: NoteheadLayout, headX: number, ctx: ElementContext): ElementBox {
  const scale = element.kind === 'grace' ? GRACE_SCALE : 1;
  const box: Box = {
    x: headX,
    y: ctx.staffTop + head.staffPosition - 0.5 * scale,
    w: head.width,
    h: scale,
  };
  return {
    id: head.id,
    kind: element.kind === 'grace' ? 'grace' : element.kind === 'chord' ? 'chord' : 'note',
    systemIndex: ctx.systemIndex,
    measureIndex: element.measureIndex,
    voice: element.voice,
    ...staffOf(ctx),
    ...box,
    hitBox: pad(box),
    staffPosition: head.staffPosition,
    tick: element.tick,
    durationTicks: element.durationTicks,
    label: `${describePitch(head.pitch)}, ${describeDuration(element.duration, 'note')}, measure ${element.measureIndex + 1}`,
    eventId: element.id,
    pitch: head.pitch,
  };
}

function staffOf(ctx: ElementContext): { staff?: number } {
  return ctx.staff !== undefined ? { staff: ctx.staff } : {};
}

function pad(box: Box): Box {
  return { x: box.x - 0.15, y: box.y - 0.15, w: box.w + 0.3, h: box.h + 0.3 };
}

const BASE_NAME: Record<DurationBase, string> = {
  breve: 'breve',
  whole: 'whole',
  half: 'half',
  quarter: 'quarter',
  eighth: 'eighth',
  '16th': 'sixteenth',
  '32nd': 'thirty-second',
  '64th': 'sixty-fourth',
};

export function describeDuration(duration: Duration, kind: 'note' | 'rest'): string {
  const dots = duration.dots === 1 ? 'dotted ' : duration.dots === 2 ? 'double dotted ' : '';
  return `${dots}${BASE_NAME[duration.base] ?? 'quarter'} ${kind}`;
}

function restLabel(element: VerticalElement, wholeBar: boolean): string {
  const what = wholeBar ? 'whole-bar rest' : describeDuration(element.duration, 'rest');
  return `${what}, measure ${element.measureIndex + 1}`;
}

function offsetPathY(d: string, dy: number): string {
  if (dy === 0) return d;
  return d.replace(PATH_POINT, (_match, x: string, y: string) => `${x},${(Number(y) + dy).toFixed(3)}`);
}

function pathFrom(points: readonly (readonly [number, number])[], staffTop: number): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${(staffTop + y).toFixed(3)}`).join(' ') + ' Z';
}

function markRun(fonts: FontContext, mark: Mark, staffTop: number): GlyphRun {
  return glyphRun(fonts, mark.glyph, mark.x, staffTop + mark.y, mark.cls, mark.el);
}

export function glyphRun(fonts: FontContext, name: string, x: number, y: number, cls: string, el?: NoteId): GlyphRun {
  const resolved = fonts.resolveGlyph(name);
  return {
    x,
    y,
    cp: resolved?.codepoint ?? 0,
    cls,
    ...(el ? { el } : {}),
    ...(resolved && resolved.font > 0 ? { font: resolved.font } : {}),
  };
}

export function tagFonts(glyphs: readonly GlyphRun[], fonts: FontContext): readonly string[] | undefined {
  if (!glyphs.some((g) => g.font !== undefined)) return undefined;
  for (const g of glyphs) g.font ??= 0;
  return fonts.fonts.map((font) => font.name);
}

function centeredRect(x: number, y: number, w: number, thickness: number, cls: string, el?: NoteId): RectShape {
  return { x, y: y - thickness / 2, w, h: thickness, cls, ...(el ? { el } : {}) };
}
