# E1 Interval Comparison

Product spec for Polyhymnia's version of EarMaster's Interval Comparison (`docs/earmaster.md` E1). Tags: **[EM]** = matches documented EarMaster behaviour (source in `docs/earmaster.md` or the URL given); **[ours]** = EarMaster is undocumented here, so this is our decision.

Implementation: `apps/app/src/exercises/interval-comparison/` (pure logic) and `apps/app/src/routes/exercises/interval-comparison/` (screens). Nothing in `packages/*` changes.

## Plays

- Two intervals, **A then B**, in one playing mode shared by both: ascending, descending or harmonic [EM, the common-tone option text implies one mode per question].
- Melodic: each tone lasts one note length (tempo option), no gap between the two tones of an interval [ours].
- Harmonic: both tones together for two note lengths [ours].
- Silence of one note length between A and B [ours].
- The question plays automatically when it appears. **Play question** replays the whole A–B pair; there is no separate replay of A or B [EM: only "Play Question" is documented].

## Shows

- Before answering: the instruction "Which interval is larger?", the **A** and **B** buttons, **Play question**, and in lessons the progress bar. No staff [EM: the staff only shows the tones after answering and is never an input].
- A and B are disabled until the question has started playing [ours].

## Answer

- Press **A** or **B** (mouse, touch, or keys `A` / `B`) [EM: "Choose A with the mouse or on the keyboard"].
- Binary only; there is no "equal" answer [EM]. Pairs of equal size are never generated [ours; EarMaster never mentions ties].
- One answer per question; it is evaluated immediately [EM F15].
- Anything that ends the question (answering, **Finish** in endless mode, or leaving) stops the sound immediately; **Play question** can replay it afterwards [ours].

## Options

Custom exercise (all options) [EM, E1 options]; workshop lessons fix them.

| Option | Values | Tag |
| --- | --- | --- |
| Intervals | Any of m2, M2, m3, M3, P4, TT, P5, m6, M6, m7, M7, P8 and compound m9 … P15 (13–24 semitones); at least two sizes | EM |
| Playing mode | Any of ascending, descending, harmonic; random among the selected, per question | EM |
| Tone relationship | Common first tone · Common first or second tone · Nearby first tones · No common tones | EM (names from the workshop) |
| Range | Lowest and highest tone any question may use | ours (replaces EarMaster's keys and root movement) |
| Tempo | Slow, medium, fast note length (1.0 s, 0.7 s, 0.45 s) | EM (shared tempo option), values ours |
| Questions | A whole number from 1 to 200 (number input, with -10/-1/+1/+10 steppers), or endless | ours |
| Auto new question | Off, or after a correct answer (1.5 s, shown as a countdown bar on a **Stay** button that cancels it for the current question; replaying restarts the countdown) | EM F12, Stay ours |

Keys and root movement are simplified to a range: EarMaster's key options matter for tonal context, which E1 does not use.

The custom exercise screen shows interval names as full name plus abbreviation (e.g. "Major 3rd (M3)") by default, with a toggle to switch to abbreviations only. The last-used custom options and that toggle are remembered in the browser (`localStorage`) and restored next time the page opens with no options chosen yet; a **Reset to defaults** button clears back to the defaults above [ours].

## Question choice

- Mode: uniform among the enabled modes [EM].
- Sizes: two different semitone sizes from the enabled set, uniform over pairs; which one is A is random, so A and B are each correct about half the time; the exact same pair and order never repeats back to back [ours].
- Roots, by tone relationship. The **first tone** is the tone played first: the lower tone for ascending and harmonic, the upper tone for descending [EM: "melodic down … the top tone in common"].
  - Common first tone: A and B share their first tone [EM].
  - Common first or second tone: A and B share either their first tone or their second tone, 50/50 [ours; EarMaster names the lesson but does not define it].
  - Nearby first tones: first tones 1–4 semitones apart [ours].
  - No common tones: no pitch is shared between A and B [EM name, ours rule].
- All four tones stay inside the range; otherwise the choice is redrawn [ours].
- Spelling: every interval is spelled correctly from its first tone (letter distance plus quality, e.g. M3 above E♭ is G). First tones use the spellings C, C♯, D, E♭, E, F, F♯, G, A♭, A, B♭, B, respelled enharmonically when the other tone would need a double accidental. A shared tone has the same spelling in both intervals. The tritone is spelled A4 or d5, whichever avoids double accidentals [ours].

## Feedback / scoring

- After answering, the chosen button turns green if right or red if wrong; the correct button is always green [EM F16].
- The instruction line says "Correct: B was larger" or "Wrong: A was larger" [ours wording].
- Reveal: both intervals on their own staff, stacked (A above B) at a large, fixed size, labelled **A** and **B** with their name and direction (e.g. "Major 3rd, ascending"). Clef: treble unless the question's middle tone lies below C4, then bass [EM shows tones; labels and names ours].
- Play question still works after answering. **Next question** (`Enter`) continues [EM behaviour; EarMaster labels it "New question"].
- Question score: right or wrong. Lesson or session score: right answers ÷ questions asked, as a percentage [EM F15].
- Progress bar (any fixed-length run, lesson or custom): one segment per question, grey upcoming, pink (primary) current, green (success) right, red (destructive) wrong [EM F5, current]. Endless runs show no progress bar; instead a **Finish** button ends the session at any point [ours].
- Every finished session — lesson, custom, or an endless run ended with **Finish** — shows the score and a review of every question asked, each with a **Replay** button. Only lessons additionally show a passed/not passed badge [ours].

## Levels

Workshop: 20 modules = 5 interval families × 4 tone relationships, each with an ascending, a descending, a harmonic and a mixed lesson (mixed picks a mode uniformly per question, same as Question choice), 80 lessons in all [EM S9 structure; exact lesson names undocumented, names ours].

| Family | Intervals |
| --- | --- |
| Perfect | P4, P5, P8 |
| Imperfect consonant | m3, M3, m6, M6 |
| Dissonant | m2, M2, TT, m7, M7 |
| All simple | m2 … P8 |
| Compound | m9 … P15 |

- Module order: family by family, and inside each family the relationships in the order listed under Question choice (common first tone is easiest) [ours].
- Lesson rules [ours]: a lesson asks exactly its number of questions (10), never more, then shows the score. It is passed at 80% or more (used for the passed mark and the suggested next lesson). Custom runs ask exactly the selected number, show the score and the per-question review, and are never graded. EarMaster's supplementary questions (F3) are deliberately not copied.
- After the lesson, a summary shows the score, passed or not, and **Retake**, **Next lesson** (suggested when passed) and **Back to lessons** [EM F6], followed by a review of every question asked: both intervals stacked, at exactly the same size as the in-lesson reveal, framed green (success) if answered correctly or red (destructive) if not, each with a **Replay** button that plays the same A–B pair again [ours].
- Range per lesson: C3–C6 for simple families, G2–C6 for compound [ours].
- The lesson list shows each lesson's best score and a passed mark, stored locally in the browser [EM F7, simplified].
- Not copied: stricter end-of-module test lessons, adaptive questions (F4), per-interval statistics.

## Notes

- Needs no theory, so it is the recommended first exercise [EM].
- Keyboard: `A`, `B` answer; `Space` plays the question; `Enter` goes to the next question once answered [ours; EarMaster's F5/F6/F7/F8 shortcuts do not suit a browser].
- Harmonic seconds must render with side-by-side noteheads; if they don't, that is a `notation-engine` gap to report, not something to work around in the app.
