# EarMaster: product research

Purpose: specify every EarMaster exercise and feature precisely enough to rebuild its equivalent (Part 1), state what that means for Polyhymnia (Part 2), and keep all other audited research as reference (Part 3). Research date 2026-09-27; nothing was installed, bought or signed up for, so every claim comes from public documentation, store listings, release notes or reviews.

Contents: [Part 1 — Exercises and features](#part-1--earmaster-exercises-and-features) ([1.1 Conventions](#11-conventions), [1.2 Core activities](#12-the-14-core-activities), [1.3 Course-level variants](#13-course-level-exercise-variants), [1.4 Features](#14-features)) · [Part 2 — Implications for Polyhymnia](#part-2--implications-for-polyhymnia) ([2.1 Current primitives](#21-what-we-have-today), [2.2 Verdicts](#22-verdict-per-exercise-and-feature), [2.3 Gaps](#23-gaps-table), [2.4 Notation-API gaps](#24-known-notation-api-gaps-that-affect-this), [2.5 Open questions](#25-open-questions-for-the-owner)) · [Part 3 — Reference](#part-3--reference) ([3.1 Scope](#31-research-scope-and-method), [3.2 Product](#32-product-history-and-platforms), [3.3 Editions](#33-editions-and-licensing), [3.4 Pricing](#34-pricing), [3.5 Courses](#35-course-catalog), [3.6 Teachers](#36-teacher-and-school-specifics), [3.7 Reviews](#37-reviews-and-user-feedback), [3.8 Contradictions](#38-contradictions-and-confidence-gaps), [3.9 Sources](#39-sources))

# Part 1 — EarMaster exercises and features

## 1.1 Conventions

Confidence tags:

- **[current]**: stated on a current official page or in 2022–2026 release notes.
- **[old: vN]**: only found in an older official manual (EarMaster 5 or 6, 2009–2014). Probably still true in EarMaster 7 because the activities carried over, but not re-verified.
- **[single]**: only one source found (or several that all repeat one vendor text).
- **[inferred]**: our reading of indirect evidence, such as lesson titles. Not stated outright by a source.

Source tags like `[S1]` point to [3.9 Sources](#39-sources).

Exercise template (used for every entry in 1.2): **Plays** (what the student hears) · **Shows** (what is on screen before answering) · **Answer** (how the student responds) · **Options** (parameters) · **Question choice** (how questions are picked) · **Feedback / scoring** · **Levels** (built-in progression) · **Notes**.

Rules that apply to every activity unless its entry says otherwise:

- **Option defaults** are not documented in any source; lessons fix them, and Customized Exercise lets the user set them. No entry below invents a default.
- **Question choice**: a random item from the enabled set (intervals, chords, scales, progressions, rhythms or melodies), placed in the enabled keys and root movement, weighted by the adaptive-question engine (F4) when a lesson enables it `[S1][S11][S12]`.
- **Shared options** (F12), **answer identification modes** (F14), **checking and scoring** (F15), **feedback display** (F16) and **hints** (F17) apply to all activities and are not repeated.

## 1.2 The 14 core activities

The same 14 activities power every course, workshop and custom exercise `[S1][S11]`. The Cloud page lists the same 14, with "Interval hearing", "Chord hearing" and "Scale hearing" as alternative names for the three identification activities `[S3]`, and the teacher guide has exactly one General Workshop per activity `[S9]`. All 14 exist in all editions; the free tier includes only Interval Identification and Chord Identification in custom mode `[S6]`.

### Intervals

#### E1. Interval Comparison
- **Plays**: two intervals, A then B.
- **Shows**: nothing needed. The staff, piano or guitar only **shows** the tones after answering and cannot be used for input `[S13]` `[old: v5]`.
- **Answer**: which interval is larger, by pressing A or B `[S13]` `[old: v5]`.
- **Options**: interval set; playing mode (ascending, descending, harmonic, or random among the selected); "common tone" (both intervals share the first tone, or the top tone when descending); keys and root movement `[S13]` `[old: v5]`.
- **Question choice**: two intervals from the set, with roots related by the common-tone setting.
- **Feedback / scoring**: right or wrong; the tones are then shown on staff or instrument.
- **Levels**: 20 workshop modules. Interval families (perfect, imperfect consonant, dissonant, all simple, compound up to 2 octaves) are crossed with the tone relationship (common first tone; common first or second tone; nearby first tones; no common tones), and each is split into ascending, descending and harmonic lessons `[S9]`.
- **Notes**: needs no theory knowledge, which makes it the recommended starting point `[S11]`.

#### E2. Interval Identification
- **Plays**: one interval, optionally preceded by a key-establishing cadence or chord ("play tonic").
- **Shows**: an empty staff or instrument when answering by tones; buttons otherwise.
- **Answer**: either the interval name on multiple-choice buttons, or its tones entered on staff, piano, fingerboard, solfege keyboard, MIDI or microphone, then submitted `[S1][S13]`.
- **Options**: interval set; ascending, descending or harmonic, or combinations such as "Ascending + Harmonic" (since build 1.1.14, Aug 2022) `[S14]`; "play tonic" for functional hearing; keys and root movement, with an advanced mode for specific keys or roots, random or circle-of-fifths order, and where the root sits in the key (all 12 tones, scale tones, steps 1-4-5, diatonic only, root of key) `[S13]`; pitch range `[S14]`; answer identification (absolute, any octave, relative) `[S11]`.
- **Question choice**: an interval from the set, root chosen by the key and root-placement options, inside the pitch range.
- **Feedback / scoring**: buttons all or nothing; tone entry marked per tone (F15).
- **Levels**: 16 modules, from m2/M2 pairs up to all intervals in an octave, grouped as perfect, consonant and dissonant `[S9]`.
- **Notes**: included in the free tier in custom mode `[S6]`.

#### E3. Interval Singing
- **Plays**: one reference tone.
- **Shows**: an instruction bar asking for a named interval above or below it, e.g. a 5th above D.
- **Answer**: sing into the microphone. Pitch detection shows the sung note on the staff or piano, and it is inserted after being held for a set time, by a key press, or by MIDI remote. Other inputs such as staff or MIDI also work, which turns the activity into **interval spelling** `[S11][S13]`.
- **Options**: interval set; up or down; fixed-do or movable-do solfege naming, so it can be used to sing solfege `[S11]`.
- **Question choice**: an interval from the set and a reference tone.
- **Feedback / scoring**: the sung tone is shown against the expected one; statistics record direction as well as interval name (7.9.1 fix) `[S14]`.
- **Levels**: 3 workshop modules (ascending from Do, descending from Do, complementary intervals). Singing is also used heavily in the Beginner's Course, Vocal Trainer and RCM Voice `[S9]`.

### Chords and scales

#### E4. Chord Identification
- **Plays**: one chord, optionally after "play tonic".
- **Shows**: buttons, or an empty staff or instrument for tone entry.
- **Answer**: the chord name on buttons, or its tones on any of the input methods above `[S1]`.
- **Options**: chord-type set (built-in plus user-defined chords entered in C and transposed with correct spelling) `[S13]`; voicing, where root position only, any closed voicing or any open voicing is allowed `[S13]` `[old: v5]`; an "Execution" setting for how the chord or scale is played, of which only the value "Random" is documented (7.8.1 fix), plus the playback variations (harmonic, ascending, descending) `[S14]`; keys and root placement ("Place root of question", 7.9.2 fix) `[S14]`; play tonic.
- **Question choice**: a chord type from the set, root by key and root-placement options, voiced per the voicing option.
- **Feedback / scoring**: as E2.
- **Levels**: 22 General Workshop modules, from major/minor through sus, altered 5ths and added tones to all 7th chords. 22 Jazz lessons cover four-note chords sorted by dissonance, then 5–7 note chords derived from Lydian, Dorian, melodic minor, Mixolydian, Mixolydian ♯11, altered and diminished scales `[S9]`.
- **Notes**: included in the free tier in custom mode `[S6]`. An old forum thread (EarMaster 5, 2009) reports that custom chords were respelled so that the bass note became the root, which limited voicing drills (drop-2 etc.) `[S28]` `[old: v5]`.

#### E5. Chord Inversions
- **Plays**: an inverted chord.
- **Shows**: buttons, or staff or instrument for tone entry.
- **Answer**: the inversion or chord on buttons, or the tones on an instrument or staff `[S1]`.
- **Options**: chord types; ascending, descending or harmonic `[S9]`. The bottom tone (not the root) is kept at a fixed pitch across inversions `[S13]`.
- **Question choice**: a chord type and inversion, with the bass tone held fixed.
- **Feedback / scoring**: as E2.
- **Levels**: 18 modules. Each chord family (major, minor, sus4, major♭5, dim, aug, then maj7/7, m7/m-maj7 and all 7ths) is drilled ascending, descending, harmonic, then mixed `[S9]`.

#### E6. Chord Progressions (also covers cadences)
- **Plays**: a progression, optionally after "play tonic".
- **Shows**: buttons, or staff bars (one per chord) plus a degree and quality picker.
- **Answer**, in one of two ways `[S1][S13]`:
  - **Multiple choice** on the whole progression (e.g. a I-IV-V-I button).
  - **Chord-by-chord**: pick a bar on the staff, choose the degree on the piano or guitar (which shows the key's functions), choose the quality from a Quality panel, or play the chord on MIDI (the lowest note is taken as the root and the closest-matching function is chosen).
- **Options**: progression list (built-in plus user-defined, up to 8 chords) `[S26]`; since 7.6.1 a "progression" may be a single chord, so a lesson can ask for one chord's function within a key `[S14]` `[current]`; inversions (all root position, last chord in root position, or random inversion of the last chord, with the others voice-led toward its top tone); "add deep root tone" (doubles the root as a bass line); "remove 5th in dom7" `[S13]` `[old: v5]`.
- **Question choice**: a progression from the list, in an enabled key, voiced per the inversion option.
- **Feedback / scoring**: multiple choice all or nothing; chord-by-chord scored 0–100% by how many functions and qualities are right `[S13]`.
- **Levels**: General Workshops have 21 lessons: V-I with major/minor tonic, dominants with and without 7th, vii°7, ii-V-I and ii-♭II-I, plagal, mediant combinations, extended cadences, fifth sequences, folk progressions, interrupted cadences, and modulations (including to ♭III and ♭VI). Jazz has 18 lessons: diatonic major and minor, each secondary dominant, all five secondary dominants, tritone substitutions and modal interchange `[S9]`.
- **Notes**: the Beginner's Course adds bass-pattern singing and dictation before chord progressions `[S9]` (1.3).

#### E7. Scale Identification (also covers modes)
- **Plays**: a scale.
- **Shows**: buttons, or staff or instrument for tone entry.
- **Answer**: its name on buttons, or its tones on an instrument or staff `[S1]`.
- **Options**: scale set (built-in plus user-defined); ascending, descending, or ascending+descending (melodic minor plays ♭6 and ♭7 descending; 7.3.1 fix) `[S14]`; keys.
- **Question choice**: a scale from the set in an enabled key.
- **Feedback / scoring**: as E2.
- **Levels**: 13 lessons grouped by how each scale begins (whole-whole, whole-half, half-whole). They cover church modes, harmonic and melodic minor and their derivatives, whole-tone, diminished, altered, the two pentatonics, and descending modes `[S9]`.

### Rhythm

Rhythm options shared by E8–E11: allowed note values; "special patterns" (e.g. 16ths only in groups of four); rests; ties; one or more time signatures; number of bars; tempo; swing feel; evaluation strictness `[S13]` `[old: v5]`; "evaluate note length", where held durations must match (using a sustained sound; in EarMaster 5 this could not be combined with microphone input) `[S11][S13]`, still present in 7.9.3 `[S14]`; lead-in or count-in bar; metronome while hearing or while clapping (with the clapping metronome off you must still keep tempo but may start any time); which metronome clicks sound `[S11]`.

#### E8. Rhythmic Sight-Reading
- **Plays**: metronome (and count-in).
- **Shows**: a notated rhythm.
- **Answer**: by **clapping or tapping** in time with the metronome. Input can be a microphone clap or drum, the space bar or down arrow (desktop), touch tapping (mobile), or a MIDI pad or keyboard `[S1][S7][S11]`. The performance must start on a downbeat, though you may wait any number of bars before starting `[S11]`.
- **Options**: the rhythm options above.
- **Question choice**: a generated rhythm within the rhythm options, or a score-library excerpt (F9).
- **Feedback / scoring**: each clap is drawn as a tick at its real time position under the score. After evaluation, used claps turn green and stray claps red, and each note is marked correct, too early, too late, or missed `[S13]` `[old: v5]`. The "show claps" option displays dots under the staff in real time `[S11]`. When "evaluate note length" is on, notes with the wrong duration are coloured (7.9.3 fix) `[S14]`.
- **Levels**: 27 modules, from 4/4 whole to eighth notes through 16th groupings, rests, triplets, 5/4, 3/8, 4/8, 6/8, 9/8, 12/8, 5/8, 7/8, 2/2, 3/2, 4/2, mixed groupings and 32nds. The Jazz workshop has 30 lessons: swing (medium and up-tempo), 6/8, straight 16ths and 32nds, swung 16ths and triplets `[S9]`.

#### E9. Rhythm Clapback (called "Rhythm Imitation" in v5/v6)
- **Plays**: a rhythm (with repeat signs shown when an excerpt is played more than once, 7.4.5) `[S14]`.
- **Shows**: nothing until answered, unless "auto show rhythm".
- **Answer**: claps or taps it back in time with the metronome, using the same inputs as E8 `[S1][S11]`.
- **Options**: the rhythm options above, plus "auto show rhythm", which reveals the score after the answer; after a first attempt the score can be viewed to support a second one `[S13]`. For continuous "ping-pong" call-response, set Auto New Question to always, with 0 s delay `[S1]`. Recording starts right after the question or count-in (1.1.14), a separate Play Question button exists (7.7.1), and the clap sound can be toggled (7.6.2) `[S14]`.
- **Question choice**: as E8.
- **Feedback / scoring**: as E8.
- **Levels**: 27 modules, following the E8 progression. The Jazz workshop has 49 lessons, up to ♩=200 and 3-bar phrases `[S9]`.
- **Notes**: needs no theory, so it is a recommended starting activity `[S11]`.

#### E10. Rhythm Error Detection (called "Rhythm correction" in v5)
- **Plays**: a version of the shown rhythm with changes. Each change either removes a note or splits a note into two.
- **Shows**: the notated (correct) rhythm.
- **Answer**: clicks the notes on the staff that differ, then asks for evaluation ("Show errors") `[S1][S13]`.
- **Options**: the rhythm options above, plus the number of changes `[S13]`.
- **Question choice**: a generated rhythm, then the set number of random removals or splits.
- **Feedback / scoring**: clicked notes marked right or wrong, missed changes shown.
- **Levels**: 28 modules, from 2-bar 4/4 up to 8 bars and all meters. Jazz: 43 lessons of swing, straight and 6/8 rhythms, 1–2 bars with 1 to 4 errors `[S9]`.
- **Notes**: ties were handled correctly only from 7.3.2 (Dec 2022) onward `[S14]`.

#### E11. Rhythmic Dictation
- **Plays**: a rhythm (count-in on replay since 7.5.3) `[S14]`.
- **Shows**: an empty staff of the given length and meter.
- **Answer**: transcribes it. The user picks a note value from the note toolbar, a menu or a shortcut, then clicks in the bar. Evaluation happens when all bars are full ("Show rhythm") `[S11][S13]`. A new dictation engine arrived in 7.5.1 (Jan 2024) with a play cursor and undo `[S14]`.
- **Options**: the rhythm options above. Unless "evaluate note length" is on, several transcriptions can count as correct (e.g. a half note versus a quarter note plus a quarter rest) `[S11]`.
- **Question choice**: as E8.
- **Feedback / scoring**: per note value (F15).
- **Levels**: 27 modules, following E8. Jazz: 49 lessons `[S9]`.

### Melodies

Melody generator options shared by E12–E14 `[S13][S14]`: length in tones or bars (up to 8 bars since 7.6.1); scale or progression source, including custom scales that restrict which scale tones appear; maximum leap and ambitus; allowed note values, rests, dots and triplets, and 6/8; start on step 1, or on step 1, 3 or 5; keys and root movement; "tone reference" before the melody: cadence, root chord or interval `[S27]` `[old: v5]`; "show first tone"; source can be generated melodies or excerpts from the **score library**, choosing the bar range, the evaluated voice and the accompaniment voices `[S8]`.

#### E12. Melodic Dictation
- **Plays**: a melodic phrase, either alone or with accompaniment (chords or up to 4 melodic voices), after the tone reference.
- **Shows**: an empty staff (optionally with the first tone).
- **Answer**: transcribes it on the staff. Note values come from the note toolbar; pitches come from staff clicks, piano, fingerboard, MIDI or microphone `[S1][S13]`.
- **Options**: the melody generator options above. Lessons can be **pitch-only**, where only whole notes are enabled and rhythm is not graded, or **rhythmic** `[S11][S13]`.
- **Question choice**: a generated melody within the generator options, or a score-library excerpt.
- **Feedback / scoring**: in rhythmic lessons each correct note value counts as much as each correct pitch `[S11][S13]`.
- **Levels**: 18 General Workshop modules. They start with 3–4 tones of C major, then add rhythm in 4/4 and 3/4, eighth notes, other keys, A minor, all minor keys and harmonic minor. Jazz has 7 modules of blues licks and 1920s standards `[S9]`.
- **Notes**: turning off "play tonic of the key" makes it an **absolute pitch** test `[S11]`. The functional-training recipe is a 2-tone dictation with a custom scale, a cadence first, and the functional keyboard `[S25]`.

#### E13. Melody Singback (called "Melody Imitation" in v6; the EarMaster 5 guide lists no melody-imitation or sight-singing activity `[S13]`)
- **Plays**: a phrase.
- **Shows**: nothing required before singing.
- **Answer**: sings it back into the microphone in time with the metronome, or plays it on MIDI or an acoustic instrument `[S1][S11]`.
- **Options**: the melody generator options, plus "Play first note" (7.4.4) and Play Question (7.7.1) `[S14]`.
- **Question choice**: as E12.
- **Feedback / scoring**: a pitch curve, with notes marked on pitch, on time, slightly off, or wrong `[S1]`.
- **Levels**: 17 modules (C major, rhythm, eighths, around the circle of fifths, minor, harmonic minor). Jazz has 7 `[S9]`.

#### E14. Melodic Sight-Singing
- **Plays**: tone reference and metronome.
- **Shows**: a phrase on the staff, **or** as text syllables ("Note names": solfege, letter names or degrees), **or** on the "Tone ladder" (since 7.6.1) `[S1][S14]`. The staff auto-scrolls while you sing `[S1][S14]`.
- **Answer**: sings or plays it in time with the metronome (microphone or MIDI) `[S1]`. **Pitch-only** sight-singing lessons exist (e.g. Beginner's "Pitch Sight-Singing"; the Tone ladder is "for pitch-only sight-singing") `[S9][S14]`, and the UK Grades sight-singing is described as "in free time" `[S18]`.
- **Options**: the melody generator options. "Bass line singing" (7.6.1) lets a lead sheet's chords be the evaluated voice, so you sing the bass line `[S14]`. Tone naming offers movable-do, fixed-do, "movable-do with la-based minor", absolute-do, and numerals `[S11][S14]`. Also count-in, score library excerpts, and a transposing instrument setting.
- **Question choice**: as E12.
- **Feedback / scoring**: a real-time pitch curve drawn over the notes shows pitch and timing accuracy; since 7.6.1 it is also drawn on the "Note names" and "Tone ladder" displays `[S1][S14]`. Release 7.3.1 improved detection of when singing begins `[S14]`.
- **Levels**: 18 General Workshop modules (as E12, in 1-, 2- and 4-bar lengths), 7 Jazz modules, Melodia (425 lessons), Solfege Fundamentals, Vocal Trainer and RCM levels `[S9][S20]`.

## 1.3 Course-level exercise variants

These appear as named lessons in courses. Most are probably configured instances of the 14 activities `[inferred]` from lesson titles and settings, which the teacher guide says are all built from those activities `[S9]`. Each row is the template in compressed form: what happens is the stimulus and answer; the base activity supplies options, scoring and feedback.

| Variant | Where | What happens | Likely base activity | Confidence |
| --- | --- | --- | --- | --- |
| Pitch Matching (one note, two notes C/D) | Beginner's 2.2, 2.6, 6.2 | Hear a note, sing it back | Singback / Interval Singing | `[inferred]` |
| Tapping with the Metronome, Skipping Beats | Beginner's 3.2–3.3 | Tap a steady beat, then leave out beats | Rhythm Clapback / Sight-Reading | `[inferred]` |
| Beat Error Detection, Beat Dictation | Beginner's 3.5–3.6 | Error detection and dictation using only quarter-note beats | E10, E11 | `[inferred]` |
| Pitch Sight-Singing, Pitch Dictation (2–5 notes) | Beginner's 4.x, 6.7, 8.6… | Pitch-only (no rhythm) singing and dictation with few notes | E14, E12 | `[inferred]` |
| Tonal Threads (3 notes) | Beginner's 6.6, 8.5… | Short scale-degree threads within the key. The exact mechanic is not documented | E12 or E14 | `[single]`, unclear |
| Singing Melodic Fragments by ear / by sight | Beginner's 6.8–6.9… | Short singback and sight-singing | E13, E14 | `[inferred]` |
| Singing a Tune / Tapping a Tune / Learning a Tune | Beginner's (1812 Overture, Ode to Joy, Twinkle…) | Sing or tap a well-known melody from a score | E14, E8 | `[inferred]` |
| Harmonic/melodic thirds and triads: "Learning" vs "Identification" | Beginner's 14.x, 17.x | Learning lessons (examples) followed by identification | E2, E4 | `[inferred]` |
| Consonance & dissonance, chords in context | Beginner's 11.x | Classify sounds as consonant or dissonant; chords within 3-chord progressions | E4, E6 | `[inferred]` |
| Singing Bass Patterns, Bass Pattern Dictation | Beginner's 19.2–19.3, 19.8–19.9 | Sing or dictate the bass line of progressions | E13 or E14, E12 | `[inferred]` |
| Technical Exercises / Technical Tests (vocalises) | Vocal Trainer, RCM | Sung warm-up and scale patterns, with a "preparatory lesson" before each graded lesson | E14 or E13 | `[inferred]` |
| Chord (triad) Singback; Scale Singback (first 3 notes) | RCM Preparatory+ | Sing back an arpeggiated triad, or the start of a major or minor scale | E13 | `[inferred]` |
| Interval Singback vs Interval Singing | RCM L1+ | Singback repeats a heard interval; Singing produces a named interval from one tone | E13, E3 | `[inferred]` |
| Pulse and Metre (Gr. 1–3) | UK Grades | Clap the pulse of an excerpt and name the metre | E8 or E9 plus multiple choice | `[single]` |
| Echoes (Gr. 1–3), Melodic Repetition (Gr. 4–5) | UK Grades | Sing back a short melody | E13 | `[single]` |
| Differences (Gr. 1–3) | UK Grades | Spot what changed between two playings of a melody (pitch or rhythm) | Error detection | `[single]`, mechanic unclear |
| Musical Features (Gr. 1–5) | UK Grades | Describe features of an excerpt (in ABRSM: dynamics, articulation, tempo, character, style) | Probably multiple choice | `[single]`, answer UI unknown |
| Rhythmic Repetition and Metre (Gr. 4–5) | UK Grades | Clap back the rhythm of a melody and identify the metre | E9 | `[single]` |
| Sight-Singing in free time (Gr. 4–5) | UK Grades | Sing notes from a score with no tempo constraint | E14 (pitch-only) | `[single]` |
| Call-and-response pitch and interval echo ("Continuous call-response" exercises per 7.4.4 notes) | Call of the Notes | EarMaster plays a note or interval and you sing or play it back (microphone or MIDI) `[S37]`; the app's "continuous" mode chains questions without pause `[S1][S14]` | E13 (or E3) with Auto New Question at 0 s | Mechanic `[current]` `[S37]`; base activity `[inferred]` |
| Mastery tests | Beginner's 22.x | One test per skill (interval comparison/ID, triad ID, progression, rhythm reading/dictation, pitch sight-singing/dictation, melodic sight-reading/dictation, tapping a tune, learning a tune) | All | `[current]` `[S9]` |

The UK Grades rows rest on one vendor description, repeated on the shop page, the product page and 2023 press coverage `[S18][S34][S35]`, so they stay `[single]`; the base activity and answer UI for each are our inference.

Not found as dedicated activities (see 3.8): perfect-pitch note naming, instrument/timbre identification, harmonic dictation, pitch-error detection, scale-degree identification. Workarounds: melodic scale degrees through custom Melodic Dictation or Interval ID with the functional keyboard `[S1][S25]`; chord function within a key through single-chord "progressions" in Chord Progressions since 7.6.1 `[S14]`.

## 1.4 Features

One short entry per feature: what it does, then details. Edition availability is in 3.3.

### Training structure and progress

- **F1. Training modes**: the home screen offers **Courses** (linear, teacher-authored lesson sequences made of modules and lessons), **Workshops** (one progressive lesson list per activity, which you can enter at any lesson), **Customized Exercise** (you configure an activity yourself; for Cloud students a private space whose results are not synced to the teacher `[S29]`) and **Assignments** (class and personal, Cloud users only `[S29]`) `[S10][S29]`. Since 7.9.2 (Feb 2026) the home screen shows fewer courses by default, with course-info pop-ups `[S14][S15]`.
- **F2. Course / lesson structure**: a course or workbook contains modules, and modules contain lessons. A lesson is an exercise, an explanation with audio and visual examples, or both. Modules usually end with a stricter test lesson `[S9][S11]`.
- **F3. Lesson rules** (teacher-configurable) `[S12]` `[old: v6]`: number of mandatory questions; supplementary questions if the passing threshold is missed; adaptive questions on or off; allow audio and visual examples; "recommend next lesson" score, which pre-selects retake or move on; passing threshold; "if failed, go to" a given lesson, e.g. back to the start of the module; high-score points. The current guides still mention the passing threshold and the supplementary questions `[S9][S29]`; the full list is from v6 and assumed to carry over to the Workbook Editor `[inferred]`.
- **F4. Adaptive questions**: a lesson ends early if you do well, adds supplementary questions if you struggle, and asks your weak items more often `[S1][S11][S12]`. Marketed as "AI-powered Smart Adaptive Learning" `[S2]`; nothing beyond this engine is documented (3.8). No **spaced repetition**, review queue or scheduled revisiting of old material was found in any source. Reviewing weaknesses is manual: read the statistics, then build a Customized Exercise targeting the weak items (the manual's example is one that includes only the intervals you miss) `[S1][S11]`.
- **F5. In-lesson progress bar and instruction panel**: shows each question of the lesson as upcoming, current, correct or wrong, plus the supplementary questions added when the minimum score is missed; an instruction panel gives directions and feedback `[S29]` `[current]`.
- **F6. After-lesson summary**: a summary plus a suggested next step: continue, retake, or return to the module start `[S11]`.
- **F7. Statistics and results**: a detailed statistics window, filterable, shows results lesson by lesson and day by day `[S1][S10]`. A module's score is the average of its lessons' best scores, and every attempt can be opened `[S29]` `[current]`. The course lesson list shows completion and best score (since 7.6.1, Aug 2024) `[S14]`. A high-score board with points per lesson existed in v5 and v6 `[S12][S13]` `[old: v5/v6]`; no current source mentions it.

### Customization and content

- **F8. Customized Exercise and presets**: all 14 activities are configurable through the options in 1.2 ("hundreds of options"), with per-activity factory presets (7.5.3) and saveable user presets (7.5.1) `[S14]`.
- **F9. Music Library and score library**: a Music Library of intervals, chords, scales, progressions and melodies accepts user-defined items `[S1]`. The score library has 600+ scores (200+ jazz lead sheets, 400+ classical) `[S3][S8]`; excerpts, including imported MusicXML, can be used in sight-singing, melodic dictation, melody singback, rhythmic sight-reading, rhythmic dictation and rhythm clapback `[S8]`. EarMaster can transpose imported melodies to chosen keys `[S8][S9]`. Import limits and export details are in 3.6.
- **F10. Lesson introductions**: the lesson description on one side and playable audio and visual examples of the lesson's items on the other ("Examples" button, "New Example") `[S12][S14][S29]`. Lesson descriptions can link to textbook pages (teacher workbooks accept basic HTML) `[S12][S13][S14]`.
- **F11. Contextual help**: a "?" hotspot mode ("smart help") and help hints inside the exercise and setup screens `[S10][S14][S29]`.

### Exercise behaviour (all activities)

- **F12. Shared exercise options** (lessons can lock them) `[S11][S13]` `[old: v5/v6]`, with 7.x additions `[S14][S15]`. The 2022–2026 release notes confirm many carried over, under current names such as "Auto Submit Answer", "Auto Replay Question Delay", "Play Count In", "Play Question With Metronome", "Play First Tone", "Silent Input" and "Show Pitch Curve" `[S14][S15]` `[current]`:
  - *Question flow*: auto new question (after a delay, or only after a correct answer so you can review mistakes first); auto replay of the question at an interval; limit on how many times a question can be played; answer time limit; auto-evaluate (when the right number of notes is entered, or only when the answer is correct).
  - *Playback*: tempo, articulation (legato, staccato, sustained), lead-in bar, metronome while hearing and while answering, which metronome clicks sound, visible metronome, play tone on click, play count-in.
  - *Display*: show first tone (greyed temporarily in any-octave or relative mode), show key signature and key name, clef and grand staff, show claps, show pitch curve, tone naming.
  - *After answering*: replay the question or your own answer, and switch between harmonic, ascending and descending for that replay only.
- **F13. Option locking**: teachers can lock options in a lesson; 7.9.3 fixed students changing locked options `[S15]` `[current]`. The old manual warns that "Play tone on click" or "auto-evaluate when correct" make cheating trivial `[S13]`. Since 7.9.2 teachers can build multiple-choice lessons with no staff shown, and one-tone pitch-only dictation lessons that use only solfege, piano or guitar input `[S15]`.
- **F14. Answer identification modes**: *Absolute* (exact pitches), *Any octave* (pitch classes), *Relative* (any transposition) `[S11]`.
- **F15. Checking and scoring**: identification, dictation and error detection use **whole-answer checking**: the user enters everything, then presses Show answer / Evaluate, or auto-evaluate fires; correct parts are then marked green and wrong parts red `[S13]`. Partial credit is given in dictation (per pitch and per note value) and in chord-by-chord progressions; multiple-choice progressions are all or nothing `[S13]`. Real-time activities (sight-singing, singback, clapping) give live visual feedback **during** the performance and a score afterwards `[S1][S11]`. No evidence was found of note-by-note checking during dictation.
- **F16. Feedback display (where notation appears)**: notation is **display-only** in Interval Comparison (shown after answering) and in multiple-choice answers (auditioning an option shows it on the staff); **the answer surface** in staff-entry identification, melodic and rhythmic dictation, rhythm error detection (click the wrong notes), and chord-by-chord progression entry; **the stimulus** in rhythmic sight-reading, melodic sight-singing, and Singing or Tapping a Tune; **the feedback canvas** for clap ticks (early, late, missed), the pitch curve over notes, green and red marking of correct and wrong notes, and repeat signs in clapback and singback `[S1][S13][S14]`. The current student guide describes the correct answer shown with a green label beside a wrong answer's red label, plus arrows marking pitch as flat or sharp and timing as early or late `[S29]` `[current]`.
- **F17. Hints and scaffolding**: show first tone, play tonic or cadence first, lesson "Examples", "Play Question" during singback, and revealing the score after a first clapback attempt `[S12][S13][S14]`.

### Input methods

- **F18. Multiple-choice buttons**: the fastest method. Right-click (desktop) auditions an option and shows it transcribed on the staff or instrument. Keyboard navigation uses Tab, arrows and Space `[S11][S13]`.
- **F19. Staff entry**: the note appears on press, can be dragged vertically while held, and is committed on release; committed notes can be dragged later. Accidentals come from the toolbar, shortcuts, or dragging sideways while holding the note. Note values come from the toolbar or shortcuts, or by right-click cycling. There is an eraser tool. Undo was added in 7.5.1 `[S14]`. Computer-keyboard entry adds an interval above or below the root: plain 1–9 and Shift+1–9 in EarMaster 5, Ctrl+1–9 and Alt+2–9 in EarMaster 6 `[S11][S13]` `[old: v5/v6]`. Entered notes sound by default; a "Silent Input" exercise option turns that off `[S15]` `[current]`.
- **F20. On-screen instruments**: piano (middle C marked, auto-scrolls to the question octave) and fingerboard (guitar, bass, violin, cello, mandolin, banjo with configurable tunings; transposing instrument setting). Press and slide to choose, release to insert, click a note to delete, and right-click to audition without inserting `[S11]` `[old: v6]`. The current features page lists staff (single or double), piano, guitar, bass, violin, cello, mandolin, scale degrees and solfege syllables `[S1]`. Two instruments are shown at once, an upper and a lower one, chosen in Exercise Options `[S1][S29]`.
- **F21. Solfege / functional keyboard**: buttons for syllables or degrees (Arabic or Roman) laid out in chromatic, piano-like order `[S11]`. It is enabled as the lower or upper instrument, with the syllable set chosen by the Tone Naming option `[S1]`. Absolute naming has been available since 7.8.1 `[S14]`.
- **F22. Note names and Tone ladder**: "Note names" shows a phrase as text syllables (solfege, letter names or degrees); the Tone ladder (7.6.1) is a ladder of syllables representing pitches and steps, for pitch-only sight-singing, with tones highlighted during playback `[S1][S14]`.
- **F23. Microphone, pitch**: sung or played notes appear live on the staff or instrument. A note is committed by holding it for a configurable time, by a key press, or by MIDI remote. In v5/v6 a **calibration tool** had to be run before first use `[S11]` `[old: v6]`; headphones are required `[S1]`.
- **F24. Microphone, real time**: sight-singing and singback are evaluated against the metronome grid. Clapping into the microphone drives the rhythm activities `[S11]`.
- **F25. MIDI input and remote**: press all chord tones at once and release to enter them; pressing a new set overwrites. A single-tone mode exists for guitar and wind controllers. MIDI remote control maps notes, program changes or controllers to buttons such as New question, Play, Stop, Undo, and insert-sung-tone `[S11]` `[old: v6]`. On mobile, MIDI was iOS-only `[S7]` until the Aug 31 2026 Google Play release added it on Android `[S16]` `[current]`.
- **F26. Tapping**: the space bar, down arrow or Ctrl key on desktop, the touch pad on mobile (with a speaker toggle for the clap sound since 7.6.2), or a MIDI pad `[S1][S7][S13][S14]`. 7.10.1 fixed a delayed first keyboard clap on Mac `[S15]`.
- **F27. Input Timing offset**: Preferences hold an "Input Timing offset" for latency compensation, with a second one for Bluetooth devices since 7.6.1 `[S14]` `[current]`.

### Sound, display, platform

- **F28. Sounds**: sampled instruments `[S7]`. "Real Clap Sounds" arrived in 7.10.1 `[S14]`. Instrument sounds are chosen in Preferences (EM7 quickstart), and in v6 each role, such as the sustained rhythm sound, had its own preset `[S10][S11]`. In EarMaster 5 and 6, sound went through MIDI/SoundFonts `[old: v5/v6]`.
- **F29. Notation display**: configurable clef (treble, bass, alto) and single or grand staff, key signature and key name on or off, notation style, transposing instrument setting, and a play cursor (7.5.1) `[S10][S11][S13][S14]`.
- **F30. Tone naming**: movable-do, fixed-do, "movable-do with la-based minor", absolute-do, numerals (Arabic or Roman degrees) and letter names `[S11][S14]`.
- **F31. Teacher tools (Cloud)**: Workbook Editor, Assignment Manager, Student Results (print or CSV export), Music Library with MusicXML import, web admin console, and cloud sync `[S3][S9]`. Workflow in 3.6.
- **F32. Cloud sync and offline use**: settings and results sync for subscribers and Cloud users; students can work offline for up to 7 days `[S3][S9]`.
- **F33. Multi-user on one device**: desktop profiles follow OS user accounts `[S10]`. In v5 School and v6, schools could also use a local login or a LAN server `[S12][S13]` `[old: v5/v6]`.
- **F34. Languages**: 17 interface languages on the website, 18 in the iOS listing `[S1][S14]`; add-on courses ship in fewer (3.2).
- **F35. Platforms**: Windows, Mac, iOS/iPadOS, Android (and most Chromebooks); teacher version Windows/Mac only (3.2, 3.3).
- **F36. Website extras**: a separate free online music theory course and an Interval Song Chart generator `[S1][S11]`.

# Part 2 — Implications for Polyhymnia

Grounded in `AGENTS.md`, `notation/interaction.md`, `notation/audio.md`, `notation/interface.md`, `notation/playback.md`, `notation/mnx.md`, `notation/README.md`, `notation/roadmap.md`, `apps/web/src/exercises/*` and `apps/web/src/sound.ts`, as of 2026-09-27.

## 2.1 What we have today

- **Rendering** (`notation-react`): `<Notation score>` renders MNX with treble, bass, alto and tenor clefs, all keys, meters, tuplets, ties, slurs and two voices per staff. `Notation.Interaction` resolves `element`/`slot`/`point` hits into `activate`/`hover` intents; `Notation.Marks` draws app states, selection and a preview ghost without re-layout; `Notation.Playback` (`notes`/`cursor`) plus `setPlaybackTick` draws highlight and cursor from an app-supplied tick. Presets: `NotesReveal`, `ScaleReveal` (major, natural/harmonic/melodic minor).
- **Editing** (`mnx`): `applyIntent({type:'setPitches'})` sets, clears or chords one event; rhythm never changes.
- **Audio** (`@polyhymnia/audio`): `melodic`, `harmonic`, `concat`, `shift`, `transpose`, `midiOfPitch`, `eventsFromTimeMap` (repeats, voltas, D.S. al Fine via `playOrder`, tempo override, `tickAtSeconds` for the cursor); `./webaudio` has only `synthInstrument` behind the `Instrument` seam. Deferred in `audio.md`: count-in, metronome, seek/loop, dynamics velocity, grace notes, tempo ramps.
- **App** (`apps/web`): three fixed-content demos — `NoteHeard` (click the note heard), `Dictation` (pitch-only, first note given, ♭/♮/♯ toggle, Check), `ErrorDetection` (pitch variant played through `melodic` with one fixed note length) — plus `ScorePlayer` and `sound.ts` (`createSound`, `midiOfId`). No question generation, routing, settings, persistence or statistics.

## 2.2 Verdict per exercise and feature

Verdicts: **Supported** = a working demo of the mechanic exists; only content generation is missing. **App logic** = buildable on current packages with exercise logic only (question generation, evaluation, UI), wherever that logic lands (app or a new DOM-free exercise package, 2.3 G1). **New capability** = needs something no package provides. Gap ids refer to 2.3.

### Core activities

| EarMaster | Verdict | Existing primitives | Missing (gap) |
| --- | --- | --- | --- |
| E1 Interval Comparison | App logic | `melodic`/`harmonic` + `concat`; A/B buttons; `NotesReveal` ×2 after answering | Generator with common-tone root choice (G1), spelled interval math (G2) |
| E2 Interval Identification | App logic (buttons, staff); New (mic, MIDI) | Buttons; staff entry via `slot` hits + `setPitches` (chord form for harmonic); "play tonic" as `harmonic` chords `concat` | G1, G2, reference builder (G6); answer identification modes are app comparison rules; mic (G15), MIDI (G14) |
| E3 Interval Singing | New capability | Reference tone via `melodic`; spelling variant = staff entry | Mic pitch detection with hold-to-commit (G15); live note display (G12) |
| E4 Chord Identification | App logic | `harmonic` / arpeggiated `melodic`; `NotesReveal`; staff chord entry via `setPitches` | Chord tables with spelling (G1, G2); custom chords (G5 storage); open voicings wider than one staff need grand staff (G16) |
| E5 Chord Inversions | App logic | As E4 | Inversion generation with fixed bass (G1) |
| E6 Chord Progressions | App logic (whole, chord-by-chord selects); New (numerals on staff, bass staff, MIDI) | `harmonic` + `concat`, or generated MNX → `eventsFromTimeMap` with `Playback(notes)`; bar pick via `point`/`element` hits | Voicing and function tables (G1), MNX progression generator (G7); Roman numerals in the SVG (G17, until then app text); "deep root tone" / bass display (G16); MIDI chord → function (G14) |
| E7 Scale Identification | App logic | `melodic`; `ScaleReveal` for 4 scales | Mode and custom-scale tables (G1); generated MNX for mode reveal (G7) |
| E8 Rhythmic Sight-Reading | New capability | Score display, `cursor` playback, `setPlaybackTick` | Metronome and count-in (G10), tap capture and latency offsets (G11), onset scoring (G11), clap-tick overlay (G12), rhythm generator (G7); mic clap onsets (G15); swing playback (G10) |
| E9 Rhythm Clapback | New capability | Repeated excerpts play via `playOrder`; score reveal is `<Notation>` | As E8; volta brackets not drawn (2.4) |
| E10 Rhythm Error Detection | App logic | `element` hits + `Marks` (`ErrorDetection.tsx`); variant MNX → headless `layoutScore` → `eventsFromTimeMap` | Rhythm variant generator (remove or split a note) with stable ids (G7); tied-note ids (2.4) |
| E11 Rhythmic Dictation | App logic (larger) | `point.tick` hits; the planned route in `interaction.md`: app keeps a duration list and regenerates MNX | Rhythm entry palette + durations → MNX with stable ids (G13); undo (G13); count-in on replay (G10) |
| E12 Melodic Dictation | Supported (pitch-only); App logic (rhythmic); New (accompaniment, mic, MIDI) | `Dictation.tsx`: slots, `setPitches`, `Marks` states and preview, accidental toggle | Melody generator with rest events and ids (G7), tone reference (G6); rhythm entry (G13); accompaniment of up to 4 voices needs multi-part layout and playback (G18); score-library excerpts (G7 content) |
| E13 Melody Singback | New capability | Stimulus via `melodic` or `eventsFromTimeMap` | Mic pitch + onset (G15), metronome (G10), pitch-curve overlay (G12); MIDI alternative (G14) |
| E14 Melodic Sight-Singing | New capability | Score display and cursor | As E13; syllables under notes (G17); Note names / Tone ladder displays (G8); bass-line singing from chord symbols (G17) |

### Course-level variants (1.3)

| Variants | Verdict | Missing |
| --- | --- | --- |
| Pitch Dictation (2–5 notes), Bass Pattern Dictation, Learning vs Identification, Consonance & dissonance, Tonal Threads, Differences, Beat Error Detection | Supported / App logic | Generators (G7), lesson intros (F10 → G3); bass dictation fits one bass-clef staff; Tonal Threads mechanic undocumented |
| Musical Features (UK Grades) | App logic + New | Multiple choice is app logic; expressive excerpts need dynamics/articulation playback (G21) |
| Beat Dictation | App logic | Rhythm entry (G13) |
| Tapping with the Metronome, Skipping Beats, Tapping a Tune, Pulse and Metre, Rhythmic Repetition and Metre | New capability | G10, G11 |
| Pitch Matching, Pitch Sight-Singing, Singing Melodic Fragments, Singing a Tune, Singing Bass Patterns, Technical Exercises, Chord/Scale/Interval Singback, Echoes, Melodic Repetition, Sight-Singing in free time | New capability | G15 (free-time sight-singing needs no metronome) |
| Call of the Notes | New capability | G15 or G14, plus auto-advance with 0 s delay (G3) |
| Mastery tests | Inherits its base activities | — |

### Features (1.4)

| EarMaster | Verdict | Missing / where |
| --- | --- | --- |
| F1–F3, F5, F6 Training modes, course structure, lesson rules, progress bar, summary | App logic | Course and lesson definitions as data, exercise runner (G3) |
| F4 Adaptive questions | New capability | Scheduler / adaptive engine (G4); spaced repetition would go beyond EarMaster |
| F7 Statistics and results | New capability | Results storage and stats (G5) |
| F8 Customized Exercise, presets | App logic | Exercise definition schema (G1), preset storage (G5) |
| F9 Music Library, score library | App logic (offline excerpts); runtime MusicXML import excluded | Offline `tools/musicxml-to-mnx` → committed `.mnx.json` is our counterpart; `AGENTS.md` forbids runtime import until a product flow needs it; transposing excerpts needs spelled transposition (G2) |
| F10, F11, F17 Intros, help, hints | App logic | Presets and generated MNX for examples; "show first tone" = `Marks` state `given` |
| F12 Shared options | Mostly App logic | Tempo override exists; articulation = event durations built by the app; metronome/count-in (G10); show claps and pitch curve (G12); grand staff (G16) |
| F13 Option locking, F14 answer identification, F15 checking and scoring | App logic | Pure evaluation functions (G1) |
| F16 Feedback display | Supported (colours) + New (overlays) | `Marks` states cover green/red; answer labels are app text (per the `interaction.md` accessibility rule); ticks, pitch curve, flat/sharp and early/late arrows need an overlay (G12) |
| F18 Buttons | App logic | — |
| F19 Staff entry | Supported (pitch) | Slots, `setPitches`, preview ghost, accidental toggle exist; `insertAlteration` and key-aware slot pitches cover the key-signature spelling EarMaster handles with drag-sideways accidentals; drag-to-change pitch, duration palette and keyboard entry are deferred editor features; undo deferred (G13) |
| F20–F22 On-screen instruments, solfege keyboard, Note names, Tone ladder | App logic | App components (G8), no notation-package impact |
| F23, F24 Microphone | New capability | G15 |
| F25 MIDI | New capability | G14 |
| F26, F27 Tapping, Input Timing offset | New capability | G11 |
| F28 Sounds | New capability | Sampled instruments and clap sound (G9) |
| F29 Notation display | Supported (clefs, key, cursor) + New | Grand staff (G16), transposing instruments (G19) |
| F30 Tone naming | App logic | App labels; syllables inside the SVG need G17 |
| F31–F33 Teacher tools, sync, profiles | New capability, deferred | Backend and accounts (G20) |
| F34 Languages | App logic + small engine change | i18n (G22) |
| F35 Platforms | Open question | Web only today; Web MIDI support varies by browser |

### Notation role per exercise (from the EarMaster research)

| Exercise | Notation role | Pure audio + multiple choice possible? |
| --- | --- | --- |
| Interval Comparison | Display after answering only | Yes (A/B) |
| Interval / Chord / Inversion / Scale ID | Optional answer surface; display of the answer | Yes |
| Interval Singing | Shows the reference tone and the sung tone | No, singing (or spelling via staff) |
| Chord Progressions | Chord-by-chord mode needs staff bars plus a degree/quality picker | Yes (whole progression) |
| Melodic Dictation | Staff entry (pitch, and optionally rhythm) | No |
| Rhythmic Dictation | Staff entry of durations | No |
| Rhythm Error Detection | Score shown; click the notes that differ | No |
| Rhythmic Sight-Reading | Score is the stimulus; clap ticks drawn under the notes | No, tapping |
| Rhythm Clapback | Score revealed after the attempt; ticks | No, tapping |
| Melody Singback | Score and pitch curve after or during singing | No, singing or MIDI |
| Melodic Sight-Singing | Score (or syllables / tone ladder) as stimulus; live pitch curve | No, singing or MIDI |

## 2.3 Gaps table

Placement follows `AGENTS.md`: a new concern becomes a new package; `mnx`/`notation-engine` stay DOM-free; browser APIs only behind DOM entries (like `audio/webaudio`); apps consume packages through public exports; quiz data never goes in MNX; the notation and audio packages run no clocks. Size: S ≤ 3 days, M ≤ 2 weeks, L > 2 weeks (estimate). Order = suggested sequence.

| # | Capability | Needed by | Where it should live | Size | Order |
| --- | --- | --- | --- | --- | --- |
| G1 | **Exercise generation layer**: exercise definitions (JSON params, levels), seeded question generators, theory tables (intervals, chords, scales, progressions with correct spelling), pure evaluation (multiple choice, per-note partial credit, answer identification modes) | Every exercise, F8, F13–F15 | New DOM-free package (e.g. `packages/exercise`); needs an `AGENTS.md` module/direction entry | L | 1 |
| G2 | **Pitch math in the model**: pitch → midi, spelled interval/transposition, midi → spelled pitch | G1, G14, excerpt transposition | `mnx` ("pitch/rational/duration math"), added only when G1 consumes it | S | 1 |
| G3 | **App shell and exercise runner**: routing, lesson flow (mandatory and supplementary questions, thresholds, next-step), settings, option locking, auto-advance, intros | F1–F3, F5, F6, F10–F13 | `apps/web` | L | 1 |
| G4 | **Scheduler / adaptive engine**: weak-item weighting, early finish, supplementary questions | F4 | New pure package (knows only item keys) or inside G1 | M | 3 |
| G5 | **Results storage and statistics**: attempts, best scores, per-item stats, presets, custom items | F7, F8, F9 | `apps/web` behind a small storage interface | S–M | 2 |
| G6 | **Reference builders**: cadence, root chord or interval before a question, as `NoteEvent[]` | E2, E4, E6, E12 "play tonic" / "tone reference" | `audio` `.` entry (pure) or G1 | S | 2 |
| G7 | **MNX generators**: melodies (leap, ambitus, start degree, rest events at answer slots), rhythms per meter, pitch and rhythm variants, progressions, mode reveals; explicit deterministic ids | E6, E7, E8–E12, variants | G1 package, output plain MNX (no builder API) that passes Ajv in tests and `layoutScore` without errors | M–L | 2 |
| G8 | **Answer surfaces**: on-screen piano, fingerboard, solfege/functional keyboard, Note names, Tone ladder | F20–F22, E14 | App components | M | 4 |
| G9 | **Sampled instruments** and clap sound | F28 | New `Instrument` implementation behind its own `audio` entry, pinned; ask before installing | M | 4 |
| G10 | **Metronome and count-in** (incl. swing) as events scheduled up front | E8–E14, F12 | `audio` `.` entry (deferred in `audio.md`) | S | 5 |
| G11 | **Tap timing input**: key/touch/pointer onsets on the AudioContext clock, Input Timing offset plus a Bluetooth offset, onset-to-note scoring (early, late, missed, extra) | E8, E9, rhythm variants, F26, F27 | Capture in the app or a new DOM package; scoring in G1 | M | 5 |
| G12 | **Overlay layer**: clap ticks, live pitch curve, flat/sharp and early/late arrows, live sung-note display | E3, E8, E9, E13, E14, F16 | New `notation-react` compound child taking app data per frame (clock-free), or exported staff geometry (pitch → y) from `notation-engine` | M | 5 |
| G13 | **Rhythm entry**: duration palette, app duration list → regenerated MNX with stable ids; undo as a generic history of doc states | E11, rhythmic E12 | App UI + pure generator in G1; undo per the `interaction.md` "Undo design (deferred)" | M | 5 |
| G14 | **MIDI input**: Web MIDI, chord capture, key-aware spelling, remote-control mapping | E2–E14 answers, F25 | New DOM package or app code; spelling via G2 | S–M | 6 |
| G15 | **Mic pitch detection**: getUserMedia, pitch tracker, onset and hold-to-commit, calibration, headphone prompt, clap onsets; test with low male voices | E3, E13, E14, singing variants, F23, F24 | New DOM package with a pinned, wrapped dependency; separate from `audio` (input, not sound) | L | 7 |
| G16 | **Grand staff** (`staves > 1`) | E6 bass display, wide voicings, F29 | `notation-engine` + `notation-react` (deferred in `roadmap.md`) | L | 8 |
| G17 | **Text layer**: Roman numerals, chord symbols, syllables under notes | E6, E14, F30 | Engine + react (deferred "new text layer") | M | 8 |
| G18 | **Multi-part layout and playback** | E12 accompaniment, score-library excerpts with accompaniment | Engine, model (`applyIntent`, `elementIds`), audio (one instrument per part) | L | 9 |
| G19 | **Transposing instruments** (MNX part `transposition`) | F29, E14 | Engine (today unsupported, `mnx.md`) | M | later |
| G20 | **Backend, accounts, sync, teacher tools** | F31–F33 | New service | L | defer |
| G21 | **Dynamics and articulations** (drawn and played) | Musical Features, expressive excerpts | Engine and audio (deferred) | M | 9 |
| G22 | **i18n**: app strings, note-name conventions; `ElementBox.label` is English text generated in the engine | F34 | App, plus a localization hook or structured label data in the engine | M | 6 |

## 2.4 Known notation-API gaps that affect this

- **Tie-tail ids missing from `timemap.byId`**: a tie-merged `TimeMapEntry` carries only the tie head's ids (`toEntry` in `packages/notation-engine/src/query/timemap.ts`), so `byId(tailId)` is `undefined` and `midiOfId` falls back to the hit's key-derived pitch. Affects click-to-hear and checks on tied notes (NoteHeard, error detection; EarMaster itself only fixed ties in rhythm error detection in 7.3.2). Fix in `notation-engine` with one regression test.
- **`HitResult` element pitch ignores the written accidental**: it is derived from staff position plus key signature because `ElementBox` carries no written `Pitch` (`interaction.md`). Affects any exercise reading a clicked existing note's pitch. Fix: carry the written pitch on `ElementBox`.
- **Parallel `ids` / `midiNotes` arrays** (plus a separate `midi` for single notes) in `TimeMapEntry`: `midiOfId` and `eventsFromTimeMap` pair them by index. Fragile; per-member `{ id, midi }` records would be safer (breaking change across engine and audio).
- **Pitch → midi in `mnx`** (resolved): `pitchToMidi` is shared by engine, audio, react presets and the app. Spelled intervals exist only in the app (`apps/app/src/exercises/shared/spelling.ts`); no transposition exists anywhere (G2).
- **Single part laid out**: only `parts[0]` is laid out (`layout/normalize.ts`), only staff 1 of a part, and `applyIntent`/`elementIds` address part 0 only. Blocks accompaniment, grand staff and SATB (G16, G18).
- **Voltas, jumps and fermatas not drawn**: endings and D.S. al Fine are honoured in playback via `playOrder` but not engraved; fermata not drawn. Affects score-library excerpts and EarMaster-style repeat display in clapback and singback.
- Also pending: mid-score clef change layout (`roadmap.md` E4) and the one-line percussion staff for rhythm exercises (deferred).

## 2.5 Open questions for the owner

1. Which EarMaster activities are in scope first: identification and dictation only (E1–E7, E10–E12), or also rhythm tapping (E8, E9) and singing (E3, E13, E14)?
2. Package boundaries for G1: may the exercise package depend on `audio` (`.` entry) and `notation-engine` (headless `layoutScore` for variants)? Either way `AGENTS.md` needs a new module entry and direction rule.
3. Adaptivity: copy EarMaster's in-lesson model (supplementary questions, weak-item weighting) only, or also add spaced repetition, which EarMaster lacks?
4. Rhythm exercises: accept a normal staff at one pitch, or build the deferred one-line percussion staff first?
5. Sounds: which sample set, licence and size budget (`AGENTS.md` requires asking before installing)?
6. Input priority and platforms: mic before or after MIDI? Web only, or PWA/native later (Web MIDI and audio latency vary by browser and device)?
7. Persistence: local only for now, with export? When, if ever, accounts, sync and teacher tools?
8. Score library: stay with offline, committed excerpts, or is a user MusicXML import a product flow (which would lift the `AGENTS.md` runtime-import ban)?
9. Default tone naming: letters, scale degrees, movable-do or fixed-do?
10. Scoring leniency for tap and mic: lenient by default with a strict exam mode?
11. Are transposing instruments and grand staff needed for the first release (E6 bass display, F29)?

# Part 3 — Reference

## 3.1 Research scope and method

Research date: **2026-09-27**, re-verified the same day against the live official pages, store listings, the EarMaster Cloud teacher and student guides and the old PDF manuals. This is a product-research reference for planning our own ear-training app. It is written in our own words from public sources (3.9). Nothing was installed, bought or signed up for, so every claim comes from documentation, store listings, release notes or reviews. None of it comes from using the app.

No EarMaster 7 user manual is published. The support portal offers a 2-page EM7 quickstart, tutorials, a JavaScript-loaded FAQ, the forum and the EarMaster Cloud guides for students, teachers and administrators; the in-app help is not mirrored on the website. Current per-activity detail therefore comes from the features page, the Cloud guides (including full lesson lists), and 2022–2026 release notes; option-level detail still leans on the EarMaster 5 and 6 manuals.

## 3.2 Product, history and platforms

EarMaster is made by EarMaster ApS, a Danish company. It began as a 1994 MS-DOS prototype and has been sold since 1996 `[S24]`. Version 7 launched on Windows and Mac on 24 Nov 2017 with a revised UI, a new Beginner's Course, a new pitch-detection algorithm and new statistics tools `[S21]`. The iPad app appeared in 2016, the iPhone app in 2020, an all-platform subscription in 2021, and Android (and with it most Chromebooks) in 2022 `[S24]`. MusicXML import has existed since 6.1 `[S24]`. The current iOS build is **7.10.1, dated Sep 1 2026** `[S14]`; the Mac App Store build is also 7.10.1 (Sep 5 2026) `[S15]`, and Google Play shows version 7.10.100, updated Aug 31 2026 `[S16]` `[current]`.

- **Requirements** disagree across official pages. Best-supported current values: desktop download Windows 10/11 and macOS 10.14+ `[S6]`; iOS/iPadOS 15.0+ `[S14]`; Mac App Store build macOS 10.15+ `[S15]`; Android 7.0+ (Play minimum SDK 24) `[S16]` `[current]`. Stale values still shown: the download page says iOS 10+ `[S6]`, the features page says Windows 7 and macOS 10.12 `[S1]`, and the Pro 7 and add-on shop pages say Windows 7 with macOS 10.12 or 10.14 `[S17][S18][S19]`. Optional hardware: microphone, MIDI controller, and headphones, which are required when using the microphone `[S1]`.
- **Languages**: the website lists 17 interface languages `[S1]`; the iOS listing shows 18 (Swedish was added in 7.8.1, Aug 2025) `[S14]`. Add-on courses ship in fewer languages; UK Grades and Solfege Fundamentals list English only on their shop pages `[S18][S19]`.
- **MIDI on mobile**: iOS-only `[S7]` until the Aug 31 2026 Google Play release added it on Android `[S16]` `[current]`.
- A separate Mac App Store listing named "EarMaster 7" (Mac only, free with in-app purchases) also exists `[S15]`.

## 3.3 Editions and licensing

The vendor calls it one app, unlocked in different ways `[S4][S5]`:

| Edition / licence | Who | Platforms | What it unlocks |
| --- | --- | --- | --- |
| Free version | Individuals | iOS, Android, Windows, Mac | First 4 modules of the Beginner's Course (21 lessons in the teacher-guide listing, which matches the store text "20+ lessons"). Interval Identification and Chord Identification in Customized Exercise mode. Free courses *Call of the Notes*, *Greensleeves* and *Carmen – Habanera*. Voice input, MIDI input and detailed statistics are included; cloud sync is not `[S4][S6][S9][S14]` |
| Perpetual licence ("EarMaster Pro 7"; also a "Family Pack") | Individuals | Windows + Mac. Pro: 2 computers you own, not used at the same time. Family Pack: 6 computers in one household `[S17][S31]` | Beginner's Course, 14 General Workshops, 9 Jazz Workshops, and the 12 Customized-Exercise activities that are not already free. Vocal Trainer, UK Grades, RCM Voice, Melodia and Solfege Fundamentals are separate paid add-ons. Major version upgrades are paid `[S4][S17][S30]` |
| In-app purchases | Individuals | One store: iOS/iPadOS, Android (incl. Chromebook) or Mac App Store. A purchase carries over to other devices on the same Apple or Google account `[S4][S31]` | Content sections bought individually or as bundles, "from 1.99" `[S4][S14][S15]` |
| Personal subscription | Individuals | iOS, Android, Windows, Mac, with cloud sync of settings and results | All lessons and courses, including major upgrades; monthly or annual plan. A non-renewing "One-Year All-Access Pass" gives the same access `[S3][S4][S5][S31]` |
| EarMaster Cloud (school licences) | Schools, conservatories, choirs, private studios | Students on all platforms. The **teacher version runs on Windows/Mac only** | Everything plus teacher tools (Workbook Editor, Assignment Manager, Student Results, Music Library), a web admin console and cloud sync. It is the only column of the licence table that includes the teacher version `[S3][S4][S9]` |

- "EarMaster School" and "EarMaster Teacher Edition" are **older** names. The EarMaster 5 guide covers "EarMaster School 5" and "Pro 5", and version 6 had a Teacher Edition with a course editor, LAN "Lab Packs" and email export of results; the 2014 Teacher Edition guide already mentions an "EarMaster Cloud Edition" alongside them `[S12][S13]`. Today the teacher version is offered only with school licences (EarMaster Cloud), and the webshop sells no School or Teacher edition `[S4][S30]` `[current]`. That Cloud replaced those editions is our reading `[inferred]`; the teacher guide notes that workbooks were "formerly called Courses in EarMaster 6" `[S9]`.
- **14 customizable activities**: the Pro shop page's "12 configurable activities" and the mobile page's "12 Customized Exercises" `[S7][S17]` are **not a contradiction**: the Pro page lists them next to "2 customized activities" in the free content, i.e. 12 paid plus the free Interval and Chord Identification make the licence table's 14 `[S4][S17]` `[current]`.

## 3.4 Pricing

- Freemium entry, with four ways to pay: one-off per desktop or per store, subscription (or one-year pass) across all platforms, or a school licence.
- **Currency**: the official product pages insert the currency symbol through a region-dependent snippet. Our fetch rendered €, a US-based fetch rendered no symbol, and the webshop shows $. The same numbers recur in both currencies (2017 launch €59.95 / US$59.95; 2023 add-on $34.95 / €34.95), so EarMaster appears to use identical nominal prices in USD and EUR `[S3][S4][S17][S21][S33]` `[inferred]`.
- **Personal subscription**: €3.65/month on the annual plan (billed €43.80/year) or €5.99 month to month. The "from 3.65/month" on the licence and buy pages is the annual plan's monthly equivalent. The One-Year All-Access Pass costs €49.95 / $49.95 `[S3][S5][S17]` `[current]`. In 2023 the plans were $3.30/€3.30 (annual) and $5.50/€5.50 (monthly) per month `[S33]`.
- **Perpetual desktop licences** (webshop, USD): Pro 7 $59.95, unchanged since launch; Family Pack $99.95; Pro 7 upgrade from v5/v6 $30 (Family Pack upgrade $50); "Ultimate Collection" of all desktop licences $174. Add-ons: Vocal Trainer $14.95, Solfege Fundamentals $9.95, Melodia $29.95, RCM Voice $29.95, Aural Trainer for UK Grades $29.95 `[S17][S18][S19][S30]` `[current]`.
- **In-app purchases** (US App Store, iPhone/iPad): Beginner's Course bundle $7.99 (modules 5–13 alone $3.99), General Workshops bundle $14.99, Jazz Workshops bundle $14.99, Customized Exercises bundle $14.99, Vocal Trainer $14.99, single workshops such as "General: Interval Identification" $1.99 `[S14]`. Mac App Store: EarMaster Pro 7 $49.99, Vocal Trainer $14.99, Solfege Fundamentals $9.99, Melodia, RCM Voice and UK Grades $29.99 each `[S15]` `[current]`.
- **School (EarMaster Cloud)**: annual subscription, minimum 5 users, teachers cost the same as students. The tier table runs from €21.50 per user per year (5–9 users) down to €5 (1000+ users), and the webshop lists the same range as $5.00–$21.50 `[S3][S30]` `[current]`. The Cloud page's summary line and the licence tables disagree with this (3.8). Two alternatives exist `[S3]`:
  - *Consumable credits*: 1 credit covers 365 user-days, users can be added or removed at any time, and packs run from 10 credits (€170) to 1000 credits (€5,499), advertised as up to 40% cheaper.
  - *Student-paid licences*: students buy their own subscription or pass; the school gets free teacher accounts, one for the first 5 enrolled students, then one more per 20.
- A 2016 iPad review quoted in-app prices of about US$2.99 for the Beginner's Course and US$11.99 for the General Workshops `[S22]` `[old]`.

## 3.5 Course catalog

Every course and workshop is built from the same 14 activities (1.2) `[S1][S11]`.

| Course / workshop | Size claimed | Content | Status |
| --- | --- | --- | --- |
| Beginner's Course | 219 lessons in 22 modules; the shop page and the teacher-guide listing agree `[S9][S17]` | Learn-by-doing theory plus ear training: pitch, pulse, notation, duration, tonality, measures, scale degrees one at a time (sub-dominant, dominant, leading tone, submediant), consonance, subdivisions, triads, syncopation, ties, harmonic progressions, compound subdivision, full major scale, then **Mastery Tests** | Pro / sub. First 4 modules free |
| 14 General Workshops | 2000+ lessons `[S17]`; the teacher-guide lists sum to about 2,000 | One per activity (1.2), graded from beginner to advanced | Pro / sub |
| 9 Jazz Workshops | 600+ lessons `[S17]`; the teacher-guide lists sum to only about 360 | Jazz chords (4–7 note, scale-derived), jazz progressions (secondary dominants, tritone subs, modal interchange), swing, straight and 6/8 rhythms, and dictation, sight-singing and singback on blues and 1920s standards `[S9]` | Pro / sub |
| Vocal Trainer | "200 exercises" `[S1][S36]`; 311 lesson entries in the teacher guide, counting preparatory and recap lessons | 6 levels. Each level has Technical Exercises (vocalises, each with a "preparatory lesson"), Clapback, Intervals, Sight Singing, and a "Final Step" test. Levels 5–6 replace Clapback with Singback and add Chord Identification `[S9]` | Paid add-on, added Dec 2022 (7.3.2) as a rework of the old "RCM Voice – Levels 1-6" course (2012 syllabus) `[S14][S32]` |
| Aural Trainer for UK Grades (formerly "Aural Trainer for ABRSM") | "hundreds" | Prepares for ABRSM aural tests, grades 1–5 (1.3) `[S18][S35]`. Not in the teacher guide's course listing | Paid add-on, added May 2023 (7.4.4) `[S14][S34]` |
| RCM Voice | "500 exercises" in 63 chapters `[S32]`; 494 lessons in the teacher guide | RCM Voice Preparatory to Level 8, following the 2019 syllabus. Technical Tests, Chords, Singback, Sight-Reading and a Final Step at every level; Clapback Preparatory–Level 4; Intervals from Level 1; Chord Progressions from Level 5 `[S9][S32]` | Paid add-on, new course Jan 2023 (7.4.1) `[S14]` |
| Solfege Fundamentals | 67 exercises `[S1]` | Movable-do solfege: singing scales and melodies with feedback `[S19]` | Paid, added Jan 2025 (7.7.1) `[S14]` |
| Melodia | 1500 exercises in 425 lessons | Interactive version of the Cole & Lewis *Melodia* sight-singing method (1904) `[S20]` | Paid, added Aug 2025 (7.8.1) `[S14]` |
| Call of the Notes | — | Call-and-response course: EarMaster plays a note or interval and you sing or play it back (microphone or MIDI) `[S37]` | Free, added Sep 2023 (7.4.7) `[S14]` |
| Greensleeves / Carmen – Habanera | — | Themed mini-courses built around one piece `[S14]` | Free, added Aug 2024 (7.6.1) and Jan 2026 (7.9.1) |
| Score library | 600+ scores (200+ jazz lead sheets, 400+ classical) | Source material for custom exercises. MusicXML import on desktop `[S3][S8]` | Pro / Cloud |

Per-activity module and lesson lists for the General and Jazz Workshops are in each activity's **Levels** line in 1.2.

**Levels and target users**:

- Levels run from total beginner (Beginner's Course, Interval Comparison) to very advanced (jazz 7-note chords, modulations, 32nd-note rhythms, 12/8 and 7/8 meters). Exam courses follow external grade systems: ABRSM grades 1–5 and RCM Preparatory to Level 8 `[S9][S18]`.
- Target users `[S1]`: music students preparing for aural and sight-singing exams; hobbyists and professionals who want to keep their ear in shape; teachers, schools and choirs; singers, via the Vocal Trainer, RCM Voice and Melodia.

## 3.6 Teacher and school specifics

**Teacher workflow (Cloud)** `[S9]`:

1. Build a workbook from scratch, or by importing modules, lessons or entire workshops from built-in workbooks.
2. Save it locally.
3. Upload and assign it through the Assignment Manager. A class gets one class assignment and each student one personal assignment at a time; the workaround for several is duplicate classes.
4. Students see a "[Class] Assignments" entry on their home screen.
5. Results sync back to Student Results, filtered by class, date range and workbook (an assignment or a built-in course), with drill-down to module, lesson and every attempt of a student. Each lesson's score is the best completed attempt, and that is what the teacher sees by default. Results export as a printable HTML page or CSV `[S9][S29]`. Customized Exercise results are never uploaded.

Workbooks in the cloud cannot be edited: an edit is uploaded as a new assignment and tracked separately.

**MusicXML import and score-based exercises**: import is desktop-only and limited to one time and key signature, at most 6 flats or 5 sharps, and at most 8 monophonic voices, one of which may be chord symbols. The teacher guide adds: treble, bass and alto clefs only; whole to 32nd notes with dots, ties, triplets, quintuplets and septuplets; unsupported features are dropped or approximated (6/4 becomes 12/8) `[S8][S9]`. Only teachers (Workbook Editor) can save score-based exercises `[S8][S9]`. Export of the score library is disputed (3.8).

**Older school setups**: v5 School and v6 supported a local login or a LAN server, v6 Teacher Edition had a course editor, LAN "Lab Packs" and email export of results `[S12][S13]` `[old: v5/v6]`.

## 3.7 Reviews and user feedback

- **Store ratings**: App Store 4.6 stars from 428 ratings `[S14]`; Google Play 4.3 stars, 100K+ downloads `[S16]`.
- **Chord Inversions** (user review, 2020): criticises feedback that compares chord types built on the first heard note instead of within the same key `[S14]` `[single]`.
- **Melodic Dictation** (2026 review): calls generated melodies "mechanical" and recommends the score library instead `[S23]` `[single]`.
- **Sight-singing pitch detection** (2026 App Store review): misreads low male voices (harmonics taken as the sung pitch, unpitched transients scored as notes) `[S14]` `[single]`. This names the failure mode our G15 must test for.
- **Custom chords** (forum, 2009): custom chords were respelled so that the bass note became the root, limiting voicing drills (drop-2 etc.) `[S28]` `[old: v5]`.
- **Chord function** (forum, 2009–2011): users asked for chord function within a key, which arrived in 7.6.1 via single-chord progressions `[S14][S26]`. In 2009 staff said a freer harmonic-dictation activity was being considered for v6 `[S26]`; no later evidence of it was found.
- **Press**: Sound On Sound reviewed the iPad app in 2016 `[S22]`; KVR covered the EarMaster 7 launch `[S21]`; the Singing Community review `[S23]` is low reliability (see its source note).

## 3.8 Contradictions and confidence gaps

- **Headline totals** do not agree across the official pages: "4000 exercises" and "more than 2500 lessons" on the same features page `[S1]`, "4000+ exercises" on the home page `[S2]`, "4000 built-in lessons" on the Cloud page `[S3]`, "4000 lessons" on the mobile page `[S7]`, and 2500+ at the 2017 launch `[S21]`. The vendor uses "lesson" and "exercise" interchangeably. A plausible reconciliation: the Pro 7 page's "more than 2500 lessons" matches the Pro content in the teacher guide (219 + ~2,000 + ~360 ≈ 2,580), and "4000" matches the whole catalogue once the add-on courses (Vocal Trainer, RCM Voice, UK Grades, Melodia, Solfege Fundamentals) are counted `[S9][S17]` `[inferred]`. The Jazz "600+" figure remains unexplained.
- **"AI-powered Smart Adaptive Learning"**: the home page's one-sentence description matches the old adaptive-questions text `[S2]`. None of the 2022–2026 iOS release notes mentions any AI feature `[S14]`. Whether anything goes beyond the long-standing adaptive-question engine is **unknown**, and the "AI" label is unexplained.
- **Cloud prices**: the Cloud page's summary line ("$4.50 to $19.50") and the licence tables ("4.50–19.50") do not match the tier table and look out of date `[S1][S3][S4]`.
- **Requirements**: stale OS values on several pages (3.2).
- **Score library export**: the tutorials page says it is not possible, the teacher guide says it can be exported as an EarMaster database file `[S8][S9]` (unresolved; the teacher guide is probably newer).
- **Pitch-only sight-singing**: whether pitch-only lessons drop the metronome is not documented `[inferred]`.
- **12 vs 14 activities**: resolved, not a contradiction (3.3).
- **UK Grades exercises**: one vendor description only (1.3).
- **Categories EarMaster does not appear to have** (not found in any source): perfect-pitch note naming as its own activity (only the Melodic Dictation workaround with "play tonic" off), instrument/timbre identification, harmonic dictation (considered for v6 in 2009, no later evidence), pitch-error detection as its own activity (only rhythm error detection; UK Grades "Differences" may cover pitch), and scale-degree identification as its own activity. Melodic scale degrees are done through custom Melodic Dictation or Interval ID with the functional keyboard `[S1][S25]`; chord function within a key has been possible since 7.6.1 through single-chord "progressions" in Chord Progressions `[S14]`, which the 2009 forum thread had asked for `[S26]`.
- **Option defaults**: no source documents default values for any exercise option (1.1).

## 3.9 Sources

All URLs resolved and were re-checked against their citations on 2026-09-27 (S21 blocks plain command-line fetches but loads in a normal fetcher). Dates are the page's own date where one exists. PDFs were read by streaming them through a text extractor; none was saved.

- `[S1]` EarMaster features page (overview, 14 activities, features, requirements, licence table, 17 languages). Undated, current site; its requirements block is stale. <https://www.earmaster.com/products/ear-training-sight-singing/earmaster-software.html>
- `[S2]` EarMaster home page ("Smart Adaptive Learning", 4000+ exercises). <https://www.earmaster.com/>
- `[S3]` EarMaster Cloud for education (teacher tools, topics, school tier table, credits, student-paid prices incl. personal subscription and pass, licensing FAQ). Prices render in a region-dependent currency. <https://www.earmaster.com/products/ear-training-sight-singing/earmaster-cloud-edition.html>
- `[S4]` Licences and pricing / version comparison (per-licence feature matrix). <https://www.earmaster.com/products/ear-training-sight-singing/version-comparison.html>
- `[S5]` How to buy EarMaster (subscription "3.65/month", school, perpetual per platform, resellers). <https://www.earmaster.com/how-to-buy-earmaster.html>
- `[S6]` Download page (free content, OS requirements). <https://www.earmaster.com/download.html>
- `[S7]` EarMaster for iOS and Android (mobile features; MIDI on iOS only; "12 Customized Exercises"). Undated; mentions Greensleeves but not Carmen, so last edited between Aug 2024 and Jan 2026 `[inferred]`. <https://www.earmaster.com/products/ear-training-sight-singing/earmaster-for-mobile.html>
- `[S8]` Tutorials: MusicXML import and score-library exercises. <https://www.earmaster.com/support/knowledge-base/tutorials.html>
- `[S9]` Guides for EarMaster Cloud teachers (teaching tools, workbook structure, assignments, full lesson lists for the Beginner's Course, Vocal Trainer, RCM Voice and all General and Jazz workshops, MusicXML import, student results). Lesson counts in this file were tallied from these lists. <https://www.earmaster.com/support/earmaster-cloud/guides-for-teachers.html>
- `[S10]` EarMaster 7 Quickstart guide (PDF, 2 pp.): training modes, options, results. <https://www.earmaster.com/download/em7_gettingstarted_en.pdf>
- `[S11]` EarMaster 6 User's Guide (PDF, © 2012): activities, exercise settings, answer input, microphone and MIDI. <https://www.earmaster.com/download/EarMaster%206%20User%20Guide.pdf>
- `[S12]` EarMaster 6 Teacher Edition User Guide (PDF, © 2014): course editor, lesson properties, results. <https://www.earmaster.com/download/earmaster_teacher_edition_manual_en.pdf>
- `[S13]` EarMaster 5 User Guide for EarMaster School 5 and Pro 5 (PDF, © 2000–2009): customization options, scoring, clap feedback. <https://www.earmaster.com/download/EM_userguide_english.pdf>
- `[S14]` App Store: "EarMaster – Music Theory" (iPhone/iPad): description, 4.6 stars from 428 ratings, reviews, iOS 15.0+ requirement, 18 languages, US in-app prices, and version history 1.1.14 (2022-08-31) to 7.10.1 (Sep 1 2026). Release-note-to-version mapping re-verified: each note block precedes its version label, and the newest block matches the separate "What's New" text for 7.10.1. Store notes differ slightly per platform. <https://apps.apple.com/us/app/earmaster-music-theory/id1105030163>
- `[S15]` Mac App Store: "EarMaster 7" (Mac only, 7.10.1 of Sep 5 2026, macOS 10.15+, Mac in-app prices, Mac release notes including teacher-only changes, developer reply naming the "silent input" option). <https://apps.apple.com/us/app/earmaster-7/id1492991594?mt=12>
- `[S16]` Google Play: "EarMaster – Ear Training" (version 7.10.100, updated Aug 31 2026, Android 7.0+, 100K+ downloads, 4.3 stars; "What's new" announces MIDI input on Android). <https://play.google.com/store/apps/details?id=com.earmaster.android>
- `[S17]` Webshop: EarMaster Pro 7 (US$59.95; lesson counts per section; 12 configurable activities plus 2 free; related-product prices). <https://www.earmaster.com/shop/product/earmaster-pro-7.html>
- `[S18]` Webshop: Aural Trainer for UK Grades (exercise types per grade, $29.95). <https://www.earmaster.com/shop/product/aural-trainer-uk-grades.html>
- `[S19]` Webshop: Solfege Fundamentals ($9.95). <https://www.earmaster.com/shop/product/solfege-fundamentals.html>
- `[S20]` Melodia course page (English; the French URL previously cited carries the same text). <https://www.earmaster.com/products/ear-training-sight-singing/melodia-sight-singing.html>
- `[S21]` KVR Audio news: "EarMaster 7 … released" (24 Nov 2017; new features, 2,500+ exercises, €59.95 / US$59.95). <https://www.kvraudio.com/news/earmaster-7-music-theory-and-ear-training-software-released-39367>
- `[S22]` Sound On Sound review of EarMaster for iPad, Ben Glover (Oct 2016). <https://www.soundonsound.com/reviews/earmaster>
- `[S23]` Singing Community, "EarMaster Review" (updated Apr 2026, author not named; carries an affiliate-style download link and contains factual slips, e.g. stats as a paid-only feature, so treat as low reliability). <https://singingcommunity.com/earmaster-review/>
- `[S24]` Wikipedia: EarMaster (history and version timeline; flagged for lacking inline citations; last edited 6 Jul 2026). <https://en.wikipedia.org/wiki/EarMaster>
- `[S25]` EarMaster forum: "Functional ear training with EarMaster" (Apr 2016). <https://www.earmaster.com/forum/viewtopic.php?t=2357>
- `[S26]` EarMaster forum: "customized chord progressions" (2009–2011). <https://www.earmaster.com/forum/viewtopic.php?t=1044>
- `[S27]` EarMaster forum: "Melodic dictation" (2008; tone reference options). <https://www.earmaster.com/forum/viewtopic.php?t=874>
- `[S28]` EarMaster forum: "EarMaster Wishlist thread" (2009; custom-chord voicing limitation). <https://www.earmaster.com/forum/viewtopic.php?t=978>
- `[S29]` Guides for EarMaster Cloud students (current EM7 exercise interface: progress bar, smart help, upper and lower instruments, evaluation labels and arrows; training modes; results structure; offline use). <https://www.earmaster.com/support/earmaster-cloud/guides-for-students.html>
- `[S30]` EarMaster webshop product listing (all current products with USD prices, incl. Family Pack, Ultimate Collection, Cloud subscription and credits). <https://www.earmaster.com/shop.html>
- `[S31]` EarMaster FAQ pages "Installation and setup" and "Licenses and subscriptions" (unlock methods per licence type, device limits, Family Pack). <https://www.earmaster.com/support/knowledge-base/frequently-asked-questions/installation-and-setup.html>, <https://www.earmaster.com/support/knowledge-base/frequently-asked-questions/orders-and-subscriptions.html>
- `[S32]` RCM Voice course page (500 exercises, 63 chapters, 2019 syllabus; old RCM Voice 1–6 reworked as Vocal Trainer). <https://www.earmaster.com/products/ear-training-sight-singing/rcm-voice.html>
- `[S33]` Audio News Room: "EarMaster New In-App Course 'Aural Trainer for ABRSM'" (May 2023; exercise types, 2023 prices). <https://audionewsroom.net/2023/05/earmaster-new-in-app-course-aural-trainer-for-abrsm.html>
- `[S34]` Sound On Sound news: "EarMaster Aural Trainer for ABRSM" (2023; exercise types, $34.95 / €34.95 launch price). <https://www.soundonsound.com/news/earmaster-aural-trainer-abrsm>
- `[S35]` Aural Trainer for UK Grades course page (same exercise list as the shop page). <https://www.earmaster.com/products/ear-training-sight-singing/aural-trainer-for-uk-grades.html>
- `[S36]` Vocal Trainer course page ("more than 200 exercises", topics). <https://www.earmaster.com/products/ear-training-sight-singing/vocal-trainer.html>
- `[S37]` Call of the Notes course page (mechanic: sing or play back a note or interval; free). <https://www.earmaster.com/products/ear-training-sight-singing/call-of-the-notes.html>
- Repository files used for Part 2: `AGENTS.md`, `notation/interaction.md`, `notation/audio.md`, `notation/interface.md`, `notation/playback.md`, `notation/mnx.md`, `notation/README.md`, `notation/roadmap.md`, `apps/web/src/exercises/*.tsx`, `apps/web/src/sound.ts`, `packages/notation-engine/src/query/timemap.ts`.
