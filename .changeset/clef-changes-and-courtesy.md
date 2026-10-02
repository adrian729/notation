---
'@polyhymnia/mnx-score': minor
'@polyhymnia/notation-engine': minor
'@polyhymnia/notation-react': minor
---

Clef changes are drawn as small change clefs, before the barline or mid-measure right before the first element at the clef's position, and every note uses the clef in force at its own tick. When the next system starts with a key or time change, the system ends with courtesy naturals, key and time after its last barline. `mnx-score` exports `positionTick` to turn an MNX in-measure position into ticks, clamping a malformed or out-of-range fraction with an `invalid-position` diagnostic. `MeasureBox` gains an optional `clefChanges` list, and hit-testing and previews read pitches in the clef in force; slot bands now end at a clef column and the next element's band starts there. A malformed clef position drops that clef instead of clamping it. New `NotationOptions.changes`: `clefAtBarline` (`'before'` default, or `'after'` for a full-size clef after the barline) `restateTimeAfterCourtesy` (default `true`: the new system repeats the time signature shown as a courtesy) and `cancelNaturals` (`'always'` default, or `'same-type-only'` to skip naturals on a sharps↔flats change). Cancellation naturals are separated from the new key by a half-space gap. Courtesy time signatures now use `courtesy-time-numerator` and `courtesy-time-denominator` classes.
