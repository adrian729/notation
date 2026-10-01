import { Notation } from '@polyhymnia/notation-react';
import type { MnxDocument } from '@polyhymnia/mnx';
import { Example } from './Example.js';
import { FontNotation, FontToggle } from './font.js';

import breves from './scores/mensural-breves.mnx.json';
import melody from './scores/melody.mnx.json';

const BREVES = breves as MnxDocument;
const MELODY = melody as MnxDocument;

/**
 * Both families are subset from the same Bravura outlines and share every
 * advance width and bounding box, so switching family changes the note shapes
 * and nothing else — same pitches, same rhythm, same spacing engine.
 *
 * The toggle below is page-wide: it drives every example here and every one
 * further down, not just the two shown. `PolyhymniaNotation` (modern) stays
 * shipped even though nothing in the app selects it — it is the fallback for a
 * future per-user style setting, and dropping the face would be the kind of
 * "cleanup" that quietly removes a feature.
 */
export function FontComparison() {
  return (
    <section className="font-compare">
      <h2>Font families</h2>
      <p className="note">
        The engine engraves the same MNX in either family. Values map onto white mensural shapes: a breve is a brevis, a
        whole note a semibrevis, a half note a minima, a quarter note a semiminima. Mensural is the default; modern is
        kept shipped and reachable from here.
      </p>

      <FontToggle />

      <Example title="An existing melody, in the chosen family" caption="This one follows the toggle above.">
        {() => <FontNotation score={MELODY} />}
      </Example>

      <div className="family-both">
        <Example title="Breves, modern" caption="opted in explicitly">
          {() => <Notation score={BREVES} options={{ style: 'modern' }} />}
        </Example>
        <Example title="Breves, mensural" caption="same document, the default family">
          {() => <Notation score={BREVES} options={{ style: 'mensural' }} />}
        </Example>
      </div>
    </section>
  );
}
