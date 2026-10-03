import { useEffect } from 'react';
import type { MnxDocument } from '@polyhymnia/mnx';
import { NoteHeard, Dictation, ErrorDetection, IntervalId } from './exercises/index.js';
import { Example } from './Example.js';
import { FontComparison } from './FontComparison.js';
import { MarksExample } from './MarksExample.js';
import { ScorePlayer } from './ScorePlayer.js';
import { unlockSound } from './sound.js';

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
import { ChangesToggle, FontNotation } from './font.js';

const MELODY = melody as MnxDocument;
const WHOLE_BAR_REST = wholeBarRest as MnxDocument;
const MIXED_RESTS = mixedRests as MnxDocument;
const LEDGER_LINES = ledgerLines as MnxDocument;
const UNDERFULL = underfull as MnxDocument;
const RHYTHM_4_4 = rhythm44 as MnxDocument;
const RHYTHM_6_8 = rhythm68 as MnxDocument;
const TRIPLETS = triplets as MnxDocument;
const TWO_VOICES = twoVoices as MnxDocument;
const TIES = ties as MnxDocument;
const SLURS = slurs as MnxDocument;
const CLEF_CHANGES_COURTESY = clefChangesCourtesy as MnxDocument;
const GRAND_STAFF = grandStaff as MnxDocument;
const ARTICULATIONS_DYNAMICS = articulationsDynamics as MnxDocument;
const MARK_CLEARANCE = markClearance as MnxDocument;
const GRACE_NOTES = graceNotes as MnxDocument;

const KEY_EXAMPLES: readonly { label: string; doc: MnxDocument }[] = [
  { label: 'C major — no accidentals', doc: keyCMajor as MnxDocument },
  { label: 'G major — 1 sharp', doc: keyGMajor as MnxDocument },
  { label: 'D major — 2 sharps', doc: keyDMajor as MnxDocument },
  { label: 'F major — 1 flat', doc: keyFMajor as MnxDocument },
  { label: 'B♭ major — 2 flats', doc: keyBbMajor as MnxDocument },
];

const CLEF_EXAMPLES: readonly { label: string; doc: MnxDocument }[] = [
  { label: 'Treble — top line F5', doc: clefTreble as MnxDocument },
  { label: 'Bass — top line A3', doc: clefBass as MnxDocument },
  { label: 'Alto — middle line C4', doc: clefAlto as MnxDocument },
  { label: 'Tenor — C4 on the fourth line', doc: clefTenor as MnxDocument },
];

