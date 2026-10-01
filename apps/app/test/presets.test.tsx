import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NotesReveal } from '@/components/presets/NotesReveal';
import { fittingMeter } from '@/components/presets/shared';

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
