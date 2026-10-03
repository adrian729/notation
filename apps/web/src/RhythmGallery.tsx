import type { MnxDocument } from '@polyhymnia/mnx';
import { Example } from './Example.js';
import { FontNotation } from './font.js';
import heads from './scores/manuscript-heads.mnx.json';
import flags from './scores/manuscript-single-flags.mnx.json';
import fusas from './scores/manuscript-fusas.mnx.json';
import semifusas from './scores/manuscript-semifusas.mnx.json';

const EXAMPLES = [
  {
    title: 'White and black noteheads',
    caption: 'Semibreve, minims and semiminims: open and filled lozenges, with stems in both directions.',
    score: heads,
  },
  {
    title: 'Single fusas and semifusas',
    caption:
      'First bar: fusas (eighth notes). Second bar: semifusas (sixteenth notes). Both show upward and downward stems with their flags.',
    score: flags,
  },
  {
    title: 'Joined fusas · one beam',
    caption: 'Pairs, a group of four, and a group of eight; upward and downward stems.',
    score: fusas,
  },
  {
    title: 'Joined semifusas · two beams',
    caption: 'Groups of four and eight, followed by dotted fusas with short secondary beams in both directions.',
    score: semifusas,
  },
] as const;

export function RhythmGallery() {
  return (
    <section id="rhythm" aria-labelledby="rhythm-heading">
      <h2 id="rhythm-heading">Noteheads, stems and beams</h2>
      <p className="note">
        Complete notes at score size, including the flags and beams that join the individual symbols.
      </p>
      {EXAMPLES.map(({ title, caption, score }) => (
        <Example key={title} title={title} caption={caption}>
          {(onLayout) => <FontNotation score={score as MnxDocument} onLayout={onLayout} />}
        </Example>
      ))}
    </section>
  );
}
