---
'@polyhymnia/mnx-score': minor
'@polyhymnia/notation-engine': minor
'@polyhymnia/notation-react': minor
---

Clef changes are drawn as small change clefs, before the barline or mid-measure right before the first element at the clef's position, and every note uses the clef in force at its own tick. When the next system starts with a key or time change, the system ends with courtesy naturals, key and time after its last barline. `mnx-score` exports `positionTick` to turn an MNX in-measure position into ticks, clamping a malformed or out-of-range fraction with an `invalid-position` diagnostic. `MeasureBox` gains an optional `clefChanges` list, and hit-testing and previews read pitches in the clef in force.
