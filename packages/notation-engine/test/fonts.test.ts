import { readFileSync } from 'node:fs';
import type { MnxDocument } from '@polyhymnia/mnx';
import type { NotationFont, SmuflMetadata } from '@polyhymnia/notation-fonts';
import modern from '@polyhymnia/notation-fonts/fonts/polyhymnia-notation/metadata.json' with { type: 'json' };
import manuscript from '@polyhymnia/notation-fonts/fonts/polyhymnia-manuscript/metadata.json' with { type: 'json' };
import mensural from '@polyhymnia/notation-fonts/fonts/polyhymnia-mensural/metadata.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';
import { hitTest, layoutScore, previewShapes, type NotationOptions } from '../src/index.js';
import { measure, mnx, note } from './mnx.js';

const doc = JSON.parse(
  readFileSync(new URL('./fixtures/golden-scale-treble.json', import.meta.url), 'utf8'),
) as MnxDocument;
const base = modern as unknown as SmuflMetadata;

function font(name: string, edit: (metadata: SmuflMetadata) => Partial<SmuflMetadata>): NotationFont {
  return { name, src: `${name}.woff2`, metadata: { ...base, ...edit(base) } };
}

const without = <T>(record: Readonly<Record<string, T>>, name: string): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([key]) => key !== name));

const doubled = font('Doubled', (m) => ({
  glyphAdvanceWidths: Object.fromEntries(Object.entries(m.glyphAdvanceWidths).map(([k, v]) => [k, v * 2])),
}));
const partial = font('Partial', (m) => ({
  glyphAdvanceWidths: without(m.glyphAdvanceWidths, 'noteheadBlack'),
  glyphBBoxes: without(m.glyphBBoxes, 'noteheadBlack'),
}));

const metadata = manuscript as unknown as SmuflMetadata;
const ink: NotationFont = { name: metadata.fontName, src: 'manuscript.woff2', metadata };
const plain: NotationFont = {
  ...ink,
  metadata: {
    ...metadata,
    engravingDefaults: {
      ...metadata.engravingDefaults,
      strokeVariation: 0,
      strokeWander: 0,
      stemStroke: undefined,
      beamStroke: undefined,
    },
  },
};

function points(d: string): [number, number][] {
  const coordinates = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  return Array.from({ length: coordinates.length / 2 }, (_, i) => [coordinates[i * 2]!, coordinates[i * 2 + 1]!]);
}

// Intersect the actual emitted polygon with a vertical line. This also works
// on the unmodified four-corner beam, without knowing its drawing algorithm.
function inkSpan(polygon: readonly [number, number][], x: number): [number, number] {
  const ys: number[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!,
      b = polygon[(i + 1) % polygon.length]!;
    if (a[0] === b[0] || x < Math.min(a[0], b[0]) || x > Math.max(a[0], b[0])) continue;
    ys.push(a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]));
  }
  return [Math.min(...ys), Math.max(...ys)];
}

