import type { EngravingDefaults, GlyphBBox, GlyphPoint } from '@polyhymnia/notation-fonts';
import { fontContext } from './context.js';
import { DEFAULT_FONT, type FontFamily } from './glyphs.js';

export const engravingDefaults: EngravingDefaults = fontContext({ style: 'modern' }).engravingDefaults;

export function glyphAdvanceWidth(name: string, style: FontFamily = DEFAULT_FONT): number {
  return fontContext({ style }).advanceWidth(name);
}

export function glyphBBox(name: string, style: FontFamily = DEFAULT_FONT): GlyphBBox {
  return fontContext({ style }).bbox(name);
}

export function glyphAnchor(name: string, anchor: string, style: FontFamily = DEFAULT_FONT): GlyphPoint | undefined {
  return fontContext({ style }).anchor(name, anchor);
}
