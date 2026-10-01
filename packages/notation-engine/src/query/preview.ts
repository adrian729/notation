import type { Pitch as MnxPitch } from '@polyhymnia/mnx';
import { engravingDefaults, glyphAdvanceWidth } from '../font/metadata.js';
import { glyphCodepoint } from '../font/glyphs.js';
import { DEFAULT_FONT, type FontFamily } from '../font/glyphs.js';
import { stepNumber, type Alter, type StaffPitch } from '../layout/records.js';
import { STAFF_HEIGHT, accidentalGlyph, keyAlterOf, staffPositionOf } from '../layout/staff.js';
import type { GlyphRun, LayoutResult, RectShape } from '../layout/types.js';

export interface PreviewNote {
  measureIndex: number;
  x: number;
  pitch: MnxPitch;
  voice?: 0 | 1;
}

function toStaffPitch(pitch: MnxPitch): StaffPitch {
  return {
    step: stepNumber(pitch.step) ?? 0,
    alter: (pitch.alter ?? 0) as Alter,
    octave: pitch.octave,
  };
}

function ledgerRect(x: number, y: number, width: number): RectShape {
  const extension = engravingDefaults.legerLineExtension;
  const thickness = engravingDefaults.legerLineThickness;
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
  family: FontFamily = DEFAULT_FONT,
): { glyphs: readonly GlyphRun[]; rects: readonly RectShape[] } {
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
  glyphs.push({ x: preview.x, y, cp: glyphCodepoint(noteheadName, family) ?? 0, cls: 'preview-notehead' });

  const width = glyphAdvanceWidth(noteheadName);
  if (staffPosition < 0) {
    for (let pos = -1; pos >= staffPosition - 1e-9; pos -= 1) {
      rects.push(ledgerRect(preview.x, system.y + pos, width));
    }
  } else if (staffPosition > STAFF_HEIGHT) {
    for (let pos = STAFF_HEIGHT + 1; pos <= staffPosition + 1e-9; pos += 1) {
      rects.push(ledgerRect(preview.x, system.y + pos, width));
    }
  }

  const keyAlter = keyAlterOf(measureBox.key, staffPitch.step);
  if (staffPitch.alter !== keyAlter) {
    const glyphName = accidentalGlyph(staffPitch.alter);
    const accWidth = glyphAdvanceWidth(glyphName);
    glyphs.push({
      x: preview.x - accWidth - 0.2,
      y,
      cp: glyphCodepoint(glyphName, family) ?? 0,
      cls: 'preview-accidental',
    });
  }

  return { glyphs, rects };
}