describe('fonts', () => {
  it('bounds manuscript ink while preserving note placement and interaction targets', () => {
    const result = layoutScore(doc);
    const straight = layoutScore(doc, { font: plain });
    expect(result.fonts).toBeUndefined();
    expect(result).toEqual(layoutScore(doc, { font: ink }));
    const rules = (rects: typeof result.rects) => rects.filter((r) => r.cls !== 'stem' && r.cls !== 'barline');
    expect(rules(result.rects).map(({ outline, ...rect }) => rect)).toEqual(rules(straight.rects));
    expect(result.glyphs).toEqual(straight.glyphs);
    expect(result.rects.map((r) => [r.cls, r.el])).toEqual(straight.rects.map((r) => [r.cls, r.el]));
    expect(result.elements).toEqual(straight.elements);
    expect(result.slots).toEqual(straight.slots);
    expect(result.viewBox).toEqual(straight.viewBox);

    const preview = previewShapes(result, {
      measureIndex: 0,
      x: result.measures[0]!.contentX,
      pitch: { step: 'C', octave: 6 },
    });
    expect(preview.rects.length).toBeGreaterThan(0);
    for (const rect of [...result.rects, ...preview.rects]) {
      expect(rect.outline).toMatch(/^M .+ Z$/);
      for (const [x, y] of points(rect.outline!)) {
        expect(x).toBeGreaterThanOrEqual(rect.x - 0.00001);
        expect(x).toBeLessThanOrEqual(rect.x + rect.w + 0.00001);
        expect(y).toBeGreaterThanOrEqual(rect.y - 0.00001);
        expect(y).toBeLessThanOrEqual(rect.y + rect.h + 0.00001);
      }
    }
    const head = Object.values(result.elements).find((e) => e.kind === 'note')!;
    const stem = result.rects.find((r) => r.cls === 'stem' && r.el === head.id)!;
    const contour = points(stem.outline!);
    // The contour begins and ends at the head, even if its ink bounds expand.
    expect((contour[0]![0] + contour.at(-1)![0]) / 2).toBeCloseTo(head.x + head.w / 2);
    expect(hitTest(result, { x: head.x + head.w / 2, y: head.y + head.h / 2 })).toMatchObject({ id: head.id });
  });

  it('keeps an explicit original Mensural font free of fallback pen effects', () => {
    const metadata = mensural as unknown as SmuflMetadata;
    const font: NotationFont = { name: metadata.fontName, metadata, src: 'mensural.woff2' };
    const score = mnx({ time: { count: 1, unit: 4 } }, measure(note('C4', '8'), note('D4', '8')));
    const result = layoutScore(score, { font });
    expect(result.rects.length).toBeGreaterThan(0);
    expect(result.rects.every((r) => r.outline === undefined)).toBe(true);
    const beams = result.paths.filter((p) => p.cls === 'beam');
    expect(beams).toHaveLength(1);
    expect(points(beams[0]!.d)).toHaveLength(4);
  });

  it('keeps both corners of every penned stem inside its beam, in either direction', () => {
    const beamed = mnx(
      { time: { count: 2, unit: 4 } },
      measure(...['C4', 'E4', 'G4', 'E4', 'G5', 'E5', 'C5', 'E5'].map((p) => note(p, '16'))),
    );
    const result = layoutScore(beamed, { font: ink });
    const straight = layoutScore(beamed, { font: plain });
    expect(result.paths).toEqual(layoutScore(beamed, { font: ink }).paths);
    expect(result.elements).toEqual(straight.elements);
    expect(result.slots).toEqual(straight.slots);
    expect(result.paths.map((p) => p.el)).toEqual(straight.paths.map((p) => p.el));
    const beams = result.paths.filter((p) => p.cls === 'beam').map((p) => points(p.d));
    expect(beams).toHaveLength(4);
    const stems = result.rects.filter((r) => r.cls === 'stem');
    expect(stems).toHaveLength(8);
    const directions = new Set<boolean>();
    for (const stem of stems) {
      const contour = points(stem.outline!);
      const corners = contour.slice(contour.length / 2 - 1, contour.length / 2 + 1);
      directions.add(corners[0]![1] < contour[0]![1]);
      expect(
        beams.some((beam) =>
          corners.every(([x, y]) => {
            // Sample just inside vertical end edges of the first/last stems.
            const at = x + (x < stem.x + stem.w / 2 ? 0.0001 : -0.0001);
            const [top, bottom] = inkSpan(beam, at);
            return y >= top - 0.00001 && y <= bottom + 0.00001;
          }),
        ),
        stem.el,
      ).toBe(true);
    }
    expect(directions.size).toBe(2);
  });

  it('reflows the layout from a font with wider glyphs', () => {
    const width = (font?: NotationFont): number =>
      layoutScore(doc, { style: 'modern', maxLastSystemFill: 0, ...(font ? { font } : {}) }).viewBox.w;
    expect(width(doubled)).toBeGreaterThan(width());
  });

  const rows: { options?: NotationOptions; fonts?: readonly string[] }[] = [
    {},
    { options: { style: 'modern', font: doubled } },
    { options: { style: 'modern', font: partial }, fonts: ['Partial', 'PolyhymniaNotation'] },
  ];
  it.each(rows)('lists fonts only when a glyph falls back: $fonts', ({ options, fonts }) => {
    const result = layoutScore(doc, options);
    expect(result.fonts).toEqual(fonts);
    expect(result.glyphs.map((g) => g.font)).toEqual(
      result.glyphs.map((g) => (fonts ? (g.cp === 0xe0a4 ? 1 : 0) : undefined)),
    );
  });
});
