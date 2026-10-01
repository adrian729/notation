import { modernStyle, type GlyphStyleName, type GlyphTable } from '@polyhymnia/notation-fonts';

export type FontFamily = GlyphStyleName;

/**
 * Family used when the caller does not choose one. Mensural is the house look:
 * the modern family is kept only as an explicit opt-in.
 */
export const DEFAULT_FONT: FontFamily = 'mensural';

export const GLYPH_CODEPOINT: GlyphTable = modernStyle.core;
