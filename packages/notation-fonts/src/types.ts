export type GlyphPoint = readonly [number, number];

export interface GlyphBBox {
  readonly bBoxNE: GlyphPoint;
  readonly bBoxSW: GlyphPoint;
}

export type GlyphAnchors = Readonly<Record<string, GlyphPoint>>;

export interface EngravingDefaults {
  readonly staffLineThickness: number;
  readonly stemThickness: number;
  readonly beamThickness: number;
  readonly beamSpacing: number;
  readonly legerLineThickness: number;
  readonly legerLineExtension: number;
  readonly thinBarlineThickness: number;
  readonly thickBarlineThickness: number;
  readonly barlineSeparation: number;
  readonly thinThickBarlineSeparation: number;
  readonly repeatBarlineDotSeparation: number;
  readonly tupletBracketThickness: number;
  readonly slurEndpointThickness: number;
  readonly slurMidpointThickness: number;
  readonly tieEndpointThickness: number;
  readonly tieMidpointThickness: number;
  readonly bracketThickness: number;
  readonly subBracketThickness: number;
  readonly hairpinThickness: number;
  readonly octaveLineThickness: number;
  readonly pedalLineThickness: number;
  readonly repeatEndingLineThickness: number;
  readonly arrowShaftThickness: number;
  readonly dashedBarlineThickness: number;
  readonly dashedBarlineDashLength: number;
  readonly dashedBarlineGapLength: number;
  readonly hBarThickness: number;
  readonly lyricLineThickness: number;
  readonly textEnclosureThickness: number;
  readonly textFontFamily: readonly string[];
}

export interface SmuflMetadata {
  readonly fontName: string;
  readonly fontVersion: number | string;
  readonly engravingDefaults: EngravingDefaults;
  readonly glyphAdvanceWidths: Readonly<Record<string, number>>;
  readonly glyphBBoxes: Readonly<Record<string, GlyphBBox>>;
  readonly glyphsWithAnchors: Readonly<Record<string, GlyphAnchors>>;
}

export interface NotationFont {
  readonly name: string;
  readonly metadata: SmuflMetadata;
  readonly src: string;
}
