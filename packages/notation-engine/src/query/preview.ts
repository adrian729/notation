import type { Pitch as MnxPitch } from '@polyhymnia/mnx';
import { STEP_LETTERS, keyAlterOf, stepNumberOf } from '@polyhymnia/music-theory';
import { fontContext, type FontContext } from '../font/context.js';
import { DEFAULT_FONT, type FontFamily } from '../font/glyphs.js';
import type { NotationOptions } from '../options.js';
import { glyphRun, tagFonts } from '../layout/emit.js';
import type { Alter, StaffPitch, StepNumber } from '../layout/records.js';
import { STAFF_HEIGHT, accidentalGlyph, staffPositionOf } from '../layout/staff.js';
import type { GlyphRun, LayoutResult, RectShape } from '../layout/types.js';

export interface PreviewNote {
  measureIndex: number;
  x: number;
  pitch: MnxPitch;
  voice?: 0 | 1;
}

function toStaffPitch(pitch: MnxPitch): StaffPitch {
  return {
    step: Math.max(0, stepNumberOf(pitch.step)) as StepNumber,
    alter: (pitch.alter ?? 0) as Alter,
    octave: pitch.octave,
  };
}

function ledgerRect(fonts: FontContext, x: number, y: number, width: number): RectShape {
  const extension = fonts.engravingDefaults.legerLineExtension;
  const thickness = fonts.engravingDefaults.legerLineThickness;
  return {
    x: x - extension,
    y: y - thickness / 2,
    w: width + 2 * extension,
    h: thickness,
    cls: 'preview-ledger',
  };
}

export function previewShapes(
  layout: LayoutResult,
  preview: PreviewNote,
  font: FontFamily | Pick<NotationOptions, 'font' | 'style'> = DEFAULT_FONT,
): { glyphs: readonly GlyphRun[]; rects: readonly RectShape[]; fonts?: readonly string[] } {
  const fonts = fontContext(typeof font === 'string' ? { style: font } : font);
  const measureBox = layout.measures.find((m) => m.index === preview.measureIndex);
  if (!measureBox) return { glyphs: [], rects: [] };
  const system = layout.systems.find((s) => s.index === measureBox.systemIndex);
  if (!system) return { glyphs: [], rects: [] };

  const staffPitch = toStaffPitch(preview.pitch);
  const staffPosition = staffPositionOf(staffPitch, measureBox.clef);
  const y = system.y + staffPosition;

  const glyphs: GlyphRun[] = [];
  const rects: RectShape[] = [];

  const noteheadName = 'noteheadBlack';
  glyphs.push(glyphRun(fonts, noteheadName, preview.x, y, 'preview-notehead'));

  const width = fonts.advanceWidth(noteheadName);
  if (staffPosition < 0) {
    for (let pos = -1; pos >= staffPosition - 1e-9; pos -= 1) {
      rects.push(ledgerRect(fonts, preview.x, system.y + pos, width));
    }
  } else if (staffPosition > STAFF_HEIGHT) {
    for (let pos = STAFF_HEIGHT + 1; pos <= staffPosition + 1e-9; pos += 1) {
      rects.push(ledgerRect(fonts, preview.x, system.y + pos, width));
    }
  }

  const keyAlter = keyAlterOf(measureBox.key.fifths, STEP_LETTERS[staffPitch.step]);
  if (staffPitch.alter !== keyAlter) {
    const glyphName = accidentalGlyph(staffPitch.alter);
    const accWidth = fonts.advanceWidth(glyphName);
    glyphs.push(glyphRun(fonts, glyphName, preview.x - accWidth - 0.2, y, 'preview-accidental'));
  }

  const fontNames = tagFonts(glyphs, fonts);
  return { glyphs, rects, ...(fontNames ? { fonts: fontNames } : {}) };
}
