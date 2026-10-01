import {
  glyphStyles,
  type EngravingDefaults,
  type GlyphBBox,
  type GlyphPoint,
  type GlyphStyle,
  type GlyphStyleName,
  type NotationFont,
  type SmuflMetadata,
} from '@polyhymnia/notation-fonts';
import modernMetadata from '@polyhymnia/notation-fonts/fonts/polyhymnia-notation/metadata.json' with { type: 'json' };
import mensuralMetadata from '@polyhymnia/notation-fonts/fonts/polyhymnia-mensural/metadata.json' with { type: 'json' };
import type { NotationOptions } from '../options.js';
import { DEFAULT_STYLE } from './glyphs.js';

export interface ResolvedGlyph {
  readonly font: number;
  readonly codepoint: number;
  readonly metadata: SmuflMetadata;
}

export interface FontContext {
  readonly fonts: readonly NotationFont[];
  readonly style: GlyphStyle;
  readonly engravingDefaults: EngravingDefaults;
  resolveGlyph(name: string): ResolvedGlyph | undefined;
  advanceWidth(name: string): number;
  bbox(name: string): GlyphBBox;
  anchor(name: string, anchor: string): GlyphPoint | undefined;
}

function defaultFont(slug: string, metadata: unknown): NotationFont {
  const smufl = metadata as SmuflMetadata;
  return {
    name: smufl.fontName,
    metadata: smufl,
    src: `@polyhymnia/notation-fonts/fonts/${slug}/${slug}.woff2`,
  };
}

export const DEFAULT_FONTS: Readonly<Record<GlyphStyleName, NotationFont>> = {
  modern: defaultFont('polyhymnia-notation', modernMetadata),
  mensural: defaultFont('polyhymnia-mensural', mensuralMetadata),
};

const EMPTY_BBOX: GlyphBBox = { bBoxNE: [0, 0], bBoxSW: [0, 0] };

function hasGlyph(metadata: SmuflMetadata, name: string): boolean {
  return metadata.glyphAdvanceWidths?.[name] !== undefined || metadata.glyphBBoxes?.[name] !== undefined;
}

function fontList(font: NotationOptions['font'], fallback: NotationFont): readonly NotationFont[] {
  const callerFonts: readonly NotationFont[] =
    font === undefined ? [] : Array.isArray(font) ? font : [font as NotationFont];
  const fonts: NotationFont[] = [];
  for (const candidate of [...callerFonts, fallback]) {
    if (!fonts.some((f) => f.name === candidate.name)) fonts.push(candidate);
  }
  return fonts;
}

function createContext(style: GlyphStyleName, font: NotationOptions['font']): FontContext {
  const fallback = DEFAULT_FONTS[style];
  const fonts = fontList(font, fallback);
  const table = glyphStyles[style].glyphs;
  const resolved = new Map<string, ResolvedGlyph | undefined>();

  const resolveGlyph = (name: string): ResolvedGlyph | undefined => {
    if (resolved.has(name)) return resolved.get(name);
    const codepoint = table[name];
    const index = codepoint === undefined ? -1 : fonts.findIndex((f) => hasGlyph(f.metadata, name));
    const glyph = index < 0 ? undefined : { font: index, codepoint: codepoint!, metadata: fonts[index]!.metadata };
    resolved.set(name, glyph);
    return glyph;
  };

  return {
    fonts,
    style: glyphStyles[style],
    engravingDefaults: { ...fallback.metadata.engravingDefaults, ...fonts[0]!.metadata.engravingDefaults },
    resolveGlyph,
    advanceWidth: (name) => resolveGlyph(name)?.metadata.glyphAdvanceWidths?.[name] ?? 0,
    bbox: (name) => resolveGlyph(name)?.metadata.glyphBBoxes?.[name] ?? EMPTY_BBOX,
    anchor: (name, anchor) => resolveGlyph(name)?.metadata.glyphsWithAnchors?.[name]?.[anchor],
  };
}

const DEFAULT_KEY = {};
const contexts: Record<GlyphStyleName, WeakMap<object, FontContext>> = {
  modern: new WeakMap(),
  mensural: new WeakMap(),
};

export function fontContext(options: Pick<NotationOptions, 'font' | 'style'> = {}): FontContext {
  const style = styleOf(options);
  const key = typeof options.font === 'object' ? options.font : DEFAULT_KEY;
  const cached = contexts[style].get(key);
  if (cached) return cached;
  const context = createContext(style, options.font);
  contexts[style].set(key, context);
  return context;
}

export function styleOf(options: Pick<NotationOptions, 'font' | 'style'> | undefined): GlyphStyleName {
  return options?.style ?? DEFAULT_STYLE;
}
