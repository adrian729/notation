import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { parsePitch } from '@polyhymnia/mnx';
import { NotesReveal } from '@/components/presets/NotesReveal';
import { fittingMeter, scalePitches } from '@/components/presets/shared';

const names = (root: string, scale: Parameters<typeof scalePitches>[1], desc = false) =>
  scalePitches(parsePitch(root), scale, desc).map(
    (p) => p.step + (p.alter ? (p.alter > 0 ? '#'.repeat(p.alter) : 'b'.repeat(-p.alter)) : '') + p.octave,
  );

describe('scale spelling', () => {
  it('spells the major scale with one letter per degree', () => {
    expect(names('D4', 'major')).toEqual(['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5']);
  });

  it('raises only the 7th in harmonic minor', () => {
    expect(names('A3', 'harmonicMinor')).toEqual(['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G#4', 'A4']);
  });

  it('uses the classical descending form for melodic minor', () => {
    expect(names('A3', 'melodicMinor')).toEqual(['A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G#4', 'A4']);
    expect(names('A3', 'melodicMinor', true)).toEqual(['A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3']);
  });

  it('reverses the same pitch set for every other scale', () => {
    expect(names('C4', 'major', true)).toEqual(names('C4', 'major').reverse());
  });
});

describe('fittingMeter', () => {
  it('fits the meter to the content so no padding rest is invented', () => {
    expect(fittingMeter({ base: 'quarter' }, 8)).toEqual({ count: 8, unit: 4 });
    expect(fittingMeter({ base: 'eighth' }, 8)).toEqual({ count: 4, unit: 4 });
    expect(fittingMeter({ base: 'quarter' }, 1)).toEqual({ count: 1, unit: 4 });
  });
});

describe('<NotesReveal labels>', () => {
  it('places labels in event order at increasing horizontal positions', () => {
    const html = renderToStaticMarkup(
      <NotesReveal pitches={['C4', 'E4', 'G4']} mode="melodic" clef="treble" labels={['one', 'two', 'three']} />,
    );
    const labels = [...html.matchAll(/class="pn-label" style="left:([\d.]+)%[^"]*">([^<]*)</g)];

    expect(labels.map((l) => l[2])).toEqual(['one', 'two', 'three']);
    const lefts = labels.map((l) => parseFloat(l[1]!));
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    expect(new Set(lefts).size).toBe(3);
  });
});
