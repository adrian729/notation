import { useEffect } from 'react';
import type { MnxDocument } from '@polyhymnia/mnx';
import { NoteHeard, Dictation, ErrorDetection, IntervalId } from './exercises/index.js';
import { Example } from './Example.js';
import { FontComparison } from './FontComparison.js';
import { GlyphGallery } from './GlyphGallery.js';
import { RhythmGallery } from './RhythmGallery.js';
import { MarksExample } from './MarksExample.js';
import { ScorePlayer } from './ScorePlayer.js';
import { unlockSound } from './sound.js';
import { ChangesToggle, FontNotation } from './font.js';

import melody from './scores/melody.mnx.json';
import keyCMajor from './scores/key-c-major.mnx.json';
import keyGMajor from './scores/key-g-major.mnx.json';
import keyDMajor from './scores/key-d-major.mnx.json';
import keyFMajor from './scores/key-f-major.mnx.json';
import keyBbMajor from './scores/key-bb-major.mnx.json';
import clefTreble from './scores/clef-treble.mnx.json';
import clefBass from './scores/clef-bass.mnx.json';
import clefAlto from './scores/clef-alto.mnx.json';
import clefTenor from './scores/clef-tenor.mnx.json';
import wholeBarRest from './scores/whole-bar-rest.mnx.json';
import mixedRests from './scores/mixed-rests.mnx.json';
import ledgerLines from './scores/ledger-lines.mnx.json';
import underfull from './scores/underfull.mnx.json';
import rhythm44 from './scores/rhythm-4-4.mnx.json';
import rhythm68 from './scores/rhythm-6-8.mnx.json';
import triplets from './scores/triplets.mnx.json';
import twoVoices from './scores/two-voices.mnx.json';
import ties from './scores/ties.mnx.json';
import slurs from './scores/slurs.mnx.json';
import clefChangesCourtesy from './scores/clef-changes-courtesy.mnx.json';
import grandStaff from './scores/grand-staff.mnx.json';
import articulationsDynamics from './scores/articulations-dynamics.mnx.json';
import markClearance from './scores/mark-clearance.mnx.json';
import graceNotes from './scores/grace-notes.mnx.json';
import breves from './scores/mensural-breves.mnx.json';

const STUDIES: readonly { title: string; score: MnxDocument }[] = [
  { title: 'A melody in F · dots, rests and a final barline', score: melody as MnxDocument },
  { title: 'G clef · treble', score: clefTreble as MnxDocument },
  { title: 'F clef · bass', score: clefBass as MnxDocument },
  { title: 'C clef · alto', score: clefAlto as MnxDocument },
  { title: 'C clef · tenor', score: clefTenor as MnxDocument },
  { title: 'C major · no accidentals', score: keyCMajor as MnxDocument },
  { title: 'G major · one sharp', score: keyGMajor as MnxDocument },
  { title: 'D major · two sharps', score: keyDMajor as MnxDocument },
  { title: 'F major · one flat', score: keyFMajor as MnxDocument },
  { title: 'B♭ major · two flats', score: keyBbMajor as MnxDocument },
  { title: 'Breves · long note values', score: breves as MnxDocument },
  { title: 'Whole-bar rest in 9/8', score: wholeBarRest as MnxDocument },
  { title: 'Mixed rests', score: mixedRests as MnxDocument },
  { title: 'Ledger lines above and below', score: ledgerLines as MnxDocument },
  { title: '4/4 · mixed beams and dotted rhythm', score: rhythm44 as MnxDocument },
  { title: '6/8 · compound beam groups', score: rhythm68 as MnxDocument },
  { title: 'Ties across a barline and a chord', score: ties as MnxDocument },
  { title: 'Phrase slurs and chord anchors', score: slurs as MnxDocument },
  { title: 'Tie and articulation clearance', score: markClearance as MnxDocument },
  { title: 'Underfull bar · automatic padding and diagnostic', score: underfull as MnxDocument },
];

