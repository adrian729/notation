# @polyhymnia/mnx

## 0.3.0

### Minor Changes

- 9216ea7: Support grace-note ids and zero-duration timeline entries, cue-size engraving with explicit grace beams, and playback that steals from adjacent events or inserts time. Preserve following event ids and tied-note playback, and report grace editing as unsupported.

## 0.2.0

### Minor Changes

- 13d6a04: A part with `staves: 2` lays out as a grand staff: a brace and a system line on the left, barlines and repeat dots through both staves, notes aligned across them by time, and each staff with its own clefs, clef changes, courtesy clefs, up to two voices, beams, tuplets, accidentals, ties and slurs; key and time are shared. A part with 3+ staves lays out staves 1–2 and reports `mnx-unsupported`; cross-staff notes, events and tuplets are laid out on their own staff, cross-staff beams, ties and slurs are not drawn (`mnx-unsupported`). Staff-1 ids are unchanged; staff-2 elements carry their `st2.` ids. New optional output fields, present only for 2-staff parts: `SystemBox.staves` (each staff's top line; `SystemBox.h` covers the whole system), `ElementBox.staff`, `Slot.staff`/`SlotRef.staff`, `EntryPlacement.staff` and `MeasureBox.staves` (`{clef, key, clefChanges?}` per staff); `staff` is 0 for staff 1 and 1 for staff 2. `GlyphRun.scale` (omitted when 1) multiplies a glyph's font size, and `<Notation>` renders it as `fontSize = 4 × scale`; `GlyphRun.scaleY` (omitted when 1) additionally stretches the glyph vertically about its origin, which `<Notation>` renders as an SVG transform, so the brace spans the system while staying 0.9 sp wide. Hit-testing finds the system from its full height, picks the nearest staff and reads that staff's slots and clef; `HitResult` and `PreviewNote` carry an optional `staff`, and the hover identity of a point includes it. `applyIntent` addresses every staff the part declares, so a staff-2 event can be edited by its `st2.` id.
