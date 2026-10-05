# @polyhymnia/mnx-score

## 0.3.1

### Patch Changes

- 9f1cbd1: Update music-theory to 0.2.0; the playground also uses web-audio 0.3.0 for microphone-compatible host audio-session policy.

## 0.3.0

### Minor Changes

- 9216ea7: Support grace-note ids and zero-duration timeline entries, cue-size engraving with explicit grace beams, and playback that steals from adjacent events or inserts time. Preserve following event ids and tied-note playback, and report grace editing as unsupported.
- 9f0c293: Add separate articulation, fermata, dynamic and hairpin hitboxes with stable ids and keyboard selection. Reserve articulation space beside ties and clear stacked accents from neighboring notes. Sustain fermatas using a shared playback clock that keeps voices, repeats, tempo changes and the cursor synchronized.

### Patch Changes

- Updated dependencies [9216ea7]
  - @polyhymnia/mnx@0.3.0

## 0.2.0

### Minor Changes

- ff31212: Articulations, fermatas, dynamics and hairpins are drawn and played. Staccato, staccatissimo, tenuto, accent, marcato (honouring `pointing`), soft accent, stress and unstress sit on the notehead side (the stem side in two voices, marcato above), staccato and tenuto in the nearest space, accents outside the staff, in that stacking order; slurs arch over staccato, staccatissimo and tenuto and keep accents outside. Fermatas on notes, rests, whole-bar rests and the measure's end barline go above everything (below the lower voice or the lower staff of a grand staff). Immediate and accent dynamics use SMuFL's precomposed glyphs, optically centred on their note, on one line per system with the hairpins; hairpins split at system breaks with partly open ends, and on a grand staff dynamics go between the staves. New glyph classes `articulation`, `fermata` and `dynamic`, and path class `hairpin`; new diagnostic `hairpin-end-unresolved`; spiccato, bowings, tremolo, relative dynamics and dynamic text stay `mnx-unsupported`. In `mnx-score`, `TimelineEntry` gains optional `articulations` and `dynamicLevel` (omitted at the `mf` default), and `PerformanceEvent` gains an optional `velocity` on a 0..1 scale (`ppp` 0.25, `mf` 0.8 omitted, `fff` 1.0, hairpins ramped, accent +0.1, marcato +0.15); staccato plays half length and staccatissimo a quarter. `<Notation>` colours the new marks as signage in the mensural style.
- 30a9673: Clef changes are drawn as small change clefs, before the barline or mid-measure right before the first element at the clef's position, and every note uses the clef in force at its own tick. When the next system starts with a key or time change, the system ends with courtesy naturals, key and time after its last barline. `mnx-score` exports `positionTick` to turn an MNX in-measure position into ticks, clamping a malformed or out-of-range fraction with an `invalid-position` diagnostic. `MeasureBox` gains an optional `clefChanges` list, and hit-testing and previews read pitches in the clef in force; slot bands now end at a clef column and the next element's band starts there. A malformed clef position drops that clef instead of clamping it. New `NotationOptions.changes`: `clefAtBarline` (`'before'` default, or `'after'` for a full-size clef after the barline) `restateTimeAfterCourtesy` (default `true`: the new system repeats the time signature shown as a courtesy) and `cancelNaturals` (`'always'` default, or `'same-type-only'` to skip naturals on a sharps↔flats change). Cancellation naturals are separated from the new key by a half-space gap. Courtesy time signatures now use `courtesy-time-numerator` and `courtesy-time-denominator` classes.

### Patch Changes

- Updated dependencies [13d6a04]
  - @polyhymnia/mnx@0.2.0
