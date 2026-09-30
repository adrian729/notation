import raw from './metadata.json' with { type: 'json' };
import mensuralRaw from './metadata.mensural.json' with { type: 'json' };
import { DEFAULT_FONT, type FontFamily } from './glyphs.js';

export type GlyphName = keyof typeof raw.glyphAdvanceWidths;

export interface GlyphBBox {
  bBoxNE: readonly [number, number];
  bBoxSW: readonly [number, number];
}

export type GlyphAnchors = Readonly<Record<string, readonly [number, number]>>;

export interface EngravingDefaults {
  staffLineThickness: number;
  stemThickness: number;
  beamThickness: number;
  beamSpacing: number;
  legerLineThickness: number;
  legerLineExtension: number;
  thinBarlineThickness: number;
  thickBarlineThickness: number;
  barlineSeparation: number;
  thinThickBarlineSeparation: number;
  repeatBarlineDotSeparation: number;
  tupletBracketThickness: number;
  slurEndpointThickness: number;
  slurMidpointThickness: number;
  tieEndpointThickness: number;
  tieMidpointThickness: number;
  bracketThickness: number;
  subBracketThickness: number;
  hairpinThickness: number;
  octaveLineThickness: number;
  pedalLineThickness: number;
  repeatEndingLineThickness: number;
  arrowShaftThickness: number;
  dashedBarlineThickness: number;
  dashedBarlineDashLength: number;
  dashedBarlineGapLength: number;
  hBarThickness: number;
  lyricLineThickness: number;
  textEnclosureThickness: number;
  textFontFamily: readonly string[];
}

interface FontMetadata {
  fontName: string;
  fontVersion: string;
  engravingDefaults: EngravingDefaults;
  glyphAdvanceWidths: Readonly<Record<string, number>>;
  glyphBBoxes: Readonly<Record<string, GlyphBBox>>;
  glyphsWithAnchors: Readonly<Record<string, GlyphAnchors>>;
}

const fontMetadata: FontMetadata = raw as unknown as FontMetadata;
const mensuralMetadata: FontMetadata = mensuralRaw as unknown as FontMetadata;

function metadataFor(family: FontFamily): FontMetadata {
  return family === 'mensural' ? mensuralMetadata : fontMetadata;
}

export const engravingDefaults: EngravingDefaults = fontMetadata.engravingDefaults;

export function engravingDefaultsFor(family: FontFamily = DEFAULT_FONT): EngravingDefaults {
  return metadataFor(family).engravingDefaults;
}

export function glyphAdvanceWidth(name: GlyphName | string, family: FontFamily = DEFAULT_FONT): number {
  return metadataFor(family).glyphAdvanceWidths[name] ?? 0;
}

const EMPTY_BBOX: GlyphBBox = { bBoxNE: [0, 0], bBoxSW: [0, 0] };

export function glyphBBox(name: GlyphName | string, family: FontFamily = DEFAULT_FONT): GlyphBBox {
  return metadataFor(family).glyphBBoxes[name] ?? EMPTY_BBOX;
}

function glyphAnchors(name: GlyphName | string, family: FontFamily): GlyphAnchors | undefined {
  return metadataFor(family).glyphsWithAnchors[name];
}

export function glyphAnchor(
  name: GlyphName | string,
  anchor: string,
  family: FontFamily = DEFAULT_FONT,
): readonly [number, number] | undefined {
  return glyphAnchors(name, family)?.[anchor];
}
