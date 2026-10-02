import type { GlyphStyleName, NotationFont } from '@polyhymnia/notation-fonts';

export interface NotationOptions {
  divisions?: number;
  font?: NotationFont | readonly NotationFont[];
  style?: GlyphStyleName;
  spacing?: { k?: number; base?: number };
  beaming?: { mergeBeats?: boolean; beatGrouping?: Readonly<Record<string, readonly number[]>> };
  accidentals?: {
    courtesyPolicy?: 'none' | 'next-measure' | 'always';
    parenthesizeCautionary?: boolean;
    insertAlteration?: 'key' | 'natural';
  };
  tuplets?: { showRatio?: boolean };
  changes?: { clefAtBarline?: 'before' | 'after'; restateTimeAfterCourtesy?: boolean };
  widthSp?: number;
  maxLastSystemFill?: number;
}

export const DEFAULT_OPTIONS = {
  divisions: 3360,
  spacing: { k: 0.55, base: 3.2 },
  beaming: { mergeBeats: true },
  accidentals: {
    courtesyPolicy: 'next-measure' as const,
    parenthesizeCautionary: false,
    insertAlteration: 'key' as const,
  },
  tuplets: { showRatio: false },
  changes: { clefAtBarline: 'before' as const, restateTimeAfterCourtesy: true },
  widthSp: 100,
  maxLastSystemFill: 0.65,
} satisfies NotationOptions;
