import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const THEME = fileURLToPath(new URL('../src/styles/theme.css', import.meta.url));

type Lin = readonly [number, number, number];

function block(css: string, selector: string): Record<string, [number, number, number]> {
  const start = css.indexOf('{', css.indexOf(selector));
  const end = css.indexOf('}', start);
  const out: Record<string, [number, number, number]> = {};
  for (const line of css.slice(start + 1, end).split('\n')) {
    const m = /--([a-z-]+):\s*oklch\(([^)]+)\)/.exec(line);
    if (m) out[m[1]] = m[2].trim().split(/\s+/).map(Number) as [number, number, number];
  }
  return out;
}

// oklch -> linear sRGB, clipped to gamut the way a browser does
function toLinear([L, C, Hdeg]: [number, number, number]): Lin {
  const H = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (v: number) => Math.min(1, Math.max(0, v));
  return [
    clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const toGamma = (lin: Lin): Lin => lin.map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)) as unknown as Lin;
const toLin = (g: Lin): Lin =>
  g.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as unknown as Lin;

const luminance = (lin: Lin) => 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];

function contrast(a: Lin, b: Lin): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

// CSS alpha compositing happens in gamma-encoded sRGB
const over = (fg: Lin, bg: Lin, alpha: number): Lin => {
  const f = toGamma(fg);
  const b = toGamma(bg);
  return toLin(f.map((c, i) => c * alpha + b[i] * (1 - alpha)) as unknown as Lin);
};

const css = readFileSync(THEME, 'utf8');
const THEMES = { light: block(css, ':root'), dark: block(css, '.dark') } as const;
const lin = (t: Record<string, [number, number, number]>, k: string) => toLinear(t[k]);

// WCAG 2.1: 4.5 for body text, 3 for large text and non-text UI/graphics
const TEXT = 4.5;
const LARGE_OR_UI = 3;

const PAIRS: readonly (readonly [string, string, string, number])[] = [
  ['body text on page', 'foreground', 'background', TEXT],
  ['card text on leaf', 'card-foreground', 'card', TEXT],
  ['muted text on page', 'muted-foreground', 'background', TEXT],
  ['muted text on card', 'muted-foreground', 'card', TEXT],
  ['muted text on muted', 'muted-foreground', 'muted', TEXT],
  ['muted text on sunken', 'muted-foreground', 'surface-sunken', TEXT],
  ['secondary button', 'secondary-foreground', 'secondary', TEXT],
  ['accent', 'accent-foreground', 'accent', TEXT],
  ['popover', 'popover-foreground', 'popover', TEXT],
  ['primary button', 'primary-foreground', 'primary', TEXT],
  ['primary button hover', 'primary-foreground', 'primary-hover', TEXT],
  ['primary text on page', 'primary-strong', 'background', TEXT],
  ['primary text on card', 'primary-strong', 'card', TEXT],
  ['primary text on muted', 'primary-strong', 'muted', TEXT],
  ['lapis rubric text on page', 'rubric-strong', 'background', TEXT],
  ['lapis rubric text on card', 'rubric-strong', 'card', TEXT],
  ['lapis rubric text on muted', 'rubric-strong', 'muted', TEXT],
  ['destructive text on page', 'destructive', 'background', TEXT],
  ['destructive text on card', 'destructive', 'card', TEXT],
  ['success text on page', 'success-strong', 'background', TEXT],
  ['success text on card', 'success-strong', 'card', TEXT],
  ['rule on page', 'border', 'background', LARGE_OR_UI],
  ['rule on card', 'border', 'card', LARGE_OR_UI],
  ['rule on sunken', 'border', 'surface-sunken', LARGE_OR_UI],
  ['control border on page', 'input', 'background', LARGE_OR_UI],
  ['focus ring on page', 'ring', 'background', LARGE_OR_UI],
  ['primary fill vs page', 'primary', 'background', LARGE_OR_UI],
];

// alpha-tinted answer tiles, matching answerTiles.ts
const TILES: readonly (readonly [string, string, string, number, number])[] = [
  ['correct tile', 'success-strong', 'success', 0.12, TEXT],
  ['wrong tile', 'destructive', 'destructive', 0.1, TEXT],
];

describe('theme contrast', () => {
  it('computes WCAG ratios correctly', () => {
    expect(contrast([0, 0, 0], [1, 1, 1])).toBeCloseTo(21, 1);
    const grey = toLin([118 / 255, 118 / 255, 118 / 255]) as unknown as Lin;
    expect(contrast(grey, [1, 1, 1])).toBeCloseTo(4.54, 1);
  });

  for (const [theme, tokens] of Object.entries(THEMES)) {
    it(`${theme}: every text and UI pair meets its WCAG minimum`, () => {
      const failures: string[] = [];
      for (const [label, fg, bg, min] of PAIRS) {
        const r = contrast(lin(tokens, fg), lin(tokens, bg));
        if (r < min) failures.push(`${label}: ${r.toFixed(2)}:1 < ${min}`);
      }
      for (const [label, fg, tint, alpha, min] of TILES) {
        const r = contrast(lin(tokens, fg), over(lin(tokens, tint), lin(tokens, 'card'), alpha));
        if (r < min) failures.push(`${label}: ${r.toFixed(2)}:1 < ${min}`);
      }
      expect(failures).toEqual([]);
    });

    it(`${theme}: engraved staff stays legible against the page`, () => {
      const pn = block(css, theme === 'dark' ? '.dark .pn-notation' : '.pn-notation');
      const bg = lin(tokens, 'background');
      // noteheads, staff lines and focus marks are graphical objects: 3:1
      for (const key of ['pn-ink', 'pn-staff', 'pn-focus'] as const) {
        expect({ [key]: contrast(toLinear(pn[key]), bg) }).toEqual({
          [key]: expect.any(Number),
        });
        expect(contrast(toLinear(pn[key]), bg)).toBeGreaterThanOrEqual(3);
      }
    });
  }
});
