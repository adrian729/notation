import type {
  EngravingDefaults,
  GlyphStyle,
  GlyphStyleName,
  NotationFont,
  SmuflMetadata,
} from '@polyhymnia/notation-fonts';
import type { NotationOptions } from '../options.js';
import { DEFAULT_FONT } from './glyphs.js';

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
}

export function fontContext(options: Pick<NotationOptions, 'font' | 'style'> = {}): FontContext {
  throw new Error(`fontContext is not implemented yet (${Object.keys(options).join(',')})`);
}

export function styleOf(options: Pick<NotationOptions, 'font' | 'style'> | undefined): GlyphStyleName {
  return typeof options?.font === 'string' ? options.font : (options?.style ?? DEFAULT_FONT);
}