export function App() {
  useEffect(() => unlockSound(), []);

  return (
    <main>
      <header className="page-heading">
        <h1>Polyhymnia · notation gallery</h1>
        <p className="lede">Inspect every symbol, then see how they work together in a score.</p>
        <nav className="page-nav" aria-label="Gallery sections">
          <a href="#glyphs">Symbol gallery</a>
          <a href="#rhythm">Notes & beams</a>
          <a href="#scores">Full scores</a>
          <a href="#studies">Engraving studies</a>
          <a href="#playback">Playback & exercises</a>
          <a href="ornaments.html">Ornaments</a>
        </nav>
      </header>

      <FontComparison />
      <GlyphGallery />
      <RhythmGallery />

      <section id="scores" aria-labelledby="score-heading">
        <h2 id="score-heading">The symbols together</h2>
        <p className="note">
          Six scores for checking clefs, spacing, joined stems, curves and colour in context. All follow the font
          selected above. Manuscript uses the same red ruling, blue signs and gold meter denominators as Mensural.
        </p>
        <Example
          title="G and F clefs · grand staff"
          caption="Treble and bass together, joined by a brace; four bars with chords, independent voices and shared barlines."
        >
          {(onLayout) => <FontNotation score={grandStaff as MnxDocument} onLayout={onLayout} />}
        </Example>
        <Example
          title="Articulations, dynamics and hairpins"
          caption="Slurs, staccato, tenuto, accents and fermatas, with a crescendo from p to f and a diminuendo to pp."
        >
          {(onLayout) => <MarksExample score={articulationsDynamics as MnxDocument} onLayout={onLayout} />}
        </Example>
        <Example
          title="Clef, key and time changes across a system break"
          caption="Full-size F clefs, small G-clef changes, cancelled accidentals and courtesy signatures."
        >
          {(onLayout) => <FontNotation score={clefChangesCourtesy as MnxDocument} onLayout={onLayout} />}
        </Example>
        <details className="gallery-details">
          <summary>Clef and courtesy options</summary>
          <ChangesToggle />
        </details>
        <Example title="Triplets" caption="Beamed eighth-note triplets and a bracketed quarter-note triplet.">
          {(onLayout) => <FontNotation score={triplets as MnxDocument} onLayout={onLayout} />}
        </Example>
        <Example
          title="Two voices, one staff"
          caption="Opposing stems, close noteheads, shared unisons, offset rests and independent beams."
        >
          {(onLayout) => <FontNotation score={twoVoices as MnxDocument} onLayout={onLayout} />}
        </Example>
        <Example
          title="Grace notes"
          caption="Small notes, slashed stems and beamed grace groups before the main notes."
        >
          {(onLayout) => <FontNotation score={graceNotes as MnxDocument} onLayout={onLayout} />}
        </Example>
      </section>

      <section id="studies">
        <h2>Engraving studies</h2>
        <p className="note">
          Individual features on a staff, including all four clef positions, keys, rests, beams and curves.
        </p>
        <details className="gallery-details">
          <summary>Open all {STUDIES.length} focused examples</summary>
          {STUDIES.map(({ title, score }) => (
            <Example key={title} title={title}>
              {(onLayout) => <FontNotation score={score} onLayout={onLayout} />}
            </Example>
          ))}
        </details>
      </section>

      <section id="playback">
        <h2>Playback & answer entry</h2>
        <Example title="A melody in F" caption="Play the score and follow the highlighted notes.">
          {() => <ScorePlayer score={melody as MnxDocument} />}
        </Example>
        <details className="gallery-details">
          <summary>Ear-training exercises</summary>
          <section className="exercises">
            <NoteHeard />
            <Dictation />
            <ErrorDetection />
            <IntervalId />
          </section>
        </details>
      </section>
      <footer>
        Symbol names under each specimen identify the exact drawing for review. The full scores show the renderer’s
        staff lines, stems, beams, ties, slurs and brackets as well as the font glyphs.
      </footer>
    </main>
  );
}