export function App() {
  useEffect(() => unlockSound(), []);

  return (
    <main>
      <h1>Polyhymnia notation — renderer gallery</h1>
      <p className="note">
        Extras: <a href="ornaments.html">Ornaments study</a>
      </p>
      <p className="lede">
        Every stave below is <code>@polyhymnia/notation-engine</code>&rsquo;s <code>layoutScore()</code> rendered by{' '}
        <code>&lt;Notation&gt;</code>: SVG in staff-space units, glyphs from the subsetted Bravura build, no colour
        anywhere but the stylesheet. Beams and tuplet brackets are drawn, auto-grouped per the meter when a score
        doesn&rsquo;t specify <code>support.useBeams</code>; ties, slurs and second voices are drawn too, and the
        exercises further down exercise hit-testing and answer entry.
      </p>

      <FontComparison />

      <h2>A melody, from a hand-written MNX file</h2>
      <p className="note">
        Four bars of 3/4 in F major, <code>src/scores/melody.mnx.json</code>: barlines, a final barline, dotted values,
        a rest mid-bar, and spacing/justification across the system.
      </p>
      <Example title="F major, 3/4" caption="B♭ comes from the key signature, so no accidental is written">
        {(onLayout) => <FontNotation score={MELODY} onLayout={onLayout} />}
      </Example>

      <h2>Playback</h2>
      <p className="note">
        The same melody played through <code>@polyhymnia/web-audio</code>: the app builds the clip from the layout
        timeline and drives the cursor from its own animation-frame loop.
      </p>
      <Example
        title="F major, 3/4 — play whole score"
        caption="Cursor and active-note highlight follow the audio clock"
      >
        {() => <ScorePlayer score={MELODY} />}
      </Example>

      <h2>Key signatures</h2>
      <p className="note">Same clef, same note, five signatures — accidental order and staff placement.</p>
      <div className="row">
        {KEY_EXAMPLES.map((k) => (
          <Example key={k.label} title={k.label}>
            {(onLayout) => <FontNotation score={k.doc} onLayout={onLayout} />}
          </Example>
        ))}
      </div>

      <h2>Clefs</h2>
      <p className="note">
        C4&ndash;E4&ndash;G4&ndash;C5 in each clef. Tenor is the irregular one: its C4 sits on the fourth line, a third
        below the alto placement rather than the octave a naive rule would give.
      </p>
      <div className="row">
        {CLEF_EXAMPLES.map((c) => (
          <Example key={c.label} title={c.label}>
            {(onLayout) => <FontNotation score={c.doc} onLayout={onLayout} />}
          </Example>
        ))}
      </div>

      <h2>Clef changes and courtesy signs</h2>
      <p className="note">
        Bar 2 changes clef, key and time and starts a new system; bar 3 changes clef back mid-system. The toggles apply
        to every example on this page.
      </p>
      <ChangesToggle />
      <Example
        title="Clef, key and time changes across a system break"
        caption="Courtesy naturals, key and time end the first system; the clef change is small before the barline by default"
      >
        {(onLayout) => <FontNotation score={CLEF_CHANGES_COURTESY} onLayout={onLayout} />}
      </Example>

      <h2>Rests and ledger lines</h2>
      <Example
        title="Whole-bar rest in 9/8"
        caption="9/8 of a whole note is not a notatable rest shape; the whole-bar rest is one glyph standing for the entire bar"
      >
        {(onLayout) => <FontNotation score={WHOLE_BAR_REST} onLayout={onLayout} />}
      </Example>
      <Example
        title="Mixed rests"
        caption="Quarter, eighth, half and dotted-half rests on their conventional staff positions"
      >
        {(onLayout) => <FontNotation score={MIXED_RESTS} onLayout={onLayout} />}
      </Example>
      <Example title="Ledger lines above and below" caption="C6 and A6 above the staff, C4 and E3 and C3 below it">
        {(onLayout) => <FontNotation score={LEDGER_LINES} onLayout={onLayout} />}
      </Example>

      <h2>Beams and tuplets</h2>
      <p className="note">
        Beams are auto-grouped from the meter&rsquo;s beat structure; tuplet brackets are drawn from{' '}
        <code>type: &quot;tuplet&quot;</code> events.
      </p>
      <Example title="4/4 — 8ths, 16ths, dotted 8th+16th" caption="Mixed subdivisions beamed per beat">
        {(onLayout) => <FontNotation score={RHYTHM_4_4} onLayout={onLayout} />}
      </Example>
      <Example
        title="6/8 — compound groupings"
        caption="Beam groups follow the dotted-quarter pulse, not straight beats"
      >
        {(onLayout) => <FontNotation score={RHYTHM_6_8} onLayout={onLayout} />}
      </Example>
      <Example title="Triplets" caption="Two beamed eighth-note triplets, then a quarter-note triplet">
        {(onLayout) => <FontNotation score={TRIPLETS} onLayout={onLayout} />}
      </Example>

      <h2>Two voices</h2>
      <p className="note">
        A second sequence in a part lays out as a second voice on the same staff: voice 0 stems up, voice 1 stems down;
        simultaneous rests offset apart; a second between the voices shifts the upper notehead right, a true unison
        overlaps.
      </p>
      <Example
        title="Two voices, one staff"
        caption="Beat 1: a second (v0 shifts right). Beat 2: a unison (no shift). Beat 3: simultaneous rests, offset apart. Beat 4: independent rhythm, per-voice beaming."
      >
        {(onLayout) => <FontNotation score={TWO_VOICES} onLayout={onLayout} />}
      </Example>

      <h2>Grand staff</h2>
      <p className="note">
        A part with <code>staves: 2</code> lays out as a grand staff: a brace and a system line on the left, barlines
        through both staves, notes aligned across them by time. Each staff keeps its own clef and up to two voices.
      </p>
      <Example
        title="Treble and bass staves"
        caption="F major, 3/4: right-hand melody with a second voice in bar 2, left-hand broken chords and a second voice in bar 3"
      >
        {(onLayout) => <FontNotation score={GRAND_STAFF} onLayout={onLayout} />}
      </Example>

      <h2>Articulations, fermatas and dynamics</h2>
      <p className="note">
        Staccato and tenuto sit in the nearest space on the notehead side and stay inside slurs; accents go outside the
        staff and outside slurs; a fermata goes over everything. Dynamics share one line per system, optically centred
        on their notes, with hairpins between them; a hairpin crossing a system break stays partly open.
      </p>
      <Example
        title="Marks and dynamics"
        caption="p to f under a slurred, articulated bar; fermatas on a note, a rest, a whole-bar rest and the final barline; a diminuendo to pp"
      >
        {(onLayout) => <MarksExample score={ARTICULATIONS_DYNAMICS} onLayout={onLayout} />}
      </Example>

      <Example
        title="Tie and accent clearance"
        caption="The staccato and tenuto appear at the ends of their ties. In the last system, each voice keeps its articulations on its own stem side."
      >
        {(onLayout) => <FontNotation score={MARK_CLEARANCE} onLayout={onLayout} />}
      </Example>
      <Example
        title="Fermata playback"
        caption="Normal fermatas double the marked note or rest. The cursor slows with the hold; the final whole-bar rest stays silent for four seconds at 120 bpm."
      >
        {() => <ScorePlayer score={ARTICULATIONS_DYNAMICS} />}
      </Example>

      <h2>Grace notes</h2>
      <Example
        title="Beamed grace groups"
        caption="Small slashed notes lead into the main notes; playback borrows a short amount of time from each following note"
      >
        {(onLayout) => <FontNotation score={GRACE_NOTES} onLayout={onLayout} />}
      </Example>

      <h2>Ties</h2>
      <p className="note">
        A tie curves opposite the stem for a single note; a chord ties each member separately, outer notes arching
        outward and inner notes following the nearest outer one.
      </p>
      <Example
        title="Ties across a barline and a chord"
        caption="Beat 2 ties into the next bar; the last bar's chord ties into a repeated chord"
      >
        {(onLayout) => <FontNotation score={TIES} onLayout={onLayout} />}
      </Example>

      <h2>Slurs</h2>
      <p className="note">
        A slur's direction follows MNX <code>side</code> when given, else the voice or the stems in its span; the arch
        raises to clear any notehead, stem, or beam sitting between its endpoints. <code>startNote</code> anchors it to
        a specific chord member.
      </p>
      <Example
        title="A phrase slur and a chord's startNote"
        caption="Bar 1: a slur over a four-note run. Bar 2: the slur starts from the chord's top note, not its default anchor"
      >
        {(onLayout) => <FontNotation score={SLURS} onLayout={onLayout} />}
      </Example>

      <h2>Diagnostics</h2>
      <p className="note">
        A malformed score degrades visibly instead of throwing. The second bar holds one quarter note in 4/4; the engine
        pads it to length and attaches the warning below, which this page renders exactly as any app would.
      </p>
      <Example title="Underfull bar, auto-padded">
        {(onLayout) => <FontNotation score={UNDERFULL} onLayout={onLayout} />}
      </Example>

      <h2>Ear-training exercises</h2>
      <p className="note">
        Three exercises built on the answer-entry primitives: hit-testing through <code>Notation.Interaction</code>,
        per-note state through <code>Notation.Marks</code>, and document edits through <code>applyIntent</code>. All
        sound comes from <code>@polyhymnia/web-audio</code> — the notation packages never produce audio.
      </p>
      <section className="exercises">
        <NoteHeard />
        <Dictation />
        <ErrorDetection />
        <IntervalId />
      </section>

      <footer>
        Interaction is opt-in: hit-testing and answer entry come from the <code>Notation.Interaction</code> and{' '}
        <code>Notation.Marks</code> children, and playback highlighting from <code>Notation.Playback</code>, all driven
        by the app. The notation packages never produce sound and never run a clock.
      </footer>
    </main>
  );
}
