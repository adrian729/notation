# Ear-training landscape (excluding EarMaster)

Purpose: specify every exercise and feature found across ear-training apps, courses, open-source projects and exam curricula (EarMaster is in [earmaster.md](earmaster.md)), then say what they mean for Polyhymnia.
Part 1 is the build-ready catalog, Part 2 the implications for our code, Part 3 the research record (resources, pedagogy, sources) behind both. Research accessed and fact-audited 2026-09-27.

Contents
- [Part 1 — Exercises and features](#part-1--exercises-and-features): [1.1 Tiers](#11-tiers-proposal) · [1.2 Template and shared defaults](#12-template-and-shared-defaults) · [1.3 Index](#13-exercise-index) · [1.4 T0](#14-t0-exercises-mvp) · [1.5 T1](#15-t1-exercises) · [1.6 T2](#16-t2-exercises) · [1.7 T3](#17-t3-exercises) · [1.8 Not planned](#18-not-planned) · [1.9 Features](#19-features)
- [Part 2 — Implications for Polyhymnia](#part-2--implications-for-polyhymnia): [2.1 What exists](#21-what-exists-today) · [2.2 Fits current primitives](#22-fits-current-primitives) · [2.3 Per-exercise verdict](#23-per-exercise-verdict) · [2.4 New capabilities](#24-needs-new-capabilities) · [2.5 Gaps](#25-gaps-and-build-order) · [2.6 Notation-API gaps](#26-known-notation-api-gaps) · [2.7 MVP tiers](#27-proposed-mvp-tiers-proposal) · [2.8 Open questions](#28-open-questions-for-the-owner)
- [Part 3 — Research record](#part-3--research-record): [3.1 Method](#31-method-and-scope) · [3.2 Codes](#32-resource-codes) · [3.3 Resources](#33-resources) · [3.4 Exams](#34-exam-curricula-what-institutions-test) · [3.5 Pedagogy](#35-pedagogy-and-research-notes) · [3.6 Complaints](#36-recurring-user-complaints) · [3.7 Dropped](#37-dropped-resources) · [3.8 Confidence gaps](#38-confidence-gaps) · [3.9 Sources](#39-sources-all-accessed-2026-09-27)

## Part 1 — Exercises and features

Resource codes (FET, TD, TH, …) are expanded in [3.2](#32-resource-codes). "Row n" is the row number of the original 38-row consolidated taxonomy, kept so every type stays traceable. Evidence labels (strong / moderate / weak) are defined in [3.5](#35-pedagogy-and-research-notes). Anything marked *(proposal)* is our design choice, not something a resource documents.

### 1.1 Tiers (proposal)

| Tier | Meaning *(proposal)* |
|---|---|
| **T0** MVP | Current notation and audio primitives plus a pure exercise layer (question generation, evaluation) and a minimal app shell. No tap timing, mic, MIDI, grand staff or samples. Includes the three existing demos. |
| **T1** | Current primitives plus small additions: drone/cadence `Instrument`, sampled piano, on-screen piano, rhythm-variant generator, bass-clef content, scheduling basics. |
| **T2** | Needs one new major capability: metronome + tap timing, rhythm entry, MIDI input, a harder generator, or a low-evidence drill we still want. |
| **T3** | Needs mic pitch detection, grand staff / multi-part layout, expressive playback, or has weak demand. |

Reconciliation with the earlier tier list of this file (kept in [2.7](#27-proposed-mvp-tiers-proposal)) and with [ear-training.md](ear-training.md): T0 = the old "Tier 0 (exists)" plus the button-only core of the old "Tier 1" (scale degree, intervals, chords, generated dictation) plus whole-progression ID. Rhythm-variant error detection, bass-line dictation, cadence ID and the drone/sample instruments are T1. Rhythm dictation and two-voice dictation are T2, as in the old "Tier 2". Old "Tier 3" (tap, MIDI, mic, adaptive levels) splits into T2 (tap, MIDI) and T3 (mic); adaptive selection moves earlier (T1) because it is pure logic.

### 1.2 Template and shared defaults

Each exercise entry uses one template:
- **Goal** — what skill is trained.
- **Played** — the audio stimulus.
- **Shown** — what is on screen before and after the answer.
- **Answer** — how the learner answers.
- **Options** — parameters, defaults first.
- **Generation** — how questions are made.
- **Feedback** — evaluation and what is revealed.
- **Progression** — how difficulty grows.
- **Offered by** — resource codes; row number; evidence or uncertainty tags.

Shared defaults *(proposal)*, assumed unless an entry says otherwise:
- **Lifecycle:** generate (pure, seeded) → optional reference (tonic, cadence or drone) → play → answer → evaluate (pure) → feedback and reveal → next (manual; auto-advance optional).
- **Item key:** every question names what is learned as a string, e.g. `interval:M3:asc`, `degree:major:b6`. Stats, weighting and review use item keys, never MNX content.
- **Parameters:** `seed` (random per session); `keys` C, G, F, D, B♭ major plus relative minors; `range` C3–C6; `clef` treble (bass for low content); `tempo` per exercise; `instrument` synth; `replayLimit` unlimited in practice, 4 in exam mode (AP melodic dictation plays 4 times); `labels` switchable (degrees, moveable-do, letters); `answerSurface` buttons unless stated.
- **Generation:** seeded PRNG; interleave all enabled items by default (evidence moderate, [3.5](#35-pedagogy-and-research-notes)); never the same item three times running; every generated pitch inside `range`; generated MNX carries explicit ids on every note the app references.
- **Evaluation:** pure `(question, answer, params) → { correct, score 0..1, parts }`. Multiple choice is all-or-nothing; multi-note answers score correct parts / total parts. Checked after the learner commits, not note by note.
- **Feedback:** mark parts correct / incorrect / missed; always show the answer as text; offer replay and "hear my answer" (UX convention, not evidence); tonal exercises may play the resolution to the tonic (FET, BE).
- **Progression:** a level is a named parameter preset; advance at ≥85% over the last 20 questions *(proposal; no resource publishes a threshold)*.

### 1.3 Exercise index

| Id | Exercise | Tier | Rows |
|---|---|---|---|
| E1 | Interval size comparison | T0 | 2 |
| E2 | Interval identification (melodic, harmonic) | T0 | 3, 4 |
| E3 | Scale degree in context (functional) | T0 | 6 |
| E4 | Scale / mode identification | T0 | 9 |
| E5 | Chord quality identification | T0 | 10 |
| E6 | Chord progression identification | T0 (whole) / T1 (chord by chord) | 14 |
| E7 | Melodic dictation, pitch only | T0 (demo exists) | 18 |
| E8 | Pitch error detection | T0 (demo exists) | 30 |
| E9 | Pitch comparison | T1 | 1 |
| E10 | Interval in tonal context | T1 | 5 |
| E11 | Chord inversion identification | T1 | 11 |
| E12 | Cadence identification | T1 | 16 |
| E13 | Bass-line dictation | T1 | 19, 20 (subset) |
| E14 | Melodic memory, play-back | T1 (on-screen piano) / T2 (MIDI) | 21 |
| E15 | Metre identification | T1 | 25 |
| E16 | Rhythm error detection and heard-change detection | T1 | 30 |
| E17 | Notation reading drills | T1 | 34 |
| E18 | Tonic / key finding | T2 | 8 |
| E19 | Extended / jazz chords and progressions | T2 | 12 |
| E20 | Chord tone / voicing identification | T2 | 13 |
| E21 | Melodic dictation, pitch and rhythm | T2 | 18 |
| E22 | Two-voice / part dictation | T2 | 19 |
| E23 | Rhythm dictation | T2 | 22 |
| E24 | Rhythm clap-back / tap-back | T2 | 23 |
| E25 | Rhythm reading | T2 | 24 |
| E26 | Pulse tapping | T2 | 25 |
| E27 | Play the score, checked | T2 (MIDI) / T3 (mic) | 35 |
| E28 | Absolute pitch naming | T2 (optional path) | 7 |
| E29 | Harmonic dictation | T3 | 20 |
| E30 | Modulation identification | T3 | 17 |
| E31 | Pitch matching with live tuning | T3 | 29 |
| E32 | Sing a named interval or degree | T3 | 28 |
| E33 | Echo / sing-back | T3 | 27 |
| E34 | Sight-singing | T3 | 26 |
| E35 | Describe musical features | T3 | 31 |
| E36 | Instrument / timbre identification | T3 | 32 |
| E37 | Microtonal / tuning accuracy | T3 | 37 |
| E38 | Transcription of real music | T3 | 36 |
| — | Progressions in real recordings; technical ear; atonal as a type | Not planned | 15, 33, 38 |

38 specified exercises covering all 38 taxonomy rows (rows 3+4 merged, rows 19/20 and 25 and 30 split by capability).

### 1.4 T0 exercises (MVP)

#### E1 Interval size comparison · T0
- **Goal:** judge which of two intervals is larger; needs no theory.
- **Played:** interval A, 0.8 s pause, interval B; each melodic (asc/desc) or harmonic.
- **Shown:** nothing; after answering, both intervals on the staff.
- **Answer:** buttons A / B (keys 1 / 2).
- **Options:** `intervals` {m3, M3, P4, P5}; `mode` asc | desc | harmonic, default asc; `commonTone` shared first tone | none, default shared.
- **Generation:** two different-size intervals from the set; roots per `commonTone`, both in range.
- **Feedback:** exact; reveal names and staff; replay each separately.
- **Progression:** perfect → consonant → dissonant → all simple → compound; shared root → independent roots.
- **Offered by:** PE, EB, TG (Calibrator). Row 2.

#### E2 Interval identification (melodic, harmonic) · T0
- **Goal:** name a heard interval.
- **Played:** one interval: melodic ascending (default), descending, or harmonic.
- **Shown:** nothing; after answering, the interval on the staff. Staff-entry variant: first tone given, learner clicks the second.
- **Answer:** buttons in size order m2 … P8 (compound later); keyboard shortcuts. Variant: staff click.
- **Options:** `intervals` {m2, M2} then growing; `directions` {asc}; `rootRule` random chromatic | diatonic in key; note 0.8 s, harmonic 1.5 s.
- **Generation:** weighted pick of (interval, direction); root so both tones fit; spell the upper tone by letter distance (M3 above E♭ is G).
- **Feedback:** exact; stats record direction as well as name; "hear my answer" plays the chosen interval from the same root.
- **Progression:** seconds → thirds → perfects → all within the octave; asc → desc → harmonic → mixed; compound last. RCM grows to all intervals within the octave, then 9ths at the top levels.
- **Offered by:** melodic: TD, TEO, MTN, AUR, PE, CET, TH, TG, CH, MET, EP, EB, OE, GS, TN, BK, RCM; harmonic: AUR, PE, CET, TH, TG, MET, GS. Rows 3, 4.

#### E3 Scale degree in context (functional) · T0
- **Goal:** hear a note against an established key and name its degree (Functional Ear Trainer method).
- **Played:** reference (cadence I–IV–V–I, block chords, default; or drone), pause, target note; after answering, the resolution: stepwise motion to the nearest tonic (FET, BE).
- **Shown:** degree keyboard only; optional staff reveal of target and resolution.
- **Answer:** degree buttons in chromatic order, labelled as numbers, do-re-mi or letters (FET offers all three); number keys.
- **Options:** `degrees` Simple (1-3-5) → Diatonic → Chromatic (TD's sets); `mode` major, minor, any mode (OE); `key` fixed per session (TD option) or random; `reference` cadence | drone; `octaves` one → several; `resolution` on.
- **Generation:** weighted pick of degree and octave within range.
- **Feedback:** exact, octave-agnostic; play resolution; per-degree table of times heard, times wrong, % (TD).
- **Progression:** FET: half a scale → full octave → multiple octaves → other scales, about 10 minutes a day recommended. Chromatic degrees last.
- **Offered by:** FET, TD, TH, OE, BE, MET, SET (drone), MU, CH (tonal sequences). Row 6. Evidence: tonal context helps interval perception (moderate, lab); the FET method itself has no controlled trial (weak).

#### E4 Scale / mode identification · T0
- **Goal:** name a heard scale or mode.
- **Played:** one octave, 0.35 s per note; ascending, descending, or both (melodic minor descends as natural minor).
- **Shown:** nothing; reveal on the staff.
- **Answer:** buttons.
- **Options:** `scales` {major, natural minor} growing to harmonic/melodic minor, church modes, pentatonics, symmetric scales; `direction` asc.
- **Generation:** weighted pick; root so the octave fits range; spell by formula.
- **Feedback:** exact; "hear my answer" plays the chosen scale on the same root.
- **Progression:** major/minor → minor forms → modes → pentatonic → whole-tone, diminished, others. CET lists 28 scales.
- **Offered by:** TD, TEO, MTN, AUR, PE, CET, TG, MET, EB. Row 9.

#### E5 Chord quality identification · T0
- **Goal:** name a heard chord's quality.
- **Played:** one chord, block (default) or arpeggiated.
- **Shown:** nothing; reveal on the staff. Staff-entry variant: bass given, learner clicks the other tones.
- **Answer:** buttons (maj, min, dim, aug, then sus and sevenths). Variant: staff clicks.
- **Options:** `qualities` {maj, min}; `voicing` root position; `execution` block | arpeggio.
- **Generation:** weighted pick; root so all tones fit; spell from the root.
- **Feedback:** exact; "hear my answer" on the same root. Staff variant: set comparison with per-tone partial credit.
- **Progression:** maj/min → dim/aug → sus → sevenths. RCM: triads, then dominant and diminished sevenths, later augmented triads and other seventh qualities.
- **Offered by:** nearly all resources; RCM. Row 10.

#### E6 Chord progression identification · T0 (whole) / T1 (chord by chord)
- **Goal:** identify a progression, or name each chord's function.
- **Played:** 3–8 block chords, close voicing with smooth voice leading.
- **Shown:** nothing; reveal Roman numerals as text and upper voices on one staff. Chord-by-chord variant: a row of chord boxes, first given as I.
- **Answer:** whole: one button per progression in the set. Chord-by-chord: a degree picker per box.
- **Options:** `progressions` {I–IV–V–I, I–V–I, I–IV–I, I–vi–IV–V}; `mode` major/minor; `vocabulary` I, IV, V → + ii, vi → sevenths → secondary dominants.
- **Generation:** whole: pick from the set, random key, voicings from a per-function table *(proposal: no general solver)*. Chord by chord: weighted walk T → S → D → T, length 4–8 *(proposal)*.
- **Feedback:** whole all-or-nothing; chord by chord per-chord partial credit; replay chord by chord with highlighting.
- **Progression:** RCM: from I–IV–I or I–V–I up to naming each chord of a four-chord progression built from I, IV, V and vi. Chord Crush adapts puzzle choice by rating (Train mode).
- **Offered by:** TD, TEO, AUR, PE, CET, TH, TG, CH, MET, EP, CC, OE, RCM. Row 14.

#### E7 Melodic dictation, pitch only · T0 (demo exists)
- **Goal:** notate the pitches of a heard melody whose rhythm is given.
- **Played:** tonic or cadence, then the melody.
- **Shown:** staff with the rhythm given as rest events and the first note given.
- **Answer:** click a staff position in each rest slot; ♭ ♮ ♯ toggles; click again to clear; hover shows a ghost note.
- **Options:** `length` 3–8 notes; `scale` major / minor; `maxLeap` P5; `ambitus` ≤ octave; `startDegree` 1 or 1-3-5; `replayLimit`; exam mode per AP (4 bars, played 4 times with 50-second pauses, first pitch given, pulse established before each playing).
- **Generation:** step-biased random walk over scale degrees within ambitus and max leap; MNX with rest events at answer positions and explicit ids; answers kept in app state by event id.
- **Feedback:** per-note pitch; score correct / answerable; text list of answers; replay with cursor over the revealed answer.
- **Progression:** short stepwise in C → other keys → minor → longer with leaps → rhythm (E21). Karpinski: give tonic/cadence and first note, limit hearings, chunk.
- **Offered by:** TD (as degrees), TEO, AUR, PE, CET, MET, EP, AP, BK. Row 18. Karpinski model: expert pedagogy, weak as intervention evidence.

#### E8 Pitch error detection · T0 (demo exists)
- **Goal:** spot which played notes differ from the printed score.
- **Played:** a variant of the displayed melody with k pitches changed.
- **Shown:** the correct score.
- **Answer:** click noteheads to toggle selection, then Check.
- **Options:** `changes` 1–3 (default 1); `changeSize` diatonic step | semitone | leap; `length` 4–16.
- **Generation:** melody generator or library excerpt; alter k distinct notes within scale and range; played events keep the original note ids.
- **Feedback:** per note correct / wrong pick / missed; score max(0, hits − wrong picks) / k *(proposal)*; replay correct and variant back to back.
- **Progression:** 1 change in 4 notes → 3 in 16; step → semitone *(proposal)*.
- **Offered by:** AUR, ABRSM (G1–3, heard change), ABR. Row 30.

### 1.5 T1 exercises

#### E9 Pitch comparison · T1
- **Goal:** higher / lower (/ same) for two tones.
- **Played:** two tones, 0.6 s each, 0.3 s gap.
- **Shown:** nothing; optional reveal.
- **Answer:** buttons Higher / Lower / Same.
- **Options:** `semitoneDiffs` 7–12 → 1–2; `allowSame` off.
- **Generation:** first tone in range, weighted difference, random direction.
- **Feedback:** exact.
- **Progression:** large → small differences → add Same; below a semitone see E37.
- **Offered by:** TH, PE. Row 1.

#### E10 Interval in tonal context · T1
- **Goal:** name an interval heard after a key is set.
- **Played:** cadence or tonic, then an interval whose tones are in the key.
- **Shown / Answer / Feedback:** as E2.
- **Options:** as E2 plus `reference` cadence; `rootRule` diatonic.
- **Generation:** both tones diatonic to the key.
- **Progression:** as E2.
- **Offered by:** TD, MET. Row 5. Evidence: tonal context (moderate).

#### E11 Chord inversion identification · T1
- **Goal:** name root position, 1st, 2nd (3rd) inversion.
- **Played:** one chord, block or arpeggiated, bass tone kept fixed across a question family.
- **Shown:** nothing; reveal.
- **Answer:** buttons Root / 1st / 2nd (/ 3rd).
- **Options:** `qualities` {maj, min}; `inversions` {root, 1st, 2nd}.
- **Generation:** pick (quality, inversion), build upward from the fixed bass.
- **Feedback:** exact; "hear my answer" keeps the same bass.
- **Progression:** triads → sevenths; block → arpeggio.
- **Offered by:** PE, CET, TH, TG, EB, MET. Row 11.

#### E12 Cadence identification · T1
- **Goal:** name the cadence that ends a phrase.
- **Played:** a generated 3–5 chord phrase, or a library excerpt with cursor.
- **Shown:** nothing (generated) or the score (excerpt).
- **Answer:** buttons Perfect/Authentic, Imperfect/Half, Plagal, Interrupted/Deceptive; UK or US names.
- **Options:** `cadences` {perfect, imperfect} → + interrupted → + plagal.
- **Generation:** pre-cadential chords from a small table + cadence pair; for excerpts the answer is app data keyed by the final chord's note id.
- **Feedback:** exact; replay last two chords.
- **Progression:** ABRSM: perfect and imperfect at Grade 6, interrupted by Grade 7, plagal by Grade 8 *(secondary summary)*.
- **Offered by:** TH, AUR, GS, ABRSM (G6–8). Row 16. RCM names progressions, not cadence types.

#### E13 Bass-line dictation · T1
- **Goal:** notate the bass of a heard progression (the bass half of harmonic dictation).
- **Played:** reference, then the progression.
- **Shown:** bass-clef staff, rhythm given as rest events, first bass note given.
- **Answer:** slot clicks with accidental toggles, as E7.
- **Options:** progression options as E6; `inversions` off (bass = roots) → on.
- **Generation:** progression generator; single-voice bass MNX with rest events and explicit ids.
- **Feedback:** per note; reveal the bass plus Roman numerals as text.
- **Progression:** roots of I IV V → + ii vi → inversions.
- **Offered by:** subset of row 20 (TEO four-voice, AUR, AP bass part) and row 19. *(proposal: split out because it needs only one staff.)*

#### E14 Melodic memory, play-back · T1 (on-screen piano) / T2 (MIDI)
- **Goal:** reproduce a heard melody on an instrument.
- **Played:** reference, then 3–8 notes.
- **Shown:** on-screen piano (or guitar/bass); staff reveal afterwards.
- **Answer:** play the pitch sequence on the virtual instrument; MIDI keyboard later. No timing.
- **Options:** `length`; `scale`; range within the visible keyboard; octave-exact or any octave.
- **Generation:** melody generator.
- **Feedback:** sequence alignment → per-note correct / wrong / missing / extra *(proposal)*; staff reveal.
- **Progression:** 3 stepwise → 5 → 8 with leaps.
- **Offered by:** CH, TH, TG, RCM (playback on the instrument), ABRSM (G4–8, sing or play). Row 21. Answering by playing is the most requested missing FET feature.

#### E15 Metre identification · T1
- **Goal:** name the metre of an excerpt.
- **Played:** 2–4 bars with downbeats accented by velocity (1.0 vs 0.6 *(proposal)*).
- **Shown:** nothing; reveal the score.
- **Answer:** buttons 2 / 3 / 4 time (later 6/8).
- **Options:** `meters` {2/4, 3/4}; `material` generated | excerpt.
- **Generation:** rhythm + pitch generator per meter.
- **Feedback:** exact.
- **Progression:** 2 vs 3 → + 4 → + compound.
- **Offered by:** ABR, ABRSM (G1–3: say 2, 3 or 4 time; G4–5: name the time signature). Row 25 (metre part).

#### E16 Rhythm error detection and heard-change detection · T1
- **Goal:** (a) spot where a played rhythm differs from the printed one; (b) with no score, say whether a repeated phrase changed in pitch or rhythm.
- **Played:** (a) a rhythm variant (a note merged into its predecessor or split in two); (b) phrase, pause, same phrase possibly altered.
- **Shown:** (a) the correct rhythm; (b) nothing.
- **Answer:** (a) click the notes that differ; (b) buttons Pitch changed / Rhythm changed / No change.
- **Options:** `changes` 1 → 4; bars 2 → 8; (b) unchanged trials ~25% *(proposal)*.
- **Generation:** variant MNX from the original, laid out headlessly so ties and tuplets time correctly; answer ids = original ids of changed notes.
- **Feedback:** as E8.
- **Progression:** 2 bars → 8 bars; more meters.
- **Offered by:** AUR, ABRSM (G1–3 spot a change in pitch or rhythm), ABR. Row 30 (rhythm and heard-change parts).

#### E17 Notation reading drills · T1
- **Goal:** name a written note on staff, keyboard or fretboard (supports sound–symbol links; not ear training proper).
- **Played:** the note sounds after answering.
- **Shown:** one note on the staff.
- **Answer:** letter buttons or on-screen piano.
- **Options:** `clef` treble / bass / alto / tenor; ledger lines; accidentals.
- **Generation / Feedback:** weighted pick; exact.
- **Progression:** staff lines → ledger lines → other clefs → accidentals.
- **Offered by:** MTN, TH, TG (speed note reading), PE, NK. Row 34.

### 1.6 T2 exercises

#### E18 Tonic / key finding · T2
- **Goal:** find the tonal centre of an unreferenced passage.
- **Played:** 2–4 bar tonal melody or progression in a random key.
- **Shown:** nothing.
- **Answer:** 12 pitch-class buttons or on-screen piano; optional major/minor.
- **Options:** `material` melody | progression | excerpt; `modes` {major} → {major, minor}.
- **Generation:** generator with a clear tonal outline (tonic-triad tones on strong beats *(proposal)*).
- **Feedback:** pitch-class match; play the tonic under the passage.
- **Progression:** clear cadential endings → non-tonic endings → excerpts.
- **Offered by:** TH (tonic finder), Coursera intro. Row 8.

#### E19 Extended / jazz chords and progressions · T2
- **Goal:** identify sevenths, ninths, altered chords and jazz progressions.
- **Played / Shown / Answer / Feedback:** as E5 and E6 with a larger vocabulary.
- **Options:** chord set (CET has 36 chord types with inversions); jazz progression set (ii–V–I, turnarounds).
- **Generation:** chord formulas and voicing tables per quality.
- **Progression:** four-note chords → extensions → alterations.
- **Offered by:** CET (36 types), AUR (jazz progressions), MET. Row 12. Content extension of E5/E6, no new capability.

#### E20 Chord tone / voicing identification · T2
- **Goal:** say which chord member (root, 3rd, 5th, 7th) is on top or in the bass, or name the scale degree of a note over a chord.
- **Played:** one block chord voiced with the target member in the asked position.
- **Shown:** nothing; reveal.
- **Answer:** buttons Root / 3rd / 5th / 7th.
- **Options:** `position` top | bass; triads → sevenths.
- **Generation:** pick quality and member, build a voicing with it on top/bottom.
- **Feedback:** exact; replay with the top voice louder *(proposal)*.
- **Progression:** triads top → bass → sevenths.
- **Offered by:** TH (chord tones), OE (notes with chords: name both the scale degree and the chord degree), ABRSM (Singing for Musical Theatre only). Row 13.

#### E21 Melodic dictation, pitch and rhythm · T2
- **Goal:** notate both pitches and durations.
- **Played:** count-in, then 1–4 bars.
- **Shown:** empty measures with time and key signatures; first note optionally given.
- **Answer:** pick a duration from a palette, click in the bar (position gives tick and pitch); undo.
- **Options:** as E7 plus `noteValues` {half, quarter} → eighths, dots, rests, triplets, compound metres.
- **Generation:** beat-group rhythm templates per meter + pitch walk.
- **Feedback:** align by onset; pitch and duration each count; equivalent notations with the same onsets accepted by default.
- **Progression:** simple values → eighths → dots → compound; AP-style 4-bar exam mode.
- **Offered by:** TEO, AUR, PE, CET, MET, EP, AP, BK. Row 18.

#### E22 Two-voice / part dictation · T2
- **Goal:** notate both voices of a two-voice texture.
- **Played:** reference, both voices, each voice alone on request.
- **Shown:** one staff, voice 1 stems up, voice 2 stems down, rhythm given as rests.
- **Answer:** a voice toggle, then slot clicks per voice.
- **Options:** note-against-note → 2:1; length 4–8.
- **Generation:** first-species-style generator (consonances, contrary-motion bias) *(proposal)*.
- **Feedback:** per note per voice.
- **Progression:** outer voices of simple cadences → free two-voice.
- **Offered by:** TEO (one and two voices), AUR (part dictation *(first pass)*). Row 19.

#### E23 Rhythm dictation · T2
- **Goal:** notate a heard rhythm.
- **Played:** count-in, then 1–4 bars on one pitch or a click.
- **Shown:** empty measures on a staff at one pitch *(proposal: one-line percussion staff deferred)*.
- **Answer:** duration palette + click position, as E21 without pitch.
- **Options:** note values, rests, ties, dots, triplets; `meters`; `bars` 1–4; metronome while hearing.
- **Generation:** beat-group templates per meter, weighted by difficulty; pattern-based variants (TEO).
- **Feedback:** onset comparison; per-note marks.
- **Progression:** quarters/halves → eighths → sixteenths → rests → triplets → compound and odd metres.
- **Offered by:** TEO (including pattern-based), AUR, MET, EP, GS, TH. Row 22.

#### E24 Rhythm clap-back / tap-back · T2
- **Goal:** reproduce a heard rhythm in time.
- **Played:** count-in, rhythm, count-in for the answer.
- **Shown:** nothing during; afterwards the score with tap marks under the notes.
- **Answer:** taps (space, touch, pointer, MIDI pad); later mic claps.
- **Options:** as E23 plus `tolerance` ±min(100 ms, 25% of the shortest inter-onset interval) *(proposal)*.
- **Generation:** as E23.
- **Feedback:** match taps to notes by nearest onset after latency compensation; each note correct / early / late / missed, extra taps flagged. Lenient by default: users complain about over-strict rhythm marking.
- **Progression:** as E23; longer phrases, faster tempi.
- **Offered by:** AUR, PE, TH (rhythm repeat), TG (Rhythmic Parrot), ABR, RCM (clapback). Row 23.

#### E25 Rhythm reading · T2
- **Goal:** tap or clap a written rhythm in time.
- **Played:** metronome count-in, optionally during.
- **Shown:** the rhythm; optional cursor.
- **Answer:** taps.
- **Options / Feedback:** as E24; swing option.
- **Generation:** as E23; RR generates 1–8 bars with selectable time signatures and note values (ungraded).
- **Progression:** as E23.
- **Offered by:** AUR, PE, TH (rhythm reader), TG (Rhythmania), SRF, RR (ungraded). Row 24.

#### E26 Pulse tapping · T2
- **Goal:** tap the beat of a playing excerpt.
- **Played:** 4–8 bar excerpt.
- **Shown:** nothing; afterwards a beat strip.
- **Answer:** taps.
- **Options:** `tempo` 60–120.
- **Feedback:** inter-tap intervals within ±10% of the beat, phase-locked after the first bar *(proposal)*.
- **Offered by:** ABR, ABRSM (G1–3 clap the pulse), Trinity (may be asked to clap the pulse). Row 25 (pulse part).

#### E27 Play the score, checked · T2 (MIDI) / T3 (mic)
- **Goal:** play or sing written music and have it checked.
- **Shown:** the score with cursor.
- **Answer:** MIDI keyboard (T2) or a real instrument/voice via mic (T3).
- **Options:** instrument range; timing checked or pitch only.
- **Generation:** sight-reading generator (SRF sets rhythms, range, leaps, accidentals, dynamics, articulations, time and key signatures) or library excerpts.
- **Feedback:** pitch-sequence alignment; timing as E25 when checked.
- **Offered by:** NK (mic, real instrument), SRF (assesses recorded performances). Row 35.

#### E28 Absolute pitch naming · T2 (optional path)
- **Goal:** name a note with no reference.
- **Played:** one note, random octave; a masking gap or interfering tones between questions *(proposal)*.
- **Shown:** nothing.
- **Answer:** 12 pitch-class buttons (TN labels: note names, piano keys or solfège).
- **Options:** `pitchClasses` start with 2–3, grow to 12 *(proposal)*; `octaves`; practice mode with a reference pitch (TN).
- **Feedback:** pitch class, any octave; progress graphs (TN).
- **Progression:** add a pitch class at ≥90% *(proposal)*; TN runs easy → expert.
- **Offered by:** TN, TD, MTN. Row 7. Evidence: moderate for partial adult learnability, small samples, uneven success; treat as optional.

### 1.7 T3 exercises

All singing entries need mic pitch detection with calibration; users report unreliable marking and drills that move on too fast (ABRSM app, PE). Sung answers are marked on pitch, not vocal quality (ABRSM).

#### E29 Harmonic dictation · T3
- **Goal:** notate soprano and bass and give Roman numerals (AP style).
- **Played:** 4-voice progression; hearings limited by `replayLimit`.
- **Shown:** grand staff with rhythm given; numeral boxes.
- **Answer:** slot entry on two staves + numeral pickers.
- **Options:** 6–8 chords; vocabulary as E6.
- **Generation:** 4-voice voice-leading generator.
- **Feedback:** per note and per numeral.
- **Progression:** diatonic → sevenths → secondary dominants.
- **Offered by:** TEO (four-voice), AUR, AP. Row 20. Not before two-voice entry is solid.

#### E30 Modulation identification · T3
- **Goal:** say where or to which key the music modulates.
- **Played:** 8–16 chord progression or excerpt with one modulation.
- **Shown:** nothing, or the score with cursor.
- **Answer:** buttons (dominant, subdominant, relative); optionally click the pivot chord.
- **Generation:** pivot-chord templates *(proposal)*.
- **Feedback:** exact; reveal pivot.
- **Offered by:** ABRSM (G8, describe modulations). Row 17.

#### E31 Pitch matching with live tuning · T3
- **Goal:** sing a heard note in tune with continuous cents feedback.
- **Played:** one note in the singer's range (from a vocal-range test, SC).
- **Shown:** live pitch (note + cents), tuner or pitch graph.
- **Answer:** mic; commit when held within tolerance.
- **Options:** tolerance 50 → 25 → 15 cents *(proposal)*; hold 500 ms; SC modes Practice / Basic / Challenging (no melody playback) / Hard (no audio); BPM, looping, range limits, daily note goal (SC).
- **Feedback:** mean cents error over the hold.
- **Offered by:** SC, EL, TH (tuning game, vocal match). Row 29.

#### E32 Sing a named interval or degree · T3
- **Goal:** produce a requested pitch relation.
- **Played:** reference tone or cadence/drone; prompt "a 5th above D" or "sing ♭3".
- **Shown:** reference note; sung pitch as a live ghost.
- **Answer:** mic.
- **Options:** intervals or degrees; direction; labels.
- **Feedback:** nearest semitone equals target and cents within tolerance; tonal version plays resolution.
- **Offered by:** TH (vocal degrees), TG (sing a displayed interval), GS, MET, SET (Voice mode over a drone), ABRSM (Singing for Musical Theatre only). Row 28.

#### E33 Echo / sing-back · T3
- **Goal:** sing back a heard phrase.
- **Played:** phrase, then count-in.
- **Shown:** afterwards the score with the sung pitch curve; notes marked on pitch / on time / off.
- **Answer:** mic in time; instrument alternative.
- **Options:** generator as E7; pitch and timing tolerance.
- **Feedback:** segment the sung audio into notes; per-note pitch and onset. AURALBOOK shows the sung answer as notation against the correct answer.
- **Progression:** short stepwise → longer, minor, leaps.
- **Offered by:** TG, TH (sing-back), ABR, PE, MET, ABRSM (G1–3 echo-sing; G4–5 sing back a melody). Row 27.

#### E34 Sight-singing · T3
- **Goal:** sing written music; ideally graded.
- **Played:** optional starting note or cadence; listen-first practice mode (EL).
- **Shown:** score with cursor and live pitch graph; optional solfège (SRF solfège display).
- **Answer:** mic.
- **Options:** generator as E7; free-time pitch-only variant; AP format about 4–8 bars, 75 s practice, 30 s to perform.
- **Feedback:** per-note intonation and intervals scored separately (EL).
- **Progression:** EL learning path; SRF parameter levels.
- **Offered by:** AUR, EL, SRF, ABR, TG (sing notation back), AP, BK, ABRSM (G4–8). Row 26.

#### E35 Describe musical features · T3
- **Goal:** answer questions on dynamics, articulation, texture, style, period.
- **Played:** an excerpt with expressive playback (or recording).
- **Shown:** nothing or the score.
- **Answer:** multiple choice per question.
- **Generation:** question bank per excerpt, stored as app data keyed by note id.
- **Offered by:** ABRSM (all grades), Trinity (single extract, repeated), AP (multiple choice). Row 31.

#### E36 Instrument / timbre identification · T3
- **Goal:** name the instrument, or which part is louder in a mix.
- **Played:** a phrase on one of n sampled instruments.
- **Answer:** buttons.
- **Offered by:** TH (band instrument ID, channel/mix balance). Row 32.

#### E37 Microtonal / tuning accuracy · T3
- **Goal:** detect small pitch differences or out-of-tune notes.
- **Played:** two tones d cents apart, or a note flat / in tune / sharp against a reference.
- **Answer:** Higher / Lower, or Flat / In tune / Sharp.
- **Options:** start 50 cents; 2-down-1-up staircase *(proposal)*.
- **Feedback:** exact; show the threshold estimate.
- **Offered by:** TH (tuning game), Xenharmonium (alternate tunings); rare. Row 37.

#### E38 Transcription of real music · T3
- **Goal:** transcribe a real excerpt (solo, tune).
- **Played:** a library excerpt, chosen bars and voice.
- **Shown / Answer / Feedback:** as E21 against the excerpt's MNX.
- **Offered by:** CC and OE (chords only); otherwise rare. Row 36. Library excerpts as content for E7/E8/E12 are the "score library" feature.

### 1.8 Not planned

| Type | Why | Offered by |
|---|---|---|
| Progressions in real recordings | Licensed song corpus (Hooktheory's TheoryTab) we can't replicate | CC, OE (Android, via YouTube), CH (recorded music). Row 15 |
| Technical ear (EQ, compression, space) | Different product (audio engineering) | SG, TH, EarQuiz_Frequencies. Row 33 |
| Atonal / post-tonal as its own type | A content option (chromatic, no reference) for E7, E14, E3 instead | CH (atonal sequences), TEO (twelve-tone, theory). Row 38 |

### 1.9 Features

Each: what it does, defaults, acceptance check, where seen. Tier is a proposal.

| Feature | Spec | Seen in | Tier |
|---|---|---|---|
| Exercise definitions | Every exercise is data `{ type, params, levels[] }`, JSON-serializable, validated; invalid params give an error naming the field. Foundation for custom exercises. GNU Solfege's user-editable lesson files are the precedent. | GS (lesson files) | T0 |
| Seeded generation | One PRNG per session; same seed + definition → same questions on any device. | — *(proposal)* | T0 |
| Interleaving | Enabled items mixed within a session by default; a blocked option exists but is not default, because learners judge blocking better (Wong, Chen & Lim 2021, moderate). Check: with 4 items, none more than 3× in a row. | — (research) | T0 |
| Tonal reference | Cadence (I–IV–V–I or I–V–I), tonic or triad before tonal questions; `every question` or `on key change`; replayable separately. | FET, TD, OE, BE, MET (cadence) | T0 |
| Resolution to tonic | After answering, play stepwise motion from the target to the nearest tonic; default on for E3. | FET, BE | T0 |
| Switchable labels | Degrees, moveable-do, fixed-do, letters; one global setting with per-exercise override. Evidence on systems is weak and conflicting, so offer rather than pick. | FET (letters, numbers, do-re-mi), TD (solfège or numbers), TN (names, keys, solfège), TG, SRF, MU, BK | T0 |
| Feedback and compare | Correct/incorrect marks, answer as text, replay, "hear my answer", replay in another mode (harmonic vs melodic). Convention, not evidence. | Most apps | T0 |
| Per-item weakness stats | Per item key: times asked, times wrong, %, last seen; table per exercise. | TD (per degree), EB (per category), EP, PE, CET, TG (Performance Index), AUR (teacher view) | T0 |
| Notation display of the answer | Reveal the correct answer on the staff after answering. | TEO, AUR, MTN, SRF, PE, TH, NK, ABR (AURALBOOK) | T0 |
| Notation entry as the answer | Answer by placing notes on the staff (E2/E5 variants, E7, E13). Rare in other apps; our differentiator. | TEO, AUR (dictation); most apps use buttons | T0 |
| Keyboard shortcuts | Number/letter keys for answers, space replay, enter check/next; every T0 exercise completable without a pointer. | TD, BE | T0 |
| Local persistence | Stats, settings, progress stored locally, versioned, export/import JSON; corrupt storage resets with a warning. | — *(proposal)* | T0 |
| Accessibility | Keyboard flows, `aria-live` feedback, answer as text, states not by colour alone. | — *(proposal)* | T0 |
| Progressive curriculum / levels | Levels = parameter presets with a pass threshold; courses = ordered levels with unlocks, authored as data. | FET, CET, TH, CH, EL, AUR, MET, MU, PE, SET | T1 |
| Adaptive difficulty | Weakness-weighted item selection: weight = 1 + 3·errorRate(last 10) + recency bonus *(proposal)*; check: an always-missed item reaches ≥2× the others' frequency within 20 questions. Level-up by rating optional. | CC (Train mode, rating-based), TG and SET (vendor claims, mechanism undocumented); other apps claim personalization but rarely document it | T1 |
| Spaced repetition | Missed items enter a review queue at growing intervals (1, 3, 7, 21 days *(proposal)*); daily review draws from it. Evidence indirect for ear training. | CH (explicit mode); no other resource documents it | T1 |
| Review mistakes | End-of-session list of missed questions, each replayable with the learner's answer vs the right one. | — *(proposal)* | T1 |
| Custom exercises | Edit any exercise's params, save named presets, share by URL (definition + seed). | PE (IAP editor), MET, EB (shareable), CET, TD, TEO, MTN (customizer links), GS (lesson files), OE, SRF | T1 |
| Drone reference | Sustained tonic (± fifth) under a question block; volume control; stops on exit. | SET (drone-based) | T1 |
| Real samples | Sampled piano first, per-role instruments (question, reference, metronome) later. | CET (piano + 7 banks), CH (recordings), CC (patches + YouTube), AUR, SRF | T1 |
| Virtual-instrument answer | On-screen piano (then guitar, bass); any pitch-answer exercise can switch surface. | CH, MTN, TH, TG, MET | T1 (piano), T2 (others) |
| Integrated theory lessons | Short intro per lesson with playable examples. | CET (theory cards), PE, AUR, MU, MET, MTN | T1 |
| Listen-only interludes | Optional passive replays between question blocks. Evidence weak to moderate (Little et al. 2019; Amitay et al. 2006). | — (research) | T1 |
| Score library | Curated excerpts converted offline to MNX with metadata (key, meter, voice, bars), usable by E7, E8, E12, E25, E38. | — *(proposal)* | T1 |
| Daily short workout | 5–10 min mixed session from due reviews, weak items and current level; one tap to start. | TG (5 games), FET (10 min), PE dashboard, CC (daily challenge), SC (daily note goal) | T2 |
| Gamification | Streak, daily goal, points; leaderboards only once accounts exist. | CET, CH, EL, TH, TG, CC, SC, Tenuto (challenge), PE (points), FET (reminders, sharing) | T2 |
| Metronome and count-in | Accented click, lead-in bar, on while hearing/answering; scheduled as events, no timers in packages. | NK (metronome); SRF (playback with tempo control) | T2 |
| Tap input for rhythm | Space/touch/pointer/MIDI-pad taps on the audio clock, one-off latency calibration, tolerant alignment. | AUR, PE, TG, TH, ABR | T2 |
| MIDI input | Web MIDI notes as answers, chord capture; hidden where unsupported. | AUR, CH, TEO (reading), muse-training | T2 |
| Locked / exam mode | Lock params (replay limit, no hover-to-hear) for tests. | AUR (exams) | T2 |
| Mock exams for a board | Timed sequence of locked exercises in one board's format (e.g. AP melodic dictation: first pitch given, 4 playings, 50 s pauses), per-test summary. | ABR (AURALBOOK mock-exam mode), AUR (exams) | T2 |
| Hands-free / audio-only | Loop of question, pause, audible answer (resolution or reveal) needing no input; mechanic of SET's Pocket mode is not documented, so this spec is ours. | SET (Pocket mode) | T2 |
| Offline | Installable PWA; full T0 works with network off after first load. | Tenuto, OE, FET app, GS, NK | T2 |
| Localization | App strings and note-name conventions per locale. | — *(proposal)* | T2 |
| Mic pitch input | Pitch tracking + onset detection, calibration, headphone prompt, tolerant grading. | AUR, EL, PE, TG, TH, MET, ABR, SC, SET, NK, SRF | T3 |
| Accounts and sync | Optional account, cross-device sync. | MET (sync) | T3 |
| Teacher / classroom / LMS | Assignments, class results, export, LMS integration. Out of current scope. | TD→ToneSavvy, AUR (Canvas, Moodle, Blackboard), TH (30-student plan), TG (schools), MET, SRF, MTN (code checker), CET (teacher portal), Solfeg.io | T3 |
| Open source | Not a product feature: a licensing decision (see [2.8](#28-open-questions-for-the-owner)). | OE (MIT), GS (GPL), NK (GPL-3), BE (AGPL-3), RR (GPL-3) | — |

37 features specified, plus the open-source note.

## Part 2 — Implications for Polyhymnia

Grounded in `AGENTS.md`, `notation/interaction.md`, `notation/audio.md`, `notation/interface.md` and `apps/web/src/exercises/*` as of 2026-09-27. Detailed design for the exercise layer is drafted in [ear-training.md](ear-training.md) Part 2.

### 2.1 What exists today

- **Notation:** MNX render with `hitTest` (element, slot and point), `<Notation.Interaction>` activate and hover intents, `<Notation.Marks>` (states, selection, preview ghost), `<Notation.Playback>` (notes, cursor, manual), and `applyIntent` with `setPitches` (set, re-pitch, clear, chord). Two voices are addressable. Handle: `getLayout`, `getTimeMap`, `hitTest`, `setPlaybackTick`, `exportSVG`, `focus`.
- **Presets:** `NotesReveal` (any pitches, harmonic or melodic), `ScaleReveal` (major, natural/harmonic/melodic minor). They build MNX internally and only render.
- **Audio builders:** `melodic`, `harmonic`, `concat`, `shift` and `transpose` (pure `.` entry). Builder events carry no ids. `midi` may be fractional; `NoteEvent.velocity` is optional.
- **Score playback:** `eventsFromTimeMap` follows repeats, voltas and D.S. al Fine through `playOrder`, and drives a cursor via `tickAtSeconds` → `setPlaybackTick`.
- **Instrument:** one `synthInstrument`, with an `Instrument` seam (`noteOn`, `stopAll`) for samples and drones. Count-in and metronome are deferred in `audio.md`.
- **Demos (`apps/web/src/exercises`):** `NoteHeard` (click the note you heard, fixed 5-note score, optional hover-to-hear), `Dictation` (pitch-only, rhythm given as rests, first note given, accidental toggles, preview ghost), `ErrorDetection` (select the changed notes of a fixed 4-note score). All use fixed content and hard-coded answers; `sound.ts` gives each component its own player (`createSound`) and resolves note sound via `midiOfId`. No routing, settings, persistence, stats or generators.

### 2.2 Fits current primitives

Exercise logic plus generators only; no package changes.

| Exercise | How it maps |
|---|---|
| E3 Scale degree in context | `harmonic` cadence + `concat` + `melodic` note + resolution. Answer with app buttons (degree, solfège) or a staff click (`slot`/`point` → `pitch`). |
| E2, E5, E4, E11 Intervals, chord quality, scale/mode, inversions | Audio builders for the prompt. The answer is app buttons, or building the notes on the staff (`setPitches` with several pitches for a chord; the app passes `[given, ...clicked]` because `setPitches` replaces all pitches of an event). The staff reveals the answer via presets or `Marks`. |
| E1, E9, E10 Comparisons and interval in context | `melodic`/`harmonic` + `concat`/`shift`; buttons. |
| E6 Progression ID (whole) | `harmonic` + `concat`, or generated MNX → `eventsFromTimeMap` with `Playback` highlighting in the reveal. Numerals are app text. Bass on its own staff needs grand staff. |
| E7 Melodic dictation (pitch) | Already demoed; generalize with generated melodies (real rest events, not `fullMeasure` rests, which `setPitches` rejects with `intent-target-unsupported`) and a cadence or tonic before playback. |
| E8 Error detection (pitch) | Already demoed; generalize by generating variants from the note list. Builder events have no ids, so the app keeps the id ↔ pitch mapping. |
| E16 Error detection (rhythm) | Play a rhythm-altered event list against the unchanged score: either app-generated variant events, or a variant MNX laid out headlessly (`layoutScore`) → `eventsFromTimeMap` so ties and tuplets are timed by the engine. |
| E13 Bass-line dictation, E22 two-voice | Voice 0 and voice 1 slots and `setPitches`; bass clef already renders. Roman numerals stay app text outside MNX. |
| E12, E35 Listening to real passages, feature and cadence questions | Score playback with repeats and a cursor already exists. Questions are app data keyed by note id. |
| E15 Metre ID | Generated MNX → `eventsFromTimeMap`, then the app sets `velocity` on downbeats. Per the check recorded in ear-training.md, `synthInstrument` scales peak gain by velocity behind a default-settings compressor, so accents must be wide. |
| E37 Microtonal discrimination | Fractional `midi` in `NoteEvent` already allows cents offsets. |
| E28 Absolute pitch naming | Trivial: one note plus buttons. Low priority given the evidence. |
| E17 Notation reading | One-note MNX + buttons; `melodic` after the answer. |

Exercise generators (random melodies within a key, range and step constraints; progressions; variants) should produce plain MNX in app code or a new pure package. They must not add a builder API to the notation packages (`AGENTS.md`).

### 2.3 Per-exercise verdict

| Verdict | Exercises |
|---|---|
| Works today with app code + generators | E1, E2, E3, E4, E5, E6 (whole), E7, E8, E9, E10, E11, E12, E13, E15, E16, E17, E28, E37 |
| Needs an app-side answer surface (on-screen piano / pickers) | E6 chord-by-chord, E14, E18 |
| Needs content only (theory tables, voicings) | E19, E20 |
| Needs rhythm entry (palette + regenerated MNX) | E21, E23 |
| Needs metronome/count-in + tap capture | E24, E25, E26 |
| Needs MIDI input | E14 (MIDI variant), E27 (T2) |
| Needs an overlay layer (tap marks, pitch curve) | E24, E25 feedback; E31, E33, E34 |
| Needs mic pitch detection | E27 (T3), E31, E32, E33, E34 |
| Needs grand staff / multi-part / text layer | E29, E30 (reveal), E6 bass reveal, E34 solfège under notes |
| Needs expressive playback or samples | E35, E36 |
| Two voices addressable but needs a generator | E22 |

### 2.4 Needs new capabilities

| Capability | Unlocks | Notes |
|---|---|---|
| Rhythm answer entry | E21, E23 | `interaction.md` already covers this: the app keeps its own duration list and regenerates MNX, using `point.tick`. Needs an app-side duration palette. |
| Metronome and count-in, plus tap timing capture | E24, E25, E26 | Count-in and metronome are deferred in `audio.md`. Tap scoring needs latency calibration and tolerant alignment against the TimeMap; ABRSM-app reviews show strict marking frustrates users. |
| Drone and cadence instruments | Functional drills with a continuous reference | A new `Instrument` behind the existing seam. A drone is a long note event, so no timers are needed. |
| Sample-based instruments | Realism, a common request; E36 | A new `Instrument` entry, pinned dependency, ask before installing. CET and Chet ship multiple sound banks. |
| MIDI input | Play-back answers (E14, E27), the most requested missing FET feature | Web MIDI in the app or a renderer-side package, mapped to MNX `Pitch`. |
| Mic pitch detection | E27, E31–E34 | A new package (pinned pitch-detection dependency, wrapped). Needs onset segmentation, latency handling and tolerant grading. |
| Scheduling engine: item stats, interleaving, spaced review, adaptive levels | "Practice smart" features | A pure, DOM-free new package (a new concern, per `AGENTS.md`). Data is keyed by exercise item in the app, never in MNX. |
| Accounts, sync, teacher assignments | Classroom use | Backend. Out of the current scope. |
| Real-recording harmony (Chord Crush style) | Progressions in songs | Licensing blocker. Out of scope. |
| Technical-ear and timbre ID | EQ and instrument drills | A different product. Out of scope (timbre ID only once samples exist). |

### 2.5 Gaps and build order

Placement follows `AGENTS.md`: dependency direction `model ← engine ← {react, audio}`; a new concern becomes a new package; `mnx`/`notation-engine` and audio's `.` entry stay DOM-free; apps consume packages only through `exports`; quiz data never in MNX; no clocks in `notation-*` or audio. Size: S ≤ 3 days, M ≤ 2 weeks, L > 2 weeks *(proposal)*. Order = suggested sequence.

| Capability | Needed by | Size | Where it lives | Order |
|---|---|---|---|---|
| Pitch/interval math in the model (pitch → midi, interval with correct spelling, midi → spelled `Pitch`) | E1–E6, E10, E11, MIDI spelling | S | `mnx` (fits "pitch math"; add only when a consumer exists) | 1 |
| Exercise engine: types, seeded PRNG, item keys, theory tables, generators for button exercises, pure evaluation | Every exercise | L | New DOM-free package (e.g. `packages/exercise`); needs an `AGENTS.md` direction entry | 1 |
| App shell: routing, exercise runner, settings, answer grid, stats view | Everything user-facing | L | `apps/web` (hand-rolled routing: simple work, write it ourselves) | 1 |
| Local persistence (versioned, export/import) | Stats, levels, SRS | S–M | `apps/web`, behind a small interface | 2 |
| Reference/cadence builder (`NoteEvent[]`) | E3, E10, E7, E12, E13 | S | `audio` `.` entry (pure) or exercise package | 2 |
| MNX generators: melodies with rest events, progressions + bass, rhythm patterns, pitch/rhythm variants, deterministic ids | All staff exercises | M–L | Exercise package, plain MNX object literals, validated by Ajv (dev) and `layoutScore` with no errors | 2 |
| Scheduler: per-item stats, weighting, interleaving, spaced review, level advancement | Adaptive, SRS, levels, daily workout | M | New pure package (no music knowledge; item keys are strings) | 3 |
| On-screen piano and degree keyboard | E6 chord-by-chord, E14, E17, E18, E28 | M | App components | 4 |
| Drone and sampled-piano `Instrument`s | E3 drone variant, realism, E36 | S–M each | `audio`, own entries (e.g. `./samples`), pinned, ask first | 4 |
| Score library content | E7, E8, E12, E25, E35, E38 | S–M, ongoing | App data: committed `.mnx.json` via `tools/musicxml-to-mnx` + metadata JSON | 4 |
| Metronome/count-in events | E21, E23–E26 | S | `audio` `.` entry, scheduled up front | 5 |
| Tap capture + latency calibration + alignment | E24, E25, E26 | M | Capture in app or a new DOM input package; scoring in the exercise package | 5 |
| Rhythm entry (duration palette → regenerated MNX with stable ids) + undo | E21, E23 | M | App UI + pure generator; undo as a generic history of doc states (`interaction.md`) | 5 |
| Overlay layer (tap marks under notes, live pitch curve) | E24, E25, E31–E34 | M | New `notation-react` compound child fed app data per frame (like `setPlaybackTick`), or exported staff geometry from the engine | 5 |
| MIDI input with key-aware spelling | E14, E27, E6 chord-by-chord | S–M | Small DOM input package or app code; spelling in the model | 6 |
| Volta/ending and fermata drawing | Library excerpts | S–M | `notation-engine` | 6 |
| Offline (PWA), i18n | Offline, localization | S–M each | App; engine `ElementBox.label` is English text | 6 |
| Mic pitch detection | E27, E31–E34 | L | New DOM package, pinned wrapped dependency, separate from `audio` (input, not sound) | 7 |
| Grand staff, text layer (numerals, solfège) | E29, E30, E6 bass reveal, E34 | L / M | `notation-engine` + `notation-react` (both deferred in `roadmap.md`) | 8 |
| Multi-part layout, dynamics/articulations, dynamics-driven velocity | E29, E35, accompanied dictation | L | Engine, model, audio | 9 |
| Backend, accounts, teacher tools | Accounts, teacher | L | New service | deferred |

### 2.6 Known notation-API gaps

| Gap | Effect | Fix location |
|---|---|---|
| Tie-tail ids missing from `timemap.byId`: a tie-merged `TimeMapEntry` is built from the tie head, so `ids` hold only the head's ids and `byId(tailId)` is `undefined`; `midiOfId` then falls back to the hit's pitch | Clicking tied notes in note-heard, error detection, hover-to-hear | `notation-engine` `query/timemap.ts`; one regression test |
| `HitResult` element `pitch` ignores the written accidental: derived from staff position + key, because `ElementBox` carries no written `Pitch` | Any exercise reading the clicked note's pitch (labels, sound fallback, answer checks on existing notes) | `notation-engine`: carry written pitch on `ElementBox` |
| Parallel `ids` / `midiNotes` arrays (plus separate `midi`) in `TimeMapEntry`; lookups use `indexOf` in `midiOfId` and `eventsFromTimeMap` | Fragile id → sound lookups | `notation-engine` + `audio` (breaking: per-member `{ id, midi }`) |
| ~~No pitch → midi in `mnx`~~ resolved: `pitchToMidi` in `mnx` is used by engine, audio, react presets and the app | — | `mnx` |
| Only `parts[0]` is laid out (`normalize.ts`); `applyIntent` addresses part 0, staff 1, first two sequences | Accompanied dictation, harmonic dictation | Engine, model |
| Volta (`ending`), `jump` and fermata emit `mnx-unsupported` "not drawn"; repeats still play via `playOrder` | Library excerpts show no endings or fermatas | `notation-engine` |

### 2.7 Proposed MVP tiers (proposal)

The earlier list from this file, relabelled to Part 1's tiers:
- **Old Tier 0 (exists) → T0:** note-heard, pitch dictation (E7), error detection pitch (E8).
- **Old Tier 1 (current primitives) → T0, except rhythm-variant error detection (T1):**
  - Scale degree in context (E3): cadence, then a note, then resolution, with switchable degree, moveable-do or letter labels and staff-click or button answers.
  - Melodic and harmonic intervals (E2) and chord quality (E5), answerable by building on the staff.
  - Generated melodic dictation (E7) with a tonic or cadence and limited replays.
  - Rhythm-variant error detection (E16, T1).
  - Mixed (interleaved) item order within a session by default.
  - Per-item accuracy table, local only (ToneDear-style).
- **Old Tier 2 (small additions) → T1, except rhythm and two-voice dictation (T2):**
  - Drone and cadence `Instrument`, and a sampled piano `Instrument`.
  - Rhythm dictation (E23, T2) with a duration palette and regenerated MNX.
  - Bass-line (E13, T1) and two-voice dictation (E22, T2).
  - Progression (E6, whole form moved to T0) and cadence ID (E12).
  - A pure scheduling package: weakness-weighted interleaving and spaced review of missed items.
  - Listen-only interludes between blocks.
- **Old Tier 3 (major capabilities) → T2/T3:**
  - Metronome and count-in plus tap-back and rhythm reading with calibrated tolerance (T2).
  - MIDI input for play-back answers (T2).
  - Mic pitch detection for pitch matching and sing-back, then sight-singing (T3).
  - Adaptive levels (T1: pure logic).
- **Not planned:** AP-style full harmonic dictation with Roman-numeral grading, until two-voice entry is solid. Real-recording chord drills, technical-ear training, and teacher and classroom features stay out of scope.

### 2.8 Open questions for the owner

1. **Audience and exams:** self-learners, conservatory students or exam candidates? Which board first? ABRSM (echo-singing from Grade 1) and AP (sight-singing) need singing, which would pull mic work earlier; RCM ear tests play back on the instrument; Trinity requires no singing.
2. **Package boundaries:** may a new exercise package depend on `audio` (`.`) and `notation-engine` (headless `layoutScore` for variants), or should it emit only MNX and pitch data? Either way `AGENTS.md` needs a direction entry.
3. **One package or two** for exercise logic and the scheduler? Two keeps the scheduler free of music knowledge.
4. **Generators vs "no builder API":** is a package exporting functions that return whole MNX documents acceptable, as long as it exports no `score()/measure()/note()` helpers? Should presets expose their MNX so staff-entry variants can reuse it?
5. **Default labels:** degrees, moveable-do or letters? Evidence conflicts; moveable-do dominates in practice.
6. **Platform:** web only, PWA, or native wrappers? Affects Web MIDI availability, mic latency and offline.
7. **Sounds:** which sample set, licence and size budget (ask-before-install rule)?
8. **Persistence:** local only with export for now? When, if ever, accounts?
9. **Content:** hand-authored courses vs generated levels; who writes lesson intros?
10. **Licence:** OpenEar (MIT) code is reusable with attribution; GNU Solfege, Nootka, birdears and Rhythm Randomizer (GPL/AGPL) are study-only unless we go GPL.
11. **Rhythm staff:** normal staff at one pitch, or build the one-line percussion staff first?
12. **Grand staff:** accept a treble-only reveal for E6 in T0, bass as text until grand staff lands?
13. **Leniency:** lenient tap/mic tolerances by default with a strict exam mode?

## Part 3 — Research record

### 3.1 Method and scope

- Accessed 2026-09-27 (first pass and a second verification pass the same day). Sources: vendor sites, App Store listings (version dates, prices, reviews), GitHub repositories (via the GitHub API), exam-board syllabi, and research papers or their abstracts (abstracts checked through Europe PMC where the publisher blocked access). Every URL is listed in [3.9](#39-sources-all-accessed-2026-09-27).
- Selection: the widely recommended general ear trainers (web and mobile), a few specialists (functional/scale-degree, progressions in real songs, sight-reading and sight-singing, pitch matching, absolute pitch, audio engineering), open-source projects we could learn from, formal courses, and the exam syllabi that define what schools expect (AP, ABRSM, RCM, Trinity).
- Verification: each resource's current existence was checked on its own site or store listing. App Store version, date, price and rating come from Apple's public lookup API for the US store (UK where stated) on the access date. Items marked *(single source)* or *(unverified)* could not be cross-checked.
- Prices change often. Treat them as a snapshot.

### 3.2 Resource codes

FET Functional Ear Trainer · TD ToneDear/ToneSavvy · TEO teoria · MTN musictheory.net/Tenuto · AUR Auralia · PE Perfect Ear · CET Complete Ear Trainer · TH Theta · TG ToneGym · SG SoundGym · CH Chet · EL Ella · MET MyEarTraining · EP Earpeggio · EB EarBeater · CC Chord Crush · SRF Sight Reading Factory · RR Rhythm Randomizer · ABR ABRSM Aural Trainer / AURALBOOK · SC Singing Carrots · TN Tone (perfect pitch) · SET Sonofield Ear Trainer · MU Musical U · BK Berklee · OE OpenEar · GS GNU Solfege · NK Nootka · BE birdears · Exams: AP, ABRSM, RCM, Trinity.

### 3.3 Resources

#### Commercial and freemium apps and sites

**Functional Ear Trainer (Alain Benbassat method).** Scale-degree identification in a key. A cadence sets the key, a note is played, and you name its degree, after which the app plays the resolution to the tonic. The original desktop program (FET v2, released 2019-08-11) is free, runs on Adobe AIR on Windows, Mac and Linux, and ships a learning course plus a customizable practice lab. The current iOS, Android and Mac app is by Serhii Korchan (Android package `com.kaizen9…`); it is free with a $19.99 "Plus" in-app unlock. It is rated 4.9 from 3.8K ratings, and its latest iOS version is 3.32.15 (2026-09-02). Progression runs from half a scale to a full octave, to multiple octaves, to other scales, with about 10 minutes of practice a day recommended. Answers are on-screen taps, labelled as letters, numbers or do-re-mi. The main complaint is that you can't answer by playing a real instrument, because there is no mic or MIDI input. The method is widely cited as the reference for scale-degree training, and several clones, including open-source ones, copy it.

**ToneDear / ToneSavvy.** Free web drills in eight categories: intervals, chords, scales, chord progressions, perfect pitch (note naming), scale degrees in context, intervals in context, and melodic dictation answered as scale degrees. Scale-degree drills let you choose Simple (1-3-5), Diatonic or Chromatic sets, fix the key, answer with keyboard shortcuts, auto-advance, show solfège or numbers, and replay the progression down or up to the root. A results table shows per-degree accuracy (times heard, times wrong, %). There are no accounts on the free site. ToneSavvy is the paid teacher layer: assignments with specific exercise settings, student score tracking, plus theory drills. The sound is synthesized. Strength: a fast, keyboard-driven UX and per-item accuracy.

**teoria.com.** Free, donation-supported web site (ads removed), created in 1997 by José Rodríguez Alvira (Conservatory of Music of Puerto Rico). Ear training covers intervals, chords, scales, progressions (including pattern-based harmonic progressions), melodic dictation (one and two voices), rhythmic dictation (including pattern-based), four-voice dictation, and harmonic analysis of excerpts. It also has reading drills (grand-staff reading with MIDI keyboard input in Chrome, Firefox, Edge and Opera) and writing drills (transformations, twelve-tone matrix, soprano/bass progressions), plus a 30-day score history. Parameters are highly configurable. It is one of the few free sites with multi-voice and four-voice dictation. The UI is dated. No teacher features were found.

**musictheory.net / Tenuto.** Free web exercises. The ear-training ones are keyboard ear training (hear a note, press the piano key), note, interval, scale and chord. The site also has staff, keyboard and fretboard identification and construction drills. The Exercise Customizer makes permanent links to configured drills, and a Code Checker lets teachers verify completion. Tenuto is the iOS version: $4.99, 24 exercises plus 6 calculators, offline, challenge mode, progress reports for teachers, latest version 5.1 (2026-04-28), rated 4.7 (661). Reviews say it drills existing knowledge rather than teaching it.

**Auralia (Rising Software).** Commercial desktop and cloud software (the cloud edition runs on phones, tablets and computers), heavily used in schools. The current site lists 59 topics across fundamentals (pitch, rhythm, intervals, chords, scales, tuning), cadences and progressions, melodic, rhythmic and harmonic dictation, jazz progressions and sight singing; the list also includes error detection and part dictation *(first pass; not re-seen on the summary page)*. The older Auralia 5 retail edition lists 43 topics in 5 groups ($149 standard, $50 student at one reseller), so the topic count depends on version. You can answer on an on-screen keyboard, a MIDI keyboard or by singing into a microphone, and tap rhythms. Teacher features: tasks, assignments and exams, record keeping, worksheets, curriculum mapping, and integration with Canvas, Moodle and Blackboard. The vendor's closest EarMaster-class competitor. The vendor page publishes no cloud pricing; it offers free trials to schools.

**Perfect Ear (Crazy Ootka Software).** Freemium iOS and Android app. It covers interval comparison and identification, scales, chords, inversions, progressions, melodic dictation, rhythm reading, tapping and imitation, sight reading, singing drills with the mic, and theory articles. A custom drill editor sets intervals, chords, scales, keys, ranges, directions and rhythm patterns. There is a daily practice dashboard with points and minutes. US App Store in-app purchases include Premium $14.99, Full Exercise Pack $4.99, custom editor $1.99 and several $0.99 packs; latest iOS version 3.0.7 (2026-09-08), rated 4.7 (1.9K). Complaints (store reviews and one review site): glitches when repeating exercises, sight-reading timing errors, singing drills that skip ahead or leave too little time, and a custom editor that can't set some note ranges.

**Complete Ear Trainer (Binary Guilt).** iOS and Android, plus desktop and web through the sibling "Complete Music Trainer". 150+ drills across 4 levels and 28 chapters, plus an Easy mode (50+ drills over 12 chapters). It has 11 drill types, 24 intervals, 36 chord types with inversions, 28 scales, melodic dictation and progressions. Other features: a theory card per chapter, custom drills and custom training programs, an arcade mode (21 drills), a grand piano plus 7 more recorded sound banks, leaderboards, 25 achievements, and a teacher portal. Pricing is the first chapter free, then a $6.99 (€5.99) one-time unlock. The latest iOS version is 2.9.4 (2026-09-09), recently rewritten in SwiftUI. No singing or MIDI input is advertised. Complaints: a steep difficulty curve, and no scale-degree-in-context drills.

**Theta Music Trainer.** Web plus iOS and Android, about 50 games plus structured courses. Categories:
- Sound: channel/mix balance, band instrument ID, EQ matching, effects
- Pitch: pitch compare, speed pitch, a tuning game, vocal match via mic
- Rhythm: rhythm puzzles, flash rhythms, rhythm repeat (clap-back), rhythm reader, drum styles
- Tonality: tonic finder, key puzzles, scale-degree games, tonal recall, vocal degrees via mic
- Intervals: melodic and harmonic
- Melody: parrot phrases on a virtual instrument, 3-tone and n-tone patterns, sing-back via mic
- Harmony: chord quality, inversions, chord tones, arpeggio-to-chord, progressions, cadences, spelling

The first 3 levels of every game are free, plus 3 weekly credits for higher levels. Individual plans are $7.95/month or $49/year. The teacher plan lists 30 student accounts with assignments, class progress and a class leaderboard; studio and school plans are on request. The iOS app (3.0.11, 2025-03-23) is rated only 3.5 from 16 ratings. It has the broadest mix of game-style drills we found.

**ToneGym.** A web platform by SoundGym Ltd (the company behind SoundGym), with Android and a new iOS "Ear Training Studio" app (first released 2026-08-05, v1.1). Workouts are five short daily games. Its 17 games include chord ID, chord inversions, melody memory (repeat or pick the notes), harmonic interval ID, ascending and descending interval ID, scale ID, rhythm tap-back (Rhythmic Parrot) and tapping a notated rhythm (Rhythmania), singing back a heard melody, singing notation back (solfège), singing a displayed interval, progressions, speed note reading in treble and bass, and an interval comparison game (Calibrator). Other features: a "Performance Index", weekly contests, a community forum, a schools offering, and games that the vendor says adapt to your level (how is not documented). Pro costs $13.95/month, $74.95/year or $255 lifetime. The main complaint in reviews is price.

**SoundGym.** A web platform for audio producers, not pitch or harmony. It has 18 games across EQ/frequency, dynamics/compression, space and time (stereo width, panning, delay, reverb) and distortion, plus a parametric-EQ matching trainer ("EQ Mirror") and weekly competitions. Freemium. It's included for the "timbre and technical ear" axis. That axis is out of scope for us.

**Chet (Ensemble Education).** A free iOS, iPadOS and Mac app, latest version 2026.3 (2026-08-19), rated 4.8 (2.4K). It combines multiple choice with call-and-response on a virtual piano, guitar or bass, or a MIDI keyboard. Content: intervals, scales, arpeggios, chords, progressions, "tonal sequences", famous tunes and atonal sequences, with professionally recorded music across jazz, classical and pop. It has guided learning paths, a spaced-repetition practice mode, and challenge games with global leaderboards. Sight singing lives in the sibling app Ella (below). It's the clearest example of play-it-back answer entry plus spaced repetition in a free app.

**Ella (Ensemble Education).** Free iOS sight-singing app, latest version 2026.3 (2026-08-10), rated 4.75 (1.2K). The mic detects your pitch; each exercise shows an on-screen tuner and a graph of your sung pitch, and scores intonation (each note) and intervals separately. It has a learning path, a practice mode that lets you listen first, a play mode, and leaderboards. The clearest current example of graded sight-singing with continuous pitch feedback.

**MyEarTraining (myrApps).** iOS and Android apps plus web exercises, freemium; the US App Store lists a $12.99 Premium Upgrade in-app purchase. It has 100+ exercises: intervals, chords (up to seventh-chord inversions), scales and modes, progressions, rhythm, melodic dictation, solfège and singing exercises with the mic, and "functional" tonal-context drills; answers by buttons or a virtual keyboard. It also offers lessons, custom exercises, progress statistics, sync across devices, and a school interface for assignments and progress tracking. Latest iOS version 3.0.2 (2025-05-16).

**Earpeggio (Balázs Kiss).** iOS app, free to download, rated 4.9 from 9.7K ratings (the largest rating count of any general ear trainer we checked), latest version 2.25 (2026-09-16). Ten exercise types including interval, chord and progression identification, melodic dictation and rhythm dictation, plus tests and detailed progress statistics. Pricing of any unlocks not checked.

**EarBeater.** Web and iOS. 200 to 400+ exercises on intervals (including interval size comparison), chords, inversions and scales, with custom shareable exercises and per-category progress tracking. Probably discontinued: the website serves a mismatched TLS certificate and an HTTP 406 error, and the iOS app is no longer found in the US, UK, Canadian, Australian, German or New Zealand App Stores. Last known iOS version 1.2.0 (2024) *(third-party download site)*.

**Chord Crush (Hooktheory).** A browser app (desktop and mobile) for chord-progression recognition in real songs from Hooktheory's TheoryTab database. Modes include Level Up, a Daily Challenge, a timed Rush mode, and an adaptive "Train" mode that picks puzzles by a rating system. Custom training sets focus on chosen chords. A YouTube audio mode plays the real recording, and there are several synth patches by genre. Free for 5 puzzles and 1 Rush game a day; Standard is $49/year and Premium $79/year. It's the strongest "real music" progression trainer we found. Its song data is Hooktheory's own corpus, which we can't replicate.

**Sight Reading Factory.** A generator of unlimited sight-reading and sight-singing exercises for 60+ instruments and voices. You set rhythms, range, leaps, accidentals, dynamics, articulations, and time and key signatures. It has playback with tempo control, solfège display, a practice log, printing, and auto assessment of recorded performances. Educator plans add classes, assignments, recording submissions, grading and a group "Live Practice" mode. Individual plans are $45/year, and school student access costs as little as $3 per student per year. Its iOS app is rated only 2.7 (389).

**Rhythm Randomizer.** A free web generator of random notated rhythms (1 to 8 bars) with selectable time signatures and note values, used for clap and tap practice in classrooms. It doesn't grade input. Open source under GPL-3.0 ([GitHub](https://github.com/bobderrico80/rhythm-randomizer-v2), last commit 2023-01).

**ABRSM Aural Trainer / AURALBOOK.** Exam-prep apps:
- *ABRSM Aural Trainer:* two official iOS apps, Grades 1–5 (£7.99, v3.4, 2024-05-30, rated 3.1 from 146 UK ratings) and Grades 6–8 (£7.99/$7.99, v2.3, 2024-01-10). Features include pulse and metre tapping, recording for echo and sight-singing tests, an interval trainer, progress tracking, and comparison with sample answers. Reviews complain about taps not registering, crashes, harsh sight-singing and rhythm marking, and progress that doesn't save.
- *AURALBOOK (Playnote):* third-party apps, one per board (ABRSM, AMEB, Trinity, RCM). They record your singing and clapping, show it as notation against the correct answer, and grade it with AI; the ABRSM version advertises up to 1,440 mock questions and a mock-exam mode. Some questions are free, more are bought per grade pack. The apps look stale: latest iOS updates are 2019–2022.
- These are the main examples of automated grading for sing-back and clap-back, and of how fragile that grading is.

**Singing Carrots.** A web vocal trainer built on a free real-time pitch monitor, a vocal-range test and a pitch-accuracy test. Pitch-training exercises have Practice, Basic, Challenging and Hard modes (Challenging drops the melody playback, Hard drops all audio). It has adjustable BPM, looping, range limits and a daily note goal, weekly leaderboards, custom MIDI melodies, plus an AI vocal coach (also sold as an iOS app, updated 2026-07). It's the reference for pitch matching with continuous visual feedback.

**Solfeg.io.** A school and self-learning platform built on pop songs for guitar, piano and ukulele, with a tuner, assignments, theory quizzes and progress tracking. Self-learning costs $9.99/month or $79.99/year; school plans are published ($0, $249, $799 and $1,349/year tiers). It's more an instrument and song-learning tool than a drill-based ear trainer. Listed because it was in the brief, but it's peripheral.

**Tone – Learn Perfect Pitch (Coda Labs).** iOS absolute-pitch game: name played notes with chosen pitch sets and octaves, from easy to expert, with a practice mode that gives a reference pitch; labels as note names, piano keys or solfège; also interval and major/minor chord drills and progress graphs. Rated 4.5 from 10.3K ratings, last updated 2025-01-28. The most popular dedicated AP trainer we found.

**Sonofield Ear Trainer.** iOS app (since 2025), rated 4.9 (378). Drone-based functional training: a sustained drone sets the key, and you identify degrees "by feel" (Degrees mode), short phrases (Melody mode), sing a requested degree into the mic (Voice mode), or train hands-free (Pocket mode). The free version covers the foundations. The clearest current example of the drone-reference alternative to FET-style cadences.

#### Courses and methods

**Musical U.** A membership site running since 2010 with training modules (pitch, intervals, melodies, chords, chord progressions, rhythm, playing by ear, singing, improvising, planning) and roadmaps. Optional instrument packs cover guitar, piano, bass and singing. For melodies it offers parallel interval and solfa (scale-degree) roadmaps, including "score to sound with solfa". It's a course platform, not a drill engine.

**Berklee Online and Coursera.** *Ear Training 1* (Berklee Online, authors Allan Chase and Roberta Radley) is a 12-week, 3-credit course costing $1,575. It uses moveable-do solfège, conducting, dictation and sight-singing in treble and bass clefs, and covers intervals, triads, V7 and tendency tones. Students submit video recordings and MuseScore/Finale files, so there's no bespoke drill software. *Developing Your Musicianship* (Coursera, George W. Russell Jr.) is free to enrol (certificate paid): major scale and tonal centre, triads and I–IV–V, minor pentatonic, seventh chords and the blues, singing intervals, and common meters.

**Karpinski, *Manual for Ear Training and Sight Singing* (Norton).** The standard US university aural-skills textbook, paired with a sight-singing anthology and Norton's online "InQuizitive" drills. It covers every activity type of a college aural-skills sequence (dictation, sight singing, rhythm, harmony) and follows the same author's *Aural Skills Acquisition* model ([3.5](#35-pedagogy-and-research-notes)). A reference for what a full curriculum sequence looks like, not software.

#### Open source

**OpenEar.** MIT licence (in the README; GitHub doesn't detect it), Angular + Ionic + Tone.js, 180 stars, actively developed (last push 2026-09, last tagged release v1.9.0 in 2025-02). On Android (Play and F-Droid) and iOS, ad-free. Exercises: scale degrees for any mode including chromatic notes, Roman-numeral chord function, common progressions, progressions from real songs via YouTube (Android only), "notes with chords" (name both the scale degree and the chord degree), chord type in a diatonic context, and intervals. The author says new exercises can be added on the existing exercise infrastructure. It's the closest open-source analogue to our scope and the best code to study, being TypeScript with Tone.js.

**GNU Solfege.** GPL, Python and GTK. Intervals, chords, scales, rhythm dictation, singing intervals and chords, cadences, harmonic progressions, intonation, and theory drills. Exercises are defined in user-editable lesson files. The last preview release is 3.23.4 (2016-06-24) and the last stable is 3.22.2 (2013-10), so it's effectively dormant. Its lesson-file design is a useful precedent for declarative exercise definitions.

**Nootka.** GPL-3, C++/Qt, on Windows, Linux, macOS and Android, 44 stars. You play or sing a notated score on a real instrument and mic pitch detection checks it. It also has ear training, note naming, MusicXML import, custom exercises, many clefs and instrument tunings, and a metronome. Last release v2.0.2 (2021-08), last commit 2025-08. It's the reference for "notation + mic pitch detection" in open source.

**birdears.** AGPL-3, Python CLI and GUI, 78 stars. A functional (FET-style) trainer with resolution to the tonic, modes from Ionian to Locrian, and melodic, harmonic, dictation and "instrumental" modes. Keys on the computer keyboard are the answers. Last release 0.3.16 (2026-02).

**Other GitHub projects** under the `ear-training` topic:
- Bemol: Swift, relative pitch, updated 2026-07
- earbetter: Svelte, Unlicense, updated 2026-09
- MyPitch: C#, functional ear trainer, updated 2026-08
- muse-training: TypeScript, MIT, sight-reading with Web MIDI, last updated 2021
- Prelude: TypeScript, sight reading, last updated 2024
- EarQuiz_Frequencies: Python, GPL-3, EQ training
- singing-experience: TypeScript, real-time pitch detection with a do-re-mi game
- Xenharmonium: Pure Data, alternate tunings

Most are small single-author projects. None pairs engraved notation with answer entry the way we plan to.

### 3.4 Exam curricula (what institutions test)

**AP Music Theory (College Board).** Per the course and exam description effective fall 2026: 41–43 aural multiple-choice questions (about 45 minutes) alongside 32–34 non-aural ones, together 45% of the score. Free response (45%) includes two melodic dictations (4 bars, played 4 times with 50-second pauses, first pitch given, pulse established before each playing) and two harmonic dictations (notate soprano and bass and give Roman numerals). Two sight-singing tasks of about 4–8 bars, with 75 s of practice and 30 s to perform each, are 10% of the score.

**ABRSM (UK).** Aural tests are the same for all instruments and unchanged for the 2026 syllabuses. Grades 1–3: clap the pulse and say whether it's in 2, 3 or 4 time, echo-sing short phrases, spot a change in pitch or rhythm, and answer questions on features of a piece. Grades 4–5: sing back a melody from memory, sing a few notes from score (five at Grade 4), answer questions on features, and clap a rhythm and name the time signature. Grades 6–8: sing or play back one part of a two- or three-part phrase, sing a melody from score (at Grade 8 the lower part of a two-part phrase), identify cadences (perfect and imperfect at Grade 6, adding interrupted by Grade 7 and plagal by Grade 8 per a secondary summary), name chords (Grade 8), describe modulations (Grade 8), and answer questions on features. Sung answers are marked on pitch, not vocal quality. The separate Singing for Musical Theatre syllabus has its own aural tests, including singing named intervals.

**RCM (Canada).** Per the 2022 piano syllabus, ear tests at every level from Preparatory A to Level 10 comprise clapback (rhythm from memory), interval ID (growing to all intervals within the octave, then 9ths at the top levels), chord ID (triads, then dominant and diminished sevenths, later augmented triads and other seventh qualities), chord progressions (from I–IV–I or I–V–I, up to naming each chord of a four-chord progression built from I, IV, V and vi), and playback (melody from memory on the instrument). RCM names progressions rather than cadence types.

**Trinity College London.** Aural is optional. Up to Grade 5 candidates choose supporting tests among aural, sight reading, improvisation and musical knowledge; from Grade 6 sight reading is compulsory and aural remains one of the options. The test uses a single extract played by the examiner, repeated during the test, and asks you to describe features such as dynamics, articulation, texture and style; you may be asked to clap the pulse. No singing is required.

### 3.5 Pedagogy and research notes

Evidence labels:
- **Strong:** replicated, larger samples or meta-analytic.
- **Moderate:** a few controlled studies.
- **Weak:** single small study, practitioner consensus or tradition.

- **Relative vs absolute pitch.** Relative, functional pitch is what every curriculum above tests. Absolute pitch is partly learnable by some adults. In Van Hedger, Heald & Nusbaum 2019, 6 musically trained adults with verified superior auditory working memory trained for 8 weeks (about 32 h). Two (S2, S5) were classified with "genuine" AP possessors on a speed-and-accuracy analysis after training and kept that about 4 months later, but only one (S2) passed every AP test; most of the others improved only modestly, and both successful learners were already ahead of the group before training. Wong et al. 2025 trained 12 musicians online for 8 weeks (about 21 h on average); they learned to name on average 7 of 12 pitch classes (range 3–12) at ≥90% accuracy within about 1.3–2 s, with partial transfer to an untrained timbre. Wong et al. 2020 (20 h of training, non-tonal-language speakers) found 2 of 13 learned all 12 pitches. Auditory working memory predicts AP learning (Van Hedger et al. 2015). Evidence: moderate for partial learnability; samples are small and success is uneven. Treat AP as optional, not a core path.
- **Tonal context.** Graves & Oxenham 2017 (Frontiers in Psychology) found interval discrimination is more accurate after a major-scale context than after whole-tone, mistuned, single-pitch or no context. The gain was modest, and the authors think it comes mainly from priming the expected notes rather than sharper interval perception. That still supports cadence- or drone-first designs, the FET idea. Evidence: moderate for lab perception. We found no controlled trial of the Functional Ear Trainer method itself, so its effectiveness claims are weak (testimonial).
- **Interleaving.** Wong, Chen & Lim 2021 (Psychology of Music): novices learned six ascending melodic intervals interleaved and six blocked. Without reference songs or singing, interleaving gave clearly better identification of new instances; with those aids the two schedules were comparable. Most learners didn't notice the benefit and judged blocking more effective. Pavlik, Hua, Williams & Bidelman 2013 (Educational Data Mining conference) report that training improved tritone-vs-octave discrimination, more so with an interleaved trial order. Evidence: moderate for simple interval categories. Design implication: mix item types within a session by default, and don't rely on learners choosing it.
- **Practice plus passive exposure.** Little, Cheng & Wright 2019: four days of continuous interval-comparison practice produced no learning, while the same number of stimuli split between practice and exposure-only periods did, and the gain transferred to an interval-identification task; practice-only and exposure-only controls didn't learn. Amitay et al. 2006 got frequency-discrimination learning even with physically identical tones, which implicates exposure, attention and arousal, not only feedback. Evidence: weak to moderate (single labs, lab tasks). Implication: listening-only interludes, such as replaying the passage without asking a question, may help cheaply.
- **Spacing.** The spacing effect is strong for declarative memory and has been shown for song retention (Katz, Ando & Wiseheart 2021). Direct evidence for auditory category learning in ear training is thin, and Wiseheart et al. 2017 found no spacing benefit for learning a short piano sequence or song phrases, though with gaps of only 0–15 minutes. Evidence: indirect for our use. Spaced review of weak items is a reasonable default, but not proven for ear training specifically.
- **Melodic dictation.** Karpinski's model breaks dictation into hearing, short-term melodic memory, understanding (labelling with degrees or solfège) and notation. It recommends extractive listening (memorize a fragment) and chunking. Evidence: expert pedagogy informed by cognition research, weak as intervention evidence. Implications: give the tonic or cadence and the first note, allow a limited number of hearings (AP uses 4), and train short-term memory separately (echo or play-back).
- **Solfège system.** Moveable-do vs fixed-do results are mixed. Demorest & May 1995 (414 high-school choir singers in four Texas schools) found moveable-do schools scored higher, though system and school are confounded. Hung 2012 (dissertation, 85 music majors) found fixed-do-trained students sang more accurately. Cassidy 1993 (91 elementary-education majors) found solfège, with or without Curwen hand signs, beat letter names and a neutral "la". Moveable-do dominates in practice: 89% of surveyed teachers of high-achieving US middle and high school choirs use it (Research Perspectives in Music Education, 2020), and it is standard in Kodály and Berklee teaching. Evidence: weak and conflicting. Offer switchable labels (degrees, moveable-do, letters) rather than picking one.
- **Kodály "sound before symbol".** Singing and aural experience come before notation, with hand signs and rhythm syllables. It's a long pedagogical tradition with little controlled evidence (weak), but it suggests pairing hearing with singing, not only clicking.
- **Feedback design.** We found little music-specific evidence on feedback timing or form. Common practice across apps is immediate correct/incorrect, replay of the prompt, and letting the learner hear their own wrong answer next to the right one; the last is rarer. This is untested as a claim, so treat it as UX convention, not evidence.

### 3.6 Recurring user complaints

- **Answer input:** the answer is multiple choice only, and users want to answer by playing (FET, most apps).
- **Mic and tap reliability:** mic and tap input is unreliable, singing drills move on too fast, and rhythm marking is too strict (ABRSM app, Perfect Ear).
- **Pacing:** steep difficulty jumps (CET).
- **Price and stability:** subscription price (TG) and crashes (ABRSM app); Theta's iOS app has a low rating from few reviews.

### 3.7 Dropped resources

- Musicopoulos Ear Training Course. Its App Store ID no longer resolves; the removal date (2026-04-04) comes from one aggregator *(single source: appshunter)*.
- "EarPeg" and "TrainMyEar" had no verifiable ear-training product; the latter name matches only a social-media channel.
- Reddit could not be fetched by our tools, so community sentiment comes from review sites and store reviews, not from r/musictheory or r/eartraining directly.

### 3.8 Confidence gaps

- Auralia's error detection and part dictation topics come from the first pass and were not re-seen on the summary page; its topic count is 59 (current site) vs 43 (Auralia 5), depending on version.
- EarBeater is probably discontinued; its last iOS version comes from a third-party download site.
- Earpeggio's unlock pricing was not checked.
- Adaptivity in ToneGym and Sonofield is a vendor claim with undocumented mechanism; only Chord Crush documents a rating system.
- Musicopoulos' removal date is single source.
- ABRSM cadence order by grade is from a secondary summary; abrsm.org's own aural-tests pages block automated fetches, so "unchanged for 2026" and "marked on pitch, not quality" for instrumental exams come from its search-result text.
- Cassidy 1993 was seen only as an abstract via search results.
- Kendüzler 2026 is used only as a pointer to primary studies; its one-line summary of Wong et al. 2021 does not match that paper's abstract.
- Community sentiment excludes Reddit, so the complaints list may be skewed toward app-store reviewers.
- Sonofield's Pocket-mode mechanic is not documented; the hands-free spec in 1.9 is ours.
- App Store figures are a US-store snapshot (UK where stated) on 2026-09-27; prices change often.

### 3.9 Sources (all accessed 2026-09-27)

App Store figures (version, date, price, rating) were read from `https://itunes.apple.com/lookup?id=<id>&country=us` (or `gb`) for the IDs in the store links below.

Apps and sites
- Functional Ear Trainer app: https://apps.apple.com/us/app/functional-ear-trainer/id1088761926 ; https://getmusictools.com/functional-ear-trainer ; https://play.google.com/store/apps/details?id=com.kaizen9.fet.android
- Functional Ear Trainer v2 (desktop, Benbassat): https://www.miles.be/software/34-functional-ear-trainer-v2
- ToneDear: https://tonedear.com/ ; https://tonedear.com/ear-training/functional-solfege-scale-degrees
- ToneSavvy: https://tonesavvy.com/
- teoria.com: https://www.teoria.com/en/exercises/ ; https://www.teoria.com/en/help/exercises-help.php ; https://www.teoria.com/en/help/about.php ; https://evolving.opened.ca/2019/10/08/teoria-tool/
- musictheory.net: https://www.musictheory.net/exercises ; https://www.musictheory.net/products/tenuto ; https://apps.apple.com/us/app/tenuto/id459313476
- Auralia: https://www.risingsoftware.com/auralia ; https://www.jrrshop.com/rising-software-auralia-5.html
- Perfect Ear: https://perfectear.app/ ; https://apps.apple.com/us/app/perfect-ear-music-rhythm/id1440768353 ; https://www.bloomvocal.site/en/blog/perfect-ear-review-2026
- Complete Ear Trainer: https://completeeartrainer.com/ ; https://apps.apple.com/us/app/complete-ear-trainer/id1012455471
- Theta Music Trainer: https://trainer.thetamusic.com/en/content/music-training-games ; https://trainer.thetamusic.com/en/content/price ; https://apps.apple.com/us/app/theta-music-trainer/id791698217
- ToneGym: https://www.tonegym.co/games/index ; https://www.tonegym.co/ ; https://www.tonegym.co/shop/index ; https://apps.apple.com/us/app/tonegym-ear-training-studio/id6748112656 ; https://jadebultitude.com/ear-training/tonegym/ (older third-party review, prices outdated)
- SoundGym: https://www.soundgym.co/games/index ; https://www.soundonsound.com/news/soundgym-new-ear-training-platform-launched
- Chet and Ella: https://www.ensemble-education.com/chet ; https://apps.apple.com/us/app/chet-ear-training/id1405525467 ; https://apps.apple.com/us/app/id1301456113
- MyEarTraining: https://www.myeartraining.net/ ; https://apps.apple.com/us/app/myeartraining-ear-trainer/id885622580
- Earpeggio: https://apps.apple.com/us/app/id884775105
- EarBeater (likely discontinued): https://earbeater-ear-training.updatestar.com/ ; https://www.earbeater.com/ (certificate mismatch, HTTP 406)
- Chord Crush: https://www.hooktheory.com/chord-crush ; https://www.hooktheory.com/blog/ear-training-apps-and-exercises/
- Sight Reading Factory: https://www.sightreadingfactory.com/pricing
- Rhythm Randomizer: https://www.rhythmrandomizer.com/ ; https://github.com/bobderrico80/rhythm-randomizer-v2
- ABRSM Aural Trainer: https://apps.apple.com/gb/app/abrsm-aural-trainer-grades-1-5/id491907493 ; https://apps.apple.com/us/app/abrsm-aural-trainer-grades-6-8/id1001613037
- AURALBOOK: https://www.playnote.com/ ; https://apps.apple.com/app/id554032995
- Singing Carrots: https://singingcarrots.com/pitch-training ; https://singingcarrots.com/docs/singing-carrots-pitch-training/
- Solfeg.io: https://solfeg.io/for-learning/pricing ; https://solfeg.io/for-schools/pricing
- Tone – Learn Perfect Pitch: https://apps.apple.com/us/app/id1139019670
- Sonofield Ear Trainer: https://apps.apple.com/us/app/id6740409139
- Musicopoulos (dropped): https://appshunter.io/ios/app/711826901/similar (blocks automated fetches; App Store ID 711826901 no longer resolves)

Courses
- Musical U: https://www.musical-u.com/training/ ; https://www.musical-u.com/modules/melodies/
- Berklee Online Ear Training 1: https://online.berklee.edu/courses/ear-training-1
- Coursera, Developing Your Musicianship: https://www.coursera.org/learn/develop-your-musicianship
- Karpinski, Manual for Ear Training and Sight Singing: https://wwnorton.com/books/9780393614251 ; https://wwnorton.co.uk/books/9780393892789-manual-for-ear-training-and-sight-singing

Open source
- OpenEar: https://github.com/ShacharHarshuv/open-ear
- GNU Solfege: https://www.gnu.org/software/solfege/solfege.html ; https://en.wikipedia.org/wiki/GNU_Solfege
- Nootka: https://github.com/SeeLook/nootka
- birdears: https://github.com/birdears/birdears
- GitHub ear-training topic: https://github.com/topics/ear-training

Exams and curricula
- AP Music Theory exam: https://apstudents.collegeboard.org/courses/ap-music-theory/assessment ; course and exam description (effective fall 2026): https://apcentral.collegeboard.org/media/pdf/ap-music-theory-course-and-exam-description.pdf
- ABRSM aural tests: grade guides https://www.e-musicmaestro.com/auraltests/guides/abrsm-grade-4-guide ; https://www.e-musicmaestro.com/auraltests/guides/abrsm-grade-6-guide ; https://www.e-musicmaestro.com/auraltests/guides/abrsm-grade-8-guide ; https://jadebultitude.com/abrsm-aural-test/ (Grades 1–3) ; Singing for Musical Theatre syllabus (its own aural tests; states sung answers are marked on pitch): https://www.abrsm.org/sites/default/files/2025-01/SfMT%20Practical%20Grades%20Syllabus%20G1-8%202025%20(20250130).pdf ; abrsm.org's own aural-tests pages block automated fetches, so the "unchanged for 2026" and pitch-not-quality points for instrumental exams come from its search-result text
- RCM ear tests: piano syllabus 2022 edition https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf ; https://www.dacapomusic.ca/blog/rcm-exams-complete-guide
- Trinity aural: https://www.trinitycollege.com/qualifications/music/grade-exams/about/supporting-tests ; https://blog.trinitycollege.co.uk/aural-and-unpitched-aural

Research and pedagogy
- Van Hedger, Heald & Nusbaum 2019, Absolute pitch can be learned by some adults, PLoS ONE: https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0223047
- Van Hedger et al. 2015, Auditory working memory predicts individual differences in absolute pitch learning, Cognition: https://pubmed.ncbi.nlm.nih.gov/25909580/
- Wong, Ngan, Cheung & Wong 2020, Absolute pitch learning in adults speaking non-tonal languages, QJEP: https://doi.org/10.1177/1747021820935776
- Wong, Cheung, Ngan & Wong 2025, Learning fast and accurate absolute pitch judgment in adulthood, Psychonomic Bulletin & Review: https://doi.org/10.3758/s13423-024-02620-2 ; summary: https://featuredcontent.psychonomic.org/from-pitchy-to-pitch-perfect-training-absolute-pitch-in-adults/
- Graves & Oxenham 2017, Familiar tonal context improves accuracy of pitch interval perception, Frontiers in Psychology: https://pmc.ncbi.nlm.nih.gov/articles/PMC5640898/
- Wong, Chen & Lim 2021, Learning melodic musical intervals: To block or to interleave?, Psychology of Music 49(4): https://journals.sagepub.com/doi/abs/10.1177/0305735620922595
- Pavlik, Hua, Williams & Bidelman 2013, Modeling and Optimizing Forgetting and Spacing Effects during Musical Interval Training, EDM 2013 proceedings pp. 145–152: https://researchr.org/publication/edm-2013 ; https://www.researchgate.net/publication/258883155_Modeling_and_Optimizing_Forgetting_and_Spacing_Effects_during_Musical_Interval_Training
- Little, Cheng & Wright 2019, Inducing musical-interval learning by combining task practice with periods of stimulus exposure alone, Attention, Perception & Psychophysics: https://link.springer.com/article/10.3758/s13414-018-1584-x
- Amitay, Irwin & Moore 2006, Discrimination learning induced by training with identical stimuli, Nature Neuroscience: https://www.nature.com/articles/nn1787
- Katz, Ando & Wiseheart 2021, Optimizing song retention through the spacing effect, Cognitive Research: https://link.springer.com/article/10.1186/s41235-021-00345-7
- Wiseheart, D'Souza & Chae 2017, Lack of spacing effects during piano learning, PLoS ONE: https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0182986
- Kendüzler 2026, Intervals as musical fingerprints (scoping review, Frontiers in Psychology; used only as a pointer to primary studies, and its one-line summary of Wong et al. 2021 does not match that paper's abstract): https://pmc.ncbi.nlm.nih.gov/articles/PMC12950661/
- Karpinski, Aural Skills Acquisition (OUP): https://global.oup.com/academic/product/aural-skills-acquisition-9780195117851 ; summary: https://uen.pressbooks.pub/auralskills/chapter/chunking-and-extractive-listening/
- Fixed vs moveable do: Hung 2012 dissertation https://repository.usfca.edu/diss/38/ ; Demorest & May 1995, JRME 43(2) https://journals.sagepub.com/doi/abs/10.2307/3345676 ; Cassidy 1993, Effects of various sightsinging strategies on nonmusic majors' pitch accuracy, JRME 41(4), 293–302 (abstract seen via search results only) ; Sight-Singing Habits of High-Achieving Middle and High School Choirs, Research Perspectives in Music Education 2020 (89.36% moveable-do): https://www.ingentaconnect.com/contentone/fmea/rpme/2020/00000021/00000001/art00003?crawler=true&mimetype=application%2Fpdf
- Kodály method overview: https://blog.flat.io/kodaly-method-explained/ ; https://kodaly.org.au/kodaly-concept/musicianship-tools/
