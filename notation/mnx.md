# MNX

MNX (W3C Community Group, `w3c-cg/mnx`) is the component's only score format — public APIs take and return plain MNX, never a private model or an "MNX + extensions" shape (`AGENTS.md`). This file covers the subset the engine actually lays out, how unsupported MNX degrades, time representation, IDs, diagnostics, and how the vendored schema is upgraded. `interface.md` covers the `score` prop and authoring; `architecture.md` covers where in the pipeline MNX is read.

## Where MNX is read

Two places read the raw MNX document, split by concern. `@polyhymnia/mnx-score` (`buildTimeline`) reads everything that carries musical time: it calls `readMnx()` (`mnx/src/mnx/read.ts`) to check `mnx.version`, walks the scoped sequences with `elementIds` from `mnx` and builds the `Timeline` — ids, ticks, durations, tuplets, pitch → midi, ties, pickup and capacity, padding rests, tempo and play order. `notation-engine`'s `layout/normalize*.ts` reads only engraving data (clef, key, stem directions, beams, slurs, system breaks, `useBeams`) and finds every element through `timeline.ids`, never by walking sequences for ids itself. `layout/temporal.ts` is a join of timeline entries and normalized records; it does not read the document. Every stage after `temporal` reads only flat records (`layout/records.ts`'s types) and the timeline. This is the boundary `AGENTS.md` requires: a MNX field that affects time changes `mnx-score`; one that only affects drawing changes `normalize*.ts`.

`layoutScore(doc: MnxDocument, options)` is the pipeline entry point. It builds the default-scope timeline (memoized per document and `options.divisions`, ticks per quarter note, default 3360) and returns it as `layout.timeline`. Playback outside the laid-out scope uses `buildTimeline(doc, {scope: 'all'})` directly (`audio.md`).

## Supported subset

Reading `parts[0]` only, staves 1–2 (staff 2 only when the part declares `staves: 2` or more), up to 2 sequences (voices) per staff per measure:

| MNX construct | Engine mapping |
| --- | --- |
| `global.measures[i].time` | `TimeSpec { beats, beatType, symbol? }`; `display: 'common'`/`'cut'` → `symbol`. Invalid/missing → inherits the previous measure's time, diagnostic `invalid-time-signature` |
| `global.measures[i].key.fifths` | `KeySpec { fifths }`, clamped to −7..7 + `mnx-unsupported` when clamping actually changed the value. Missing/non-numeric `fifths` → inherits the previous measure's key, diagnostic `invalid-key-signature` |
| `global.measures[i].barline.type` | `barlineEnd`: `regular`→`single`, `double`→`double`, `dashed`→`dashed`, `final`→`final`, `noBarline`→`none`. Anything else drawn as `single` + `mnx-unsupported` |
| `global.measures[i].repeatStart` / `.repeatEnd` | `barlineStart: 'repeat-start'` / `barlineEnd: 'repeat-end'`. `repeatEnd.times !== 2` still draws a plain end-repeat + `mnx-unsupported` |
| `global.measures[i].tempos[]` | `TempoEvent { tick, bpm, beatUnit? }` — `location.fraction` → an offset from the measure start, added to the running tick total; `value` → `beatUnit` (defaults to a quarter when the value's base isn't supported) |
| `parts[0].staves` | `2` or more → a grand staff: staves 1 and 2 are laid out (`engraving.md` "Grand staff"); each has its own clefs, voices and beams, key and time are shared. The timeline is built with `scope: { staves: [1, 2] }`, so staff-1 ids are unchanged and staff-2 ids carry the `st2.` prefix. `3` or more → staves 1–2 + `mnx-unsupported` |
| `parts[0].measures[i].clefs[]` | `{ staff?, sign, staffPosition, octave? }` → `ClefSpec` of that staff (default 1). `staffPosition` 0 = the staff's middle line: G/−2 = treble, F/2 = bass, C/0 = alto, C/2 = tenor. `octave: 1 \| -1` → `octaveShift`. Any other G/F/C sign/position combination falls back to the nearest of treble/bass/alto by sign, + `mnx-unsupported`. A `sign` outside `G`/`F`/`C`/`P` has no fallback — the previous clef is kept, + `mnx-unsupported`. `position` goes through `mnx-score`'s `positionTick` (unreadable → `invalid-position`, that clef is dropped; past the measure's end → `invalid-position`, clamped): a clef at 0 sets the measure's start clef, a later one is drawn mid-measure before the first element at or after it, and one with no element at or after it takes effect at the next barline (`engraving.md` "Clef changes") |
| `sequences[]` (`staff`, up to 2 per staff) | Voice 0 = a staff's first sequence, voice 1 = its second. A 3rd+ sequence on a staff is dropped, diagnostic `too-many-voices` |
| `event` with one `notes` entry | note |
| `event` with `notes.length > 1` | chord — one `ElementNote` per member |
| `event.rest` | rest; `rest.staffPosition` → the rest's forced staff line/space |
| `sequence.fullMeasure` | a whole-bar rest (`wholeBar: true`) — see "Whole-bar rests" below |
| `tuplet` container | flattened: children get a `TupletRef { id, actual, normal, display? }`, `actual`/`normal` from `inner`/`outer` reduced to lowest terms (`tupletRatio`, `mnx/src/mnx/time.ts`). `bracket`/`showNumber`/`placement` are carried through to `display` (only when at least one is given); `showValue` is not drawn, `mnx-unsupported`. A tuplet nested inside another is flattened into one combined ratio + `mnx-unsupported` (message says the content "keeps only the outer tuplet's ratio" when the inner ratio itself is unsupported, vs "laid out untupled" for an unnested tuplet); its `display` is the innermost tuplet's own |
| `parts[0].measures[i].beams[]` | See "Beams" below |
| `note.accidentalDisplay` | absent → `'auto'`; `show: false` → `'never'`; `show: true` → `'always'`; `show: true` + `enclosure.symbol: 'parentheses'` → `'cautionary'` |
| `note.ties[].target`/`targetType` | resolved to a start/stop pair by MNX note id — the earlier note gets `tie: 'start'`/`'continue'`, the resolved target gets `'stop'`/`'continue'`. Only `targetType: 'nextNote'` or an absent `targetType` is drawn this way; `crossVoice`/`arpeggio`/`crossJump` are not drawn, + `mnx-unsupported`. An unresolved target → diagnostic `tie-target-unresolved`, no tie drawn. `tie.lv` (laissez-vibrer) is not drawn, `mnx-unsupported` |
| `event.slurs[]` | `NormalizedSlur { id, from, to, startNote?, endNote?, side?, measureIndex }`, `id` = `slur.id` ?? `${fromEventId}.slur${k}`. `target` resolves to the tied-to event's laid-out ids; an unresolved `target`/`startNote`/`endNote` → diagnostic `slur-target-unresolved`, the slur is not drawn. `lineType` other than `'solid'` → drawn solid, `mnx-unsupported`; `sideEnd` differing from `side` → the start `side` is used for the whole curve, `mnx-unsupported`. See "Slurs" in `engraving.md` for direction/clearance |
| `event.stemDirection` | `'up'`/`'down'` override; anything else is the engine's own resolution (`engraving.md`) |
| `event.markings.breath` | drawn as `'comma'` unless `symbol` is something other than `'comma'`/`'auto'`, then still drawn as a comma + `mnx-unsupported` |
| `event.markings.staccato`/`staccatissimo`/`tenuto`/`accent`/`strongAccent`/`softAccent`/`stress`/`unstress` | `EventEngraving.articulations[] { id, kind, placement?, pointing? }` (`placement` `'auto'` = the engine's choice; `pointing` read for `strongAccent`); the timeline carries the kinds on `TimelineEntry.articulations` for playback. Drawn per `engraving.md` "Articulations" |
| `event.fermata`, `sequence.fullMeasure.fermata`, `global.measures[i].fermata` | `EventEngraving.fermata` / `NormalizedMeasure.fermata` `{ id, placement?, pointing? }`; a `symbol` other than `'normal'` draws the normal fermata + `mnx-unsupported`; `duration` is carried by the timeline for playback holds (`playback.md`) |
| `parts[0].measures[i].dynamics[]` | `NormalizedDynamic { id, measureIndex, tick, staffIndex?, placement, text?, hairpin? }`, `id` = `dynamic.id` ?? `m{i}.dyn{k}`. `position` goes through `positionTick` (`invalid-position` as for clefs). `immediate` → `text` = `value`; `accent` → `accentPrefix` (default `s`) + `value` + `accentSuffix` (default `z`) + `residualValue`; `gradual` → `text` = `value` when given, and `hairpin { wedge, endTick }` from `wedgeType` and `end { measure, position }`, the measure id resolved through `global.measures[].id` — unresolved or not after the start → `hairpin-end-unresolved`, no hairpin. `staff` limits it to one staff (outside the laid-out staves → `mnx-unsupported`, not drawn). The timeline turns the same entries into each note's `dynamicLevel` (`playback.md`). Drawn per `engraving.md` "Dynamics and hairpins" |
| `event.markings.caesura` | drawn as `'caesura'`; a caesura + a breath on the same event draws only the caesura + `mnx-unsupported`; a non-default `shape`/`marks` still draws a plain caesura + `mnx-unsupported` |
| `scores[0].pages[].systems[].measure` | forces a system break after the *previous* measure (a system starting at measure `k` → break after `k−1`). No `pages`/`systems` at all → greedy breaking (`engraving.md`). A `measure` id that doesn't resolve → diagnostic `system-measure-unresolved`. More than one entry in `scores[]` → only `scores[0]` is used, + `mnx-unsupported` |
| first measure whose longest content is shorter than the meter | pickup — no padding, no diagnostic (see "Pickup and fullness rules" below) |
| any other measure shorter than its meter | padded with synthetic trailing rests + diagnostic `measure-underfull` |
| a measure longer than its meter | truncated at the barline + diagnostic `measure-overfull` (error) |
| `space` sequence content | advances time without emitting a note/rest/chord — invisible |

Note values: `breve`, `whole`, `half`, `quarter`, `eighth`, `16th`, `32nd`, `64th`, 0–2 dots (more than 2 dots draws 2 + `mnx-unsupported`). The MNX enum also has `duplexMaxima`/`maxima`/`longa` above breve and `128th`..`4096th` below 64th — an event using one of those is skipped entirely (`invalid-duration` if the value can't even be read, `mnx-unsupported` if the base is simply outside the supported set).

## Unsupported MNX

`AGENTS.md`: unsupported MNX renders what's possible plus an `mnx-unsupported` diagnostic, never throws. Constructs the engine recognizes but does not lay out — each reported once per measure (or once per document, for whole-document constructs), via `Reader.unsupported()` (`layout/normalize-reader.ts`'s `createReader`):

- Multiple parts (only `parts[0]` is laid out), a part with `staves > 2` (only staves 1–2), a part's `transposition`/`kit` (percussion kits aren't laid out)
- A 3rd+ sequence in a measure (`too-many-voices`, listed separately below since it isn't gated through `unsupported()`); a sequence or clef on a staff the part doesn't declare (`staff` above `parts[0].staves`, or below 1)
- Percussion clefs and other unrecognized clef sign/position pairs (fall back to the nearest of treble/bass/alto); a clef octave outside `-1..1`
- Multi-note tremolo (its time is left blank via a `space`), lyrics, ottavas, arpeggios/non-arpeggios, staff configs, measure repeats
- `relative` dynamics (not drawn); a dynamic's `prefix`/`suffix` text (not drawn), `glyphs` (drawn from its value), `visuallyContinues` (drawn as a separate dynamic), a cross-staff hairpin (`staffEnd`, drawn on one staff), `placement: 'between'` on a single staff (drawn below), an unknown `value` (not drawn)
- `slur.lineType` other than `'solid'` (drawn solid); `slur.sideEnd` differing from `slur.side` (the start side is used for the whole curve)
- `tuplet.showValue` (only the actual count is drawn, per `showNumber`/`options.tuplets.showRatio`)
- `ending`, `jump`, `segno`, `fine` (honored for playback order via the timeline's play-order segments, but not drawn), multimeasure rests; a fermata `symbol` other than `normal` (drawn as a normal fermata)
- A measure's `number` override (ignored — measures are numbered positionally)
- `note.written`/`note.perform` (sounding pitch is drawn instead; perform hints are ignored)
- Cross-staff notes/events/tuplets (laid out on their sequence's staff); cross-staff beams, ties and slurs (not drawn)
- Any `event.markings` key besides `breath`/`caesura`, the eight articulations above, `id` and the internal `_c`/`_x` reserved names — that is `spiccato`, `bowDirection` and single-note `tremolo`
- An accidental `alter` outside `-2..2` (clamped, drawn with the clamped value); a key signature's `fifths` outside `-7..7` (clamped, drawn with the clamped value)
- A tie's `targetType` other than `nextNote`/absent (`crossVoice`, `arpeggio`, `crossJump` — not drawn)
- Nested tuplets (flattened to one combined ratio), a tuplet whose `inner`/`outer` note value isn't supported (its content is laid out untupled, or keeps only the outer ratio when nested)
- More than one `scores[]` entry (only the first score's layout is used)
- Root `layouts`, `score.layout`, `page.layout`, `system.layout`/`layoutChanges` (staff-group layouts are ignored)
- `score.useWritten: true` (sounding pitches are drawn); `mnx.support.useAccidentalDisplay: false` (accidental display settings are applied regardless)
- `clef.glyph`/`hide`/`showOctave`/`color` (ignored); `accidental-display.force` (ignored); `breath-mark.placement` (default position); `full-measure-rest.visualDuration` (drawn as a whole-bar rest)
- `part.name`/`shortName`, `score.name`, `global.lyrics` (not drawn)
- `graceIndex` in tempo, clef and dynamic positions (grace positioning ignored)
- A synthesized positional id that collides with an id already in use (disambiguated with a `~2`, `~3`, … suffix, diagnostic `id-collision`); an explicit id reused on more than one laid-out element (diagnostic `id-collision`, first occurrence wins)

One construct the engine reads but doesn't yet lay out is downstream of `normalize`, not gated through the same `unsupported()` helper, so it gets its own diagnostic code instead of `mnx-unsupported`:

- Anything past 2 sequences never reaches the timeline's entries — diagnostic `too-many-voices` (warning), from `mnx-score`, listing how many were dropped.

A 2nd voice (`sequences[1]`) is parsed, carried through `temporal`, and laid out by `layout/vertical.ts` (`engraving.md` "Two voices").

## Beams

`mnx.support.useBeams` decides whether the engine invents beams (`w3c-cg/mnx` support object docs; `phase3-rhythm.md` "DECISIONS FROM RESEARCH"):

- **`useBeams: true`**: only what's explicitly in a measure's `beams[]` gets beamed. A measure with no `beams` entry is left entirely unbeamed (flags).
- **`useBeams` false or absent** (the default): a measure with an explicit `beams[]` uses exactly that; a measure with none is auto-beamed by the engine, using `beamGroups` from the engine's own `layout/beam-policy/` (driven by `options.beaming` — see `interface.md`). Auto-beaming never goes through MNX: it calls the grouping core directly with the engine's own element ids, so it never mints an id or mutates anything.

Either way, the result is one `NormalizedBeam` per beamed run:

```ts
interface BeamSegment { level: number; first: NoteId; last: NoteId; hook?: 'left' | 'right'; }
interface NormalizedBeam {
  id: string;
  staffIndex: number; // 0 = staff 1, 1 = staff 2
  measureIndex: number;
  voice: 0 | 1;
  elements: readonly NoteId[]; // every element in the group's span, including a rest it crosses
  segments: readonly BeamSegment[]; // secondary levels (2 = 16th, 3 = 32nd, ...) and their hooks
}
```

`elements` holds every id from the first to the last referenced event, in order — a rest an explicit beam spans stays in the span (MNX allows this; auto-beaming never beams over a rest, so this only happens for explicit `beams`). `segments` covers levels beyond the primary (eighth) beam: when the MNX `beams[].beams` nesting is present, its levels and `direction`s (or the derived direction, when a nested single-event group omits `direction`) are read directly; when it's absent, the engine derives them from each element's written duration — a maximal run of elements at the same level becomes one segment, a run of one becomes a hook (`left`/`right`, pointing at the group's own end when the singleton is first/last, otherwise `right` when its onset begins an even-numbered level unit since the group's start and `left` when it's the second of that pair — engraving.md "Beaming").

**Validation** is one rule (`phase3-rhythm.md` "SCOPE ADJUSTMENTS"): a `beams[]` entry that references an unknown event id, an event in a different measure or voice, a note/chord whose written value is a quarter or longer, or has fewer than two real notes, is dropped — flags are drawn, diagnostic `beam-invalid` — including a beam crossing a barline (D11 called this out specifically; the general rule already covers it, since the referenced events resolve to different measures). An event already claimed by an earlier beam in the same measure is likewise dropped from any later one that reuses it. A beam whose events sit on different staves is dropped too, with `mnx-unsupported` instead (cross-staff beaming is unsupported). A repeated id in the same `beams[].events` list is deduplicated before the two-note check, and any member at or past the voice's own measure capacity (what `temporal.ts` would truncate as `measure-overfull`) is dropped first too, so a beam can never reference an event layout never produces.

Beam id = the MNX `beams[].id` when given, otherwise `{firstElementId}.beam`, minted into a per-layout fork of the frozen timeline ids (`timeline.ids.fork()`), so re-layouts of the same document give the same beam ids and a beam id never receives a `~2` suffix. A beam id that collides with an id already in use is reported as `id-collision` (it used to be dropped silently).

## ID rule

Every element the engine lays out gets an id: the MNX `id` when the document supplies one, otherwise a deterministic positional id. Content an app references — playback highlight, quiz lookups, click targets — **must** carry a real MNX `id`; a positional id is stable only until the document is edited.

Id synthesis is a single shared implementation, `elementIds(doc, scope?)` in `mnx` (`@polyhymnia/mnx`'s `elementIds`/`ElementIds`/`NoteId`/`ElementScope`). It walks the scoped sequences once (default scope: part 0, staff 1, 2 voices), in the same order and with the same rules the engine used to apply inline, and hands back a position-keyed lookup (`idAt(pos)`/`nodeOf(id)`/`mint(candidate, ctx?)`/`registerExplicit`/`freeze()`/`fork()`/`diagnostics`, where a position is `{ measureIndex, sequenceIndex, path }` plus a `note` index for chord members or a `fullMeasureRest` marker, and `nodeOf` returns the entry — `{ measureIndex, sequenceIndex, path, note?, element }` — with `element: { kind, node }` typed per kind from the generated MNX types, kind being `event`, `chordNote`, `tuplet` or `fullMeasureRest`). `mint(candidate, ctx?)` is for ids assigned outside that walk (beams); `freeze()` ends minting and `fork()` returns an independent copy.

**Scoped addressing.** `ElementScope { parts?, staves?, maxVoices? }` selects what the walk covers; the default (part 0, staff 1, 2 voices) yields exactly the ids below. Outside the default scope ids are prefixed: `p{n}.` for part `n` and `st{k}.` for staff `k`, so default-scope ids never change when a wider scope is requested. Collision suffixes are `~n` everywhere: `assignIds` (the MusicXML tool) mints through the same `mintId`. Neither `normalize.ts` nor any later engine stage synthesizes element ids: the timeline builds one `ElementIds` per document, mints elements first and then padding rests, and freezes it; the engine only looks ids up through `timeline.ids` (`idAt`, `nodeOf`, `has`, `fork`).

Positional id shapes (measure `m`, sequence `s`, event index `k` within its voice):

| Element | Positional id |
| --- | --- |
| An event (note/rest/chord) | `m{measure}.s{sequence}.e{k}` |
| A chord member | `{eventId}.n{k}` |
| A tuplet | `m{measure}.s{sequence}.t{k}` |
| A full-measure rest | `m{measure}.s{sequence}.full` |
| A synthetic padding rest (underfull measure; timeline entry with `synthetic: true`) | `m{measure}.v{ordinal}.pad{k}` — `ordinal` counts voices per part and staff within the measure; outside the default scope the `p{n}.st{k}.` prefix applies |
| A beam | the MNX `beams[].id`, or `{firstElementId}.beam` |

`k` is advanced by every event *and* by every child of a `grace` or `tremolo` container, with grace children using those reserved ids and tremolo children remaining unaddressable — so an unlabeled event after a grace group or a tremolo gets the index it would have had if those children had been ordinary events.

Every explicit `id` in the document is scanned up front, so a positional id is never silently assigned to two different elements: if a synthesized candidate collides with an id already in use (explicit or previously synthesized), it gets a deterministic `~2`, `~3`, … suffix instead, plus diagnostic `id-collision`. Two elements that explicitly share the same `id` also get `id-collision`; the first occurrence keeps the id, the rest are unaddressable by it. All `id-collision` diagnostics — first the frozen timeline's (element, tuplet, event and padding ids), then those from the beam fork — are appended after every other diagnostic, so they always land at the end of `LayoutResult.diagnostics`.

## Time: rationals internally, integer ticks at the boundary

- Inside the timeline and the layout pipeline: `Rational { n: number; d: number }` (`mnx/src/mnx/rational.ts`, re-exported as `Rational` from `@polyhymnia/mnx/mnx`), gcd-normalized. Exact arithmetic, no float epsilon bugs (`3 × triplet-eighth = 1 quarter` exactly).
- `mnx-score` converts every MNX note-value/tuplet/fraction to a `Rational` via `noteValueLength`/`tupletRatio` (`mnx/src/mnx/time.ts`) before any arithmetic, sums those rationals to get onsets and only rounds to integer ticks when producing timeline entries; the engine never redoes this.
- `options.divisions` (default 3360 = 2⁵×3×5×7) is a timeline option (`buildTimeline`, passed through `NotationOptions.divisions`), not document data — MNX carries no `divisions` field. 3360 divides evenly down to a 64th (needs 2⁴) crossed with triplets/quintuplets/septuplets; conventional 768/960 cannot represent a 64th-note septuplet exactly. `buildTimeline` rejects a non-positive/non-integer `divisions`, diagnostic `invalid-divisions`, and falls back to the default.

## Pickup and fullness rules

Every tick of a measure must be covered — the engine still enforces this, but the source of truth for "did the content fill the bar" is now MNX content itself, not a model-level fullness rule on input:

- **Pickup**: measure 0 only, when its longest content — measured across every part, staff and voice, ignoring whole-bar rests — is shorter than the meter → `TimelineMeasure.pickup = true`. Whole-bar rests don't rule a pickup out; shorter voices stay left-aligned. Its capacity is exactly whatever its longest content sums to — no padding, no diagnostic. Voices outside the layout scope are read silently for this rule, and their diagnostics are emitted only in scope. A pickup measure never restates the time signature on the following measure (that only happens on an actual time change).
- **Underfull** (a later measure shorter than its meter): the timeline pads with synthetic trailing rests (`m{i}.v{ordinal}.pad{k}`, `synthetic: true`; fewest notatable rest durations, ≤2 dots) and emits `measure-underfull` (warning).
- **Overfull** (longer than its meter): truncated at the barline and `measure-overfull` (error) — never a throw; malformed content degrades visibly in a live quiz rather than crashing it.

### Whole-bar rests

`sequence.fullMeasure` (or `event.rest` alone with no notes, drawn as the sole content) becomes `NormalizedElement.wholeBar: true`: always the single whole-rest glyph (`base: 'whole'`), regardless of meter, but its actual duration in ticks is the measure's real capacity — a 9/8 or 5/4 bar's whole-bar rest is 4.5 or 5 quarters long even though no `{base, dots}` combination can represent that exactly. the timeline divides the measure's remaining capacity evenly across however many whole-bar rests share the bar (normally one).

## Diagnostics

One shape everywhere (`mnx/src/mnx/read.ts`'s `Diagnostic`, re-exported from `@polyhymnia/mnx/mnx`):

```ts
interface Diagnostic {
  severity: 'warning' | 'error';
  code: string;
  message: string;
  measureIndex?: number;
  voice?: number;
  tick?: number;
}
```

Order in `LayoutResult.diagnostics`: `readMnx` and `invalid-divisions`, timeline structure, content, tempo and play-order unsupported, ties, fullness, time-affecting `mnx-unsupported`; then the engine's (`mnx-unsupported` for drawing, `invalid-key-signature`, `invalid-position`, `hairpin-end-unresolved`, `slur-target-unresolved`, `system-measure-unresolved`, `beam-*`, `tie-unplaced`, curves); then every `id-collision` — the timeline's, then the beam fork's.

Codes actually produced today (verify against `mnx-score/src/`, `normalize*.ts`, `vertical.ts`, `curves.ts` and `read.ts`; "Where" is the stage that emits the code: `timeline` = `mnx-score`, the rest are engine stages — this list is exact as of the current pipeline, not aspirational):

| Code | Severity | Where | Meaning |
| --- | --- | --- | --- |
| `mnx-invalid` | error | `readMnx` | The document isn't an object, or has no `mnx` key |
| `mnx-unsupported-version` | error | `readMnx` | `mnx.version` isn't the version this build supports |
| `mnx-unsupported` | warning | `timeline`, `normalize` | A recognized-but-unsupported construct, one per construct per measure (or per document): time-affecting ones (tempo, play order, note value, tuplet ratio, nested tuplets, tremolo, kit notes, unknown content) from `timeline`, drawing-only ones from `normalize` — see "Unsupported MNX" above |
| `no-parts` | warning | `timeline` | No `parts[0]`; nothing to lay out |
| `no-measures` | warning | `timeline` | `global.measures` is empty |
| `measure-count-mismatch` | warning | `timeline` | `parts[0].measures.length !== global.measures.length`; lays out `global`'s count |
| `missing-sequences` | warning | `timeline` | A part measure has no `sequences` array; treated as empty |
| `too-many-voices` | warning | `timeline` | More than 2 sequences in a measure; the rest are dropped |
| `invalid-divisions` | warning | `timeline` | `options.divisions` isn't a positive integer; falls back to 3360 |
| `invalid-time-signature` | warning | `timeline` | A measure's `time` isn't a valid `{count, unit}`; inherits the previous measure's |
| `invalid-key-signature` | warning | `normalize` | A measure's `key.fifths` is missing or not a finite number; inherits the previous measure's key |
| `invalid-duration` | warning | `timeline` | An event's `duration` has no readable `base`; the event is skipped |
| `invalid-pitch` | warning | `timeline` | A note's `pitch` is missing `step`/`octave`; drawn as C4 |
| `invalid-position` | warning | `normalize` (from `positionTick`) | A clef's or dynamic's `position.fraction` (or a hairpin's `end.position`) is unreadable (that clef or dynamic is dropped) or past the measure's end (clamped to the end) |
| `hairpin-end-unresolved` | warning | `normalize` | A `gradual` dynamic's `end.measure` doesn't resolve to a global measure id, has no valid `wedgeType`, or ends at or before its start; the hairpin is not drawn (its start `value` still is) |
| `tie-target-unresolved` | warning | `timeline` | `tie.target` doesn't resolve to a laid-out note id; the tie is ignored |
| `tie-target-not-adjacent` | warning | `timeline` | `tie.target` doesn't resolve to the next event of the same voice; drawn anyway |
| `slur-target-unresolved` | warning | `normalize` | `slur.target`/`startNote`/`endNote` doesn't resolve to a laid-out note/event id; the slur is not drawn |
| `system-measure-unresolved` | warning | `normalize` | A `systems[].measure` id doesn't resolve to a global measure; ignored |
| `id-collision` | warning | `timeline`, `normalize` (beams) | A synthesized positional id collided with an id already in use (disambiguated with a `~n` suffix), or the same explicit id was assigned to more than one laid-out element (first occurrence wins); includes beam ids, minted into the per-layout fork |
| `zero-length-element` | warning | `timeline` | An event's resolved duration is zero (or negative); skipped |
| `measure-underfull` | warning | `timeline` | A non-pickup measure doesn't fill its capacity; padded |
| `measure-overfull` | error | `timeline` | A measure exceeds its capacity; truncated at the barline |
| `beam-invalid` | warning | `normalize` | A `beams[]` entry references an unknown/cross-measure/cross-voice/non-beamable event, has fewer than two notes (after deduplicating repeated ids and dropping members at or past the measure's capacity), or reuses an event another beam already claimed; dropped |
| `beam-grouping-invalid` | warning | `normalize` | `options.beaming.beatGrouping[meter]` doesn't sum to the bar; falls back to the default table (`engraving.md`), once per meter |
| `mnx-unsupported` ("mixed stem directions in a beam") | warning | `vertical` | Two notes in the same beam group carry conflicting explicit `stemDirection`; the first one wins |
| `tie-unplaced` | warning | `curves` | A resolved tie's `from`/`to` note wasn't laid out (dropped upstream); no curve drawn |

## Pinned schema, examples, and updating

The MNX schema and its 52 official example documents are vendored at one pinned commit in `packages/mnx/schema/`:

```
schema/
  mnx-schema.json        # docs/mnx-schema.json at the pinned commit
  examples/<slug>.json   # docs/static/examples/json/<slug>.json, 52 files
  SOURCE                 # commit, commit date, schema $id, supported mnx.version
```

Never hand-edit any of these, or the generated `mnx/src/mnx/types.ts` (`json-schema-to-typescript` output, checked in, regenerated by `pnpm gen:mnx-types`) — `AGENTS.md`. Upgrade deliberately with:

```sh
pnpm mnx:update <commit>
```

which re-downloads the schema and examples at that commit, regenerates the types, and rewrites `SOURCE`. Type errors and the conformance test below show exactly what an upgrade touches. Upgrades happen on purpose (a new feature is needed, or on a rough monthly cadence), never automatically — the spec is still moving (renamed keys, enum casing changes, `measure-global.index` removed and the version bumped to 2 have all happened within the last year).

## Testing

- **Schema test** (`notation-engine/test/schema.test.ts`): every fixture in `notation-engine/test/fixtures/` validates against the pinned `mnx-schema.json` with Ajv (devDependency only — never in a runtime bundle, `AGENTS.md`).
- **Conformance test** (`notation-engine/test/conformance.test.ts`): runs all 52 vendored official examples through `layoutScore()`. Every one must lay out without throwing; each is asserted against an exact expected diagnostic-code list (`EXPECTED_CODES` in that file) — most produce `[]` or `['mnx-unsupported']`, a few hit `no-measures`/`system-measure-unresolved`/`measure-underfull`/`measure-count-mismatch`/`beam-invalid` for constructs described above. This is what actually proves the mapping table in this file, not the table itself — re-run it after any `normalize.ts`/`temporal.ts` change.
- **MNX↔engine mapping test** (`notation-engine/test/mnx-mapping.test.ts`): targeted cases for individual mapping rules (clef resolution, tie resolution, tuplet ratios, barline types, beam resolution/auto-beaming, …).
- **Pipeline test** (`notation-engine/test/pipeline.test.ts`) keeps its malformed-input cases as malformed MNX — feeding `normalize`/`temporal` documents missing fields, invalid divisions, too many voices, etc., and asserting the diagnostic degrade path rather than a throw.


## Grace notes

Each child event of a `grace` container becomes a zero-duration timeline entry with `kind: 'grace'` at the following main event's tick. It uses its reserved `m.s.e{k}` id, or its explicit id; following event ids are unchanged. `graceIndex` counts backwards from the main event: the closest grace is 1. `slash` defaults to true. The timeline also carries `graceType` for playback; when omitted, the performance policy uses `stealFollowing`.

Grace events and their notes are addressable and hittable. Answer-entry editing rejects a grace event with `intent-target-unsupported`; insertion slots remain attached to ordinary events. Grace-position targeting for clefs, dynamics and tempos remains unsupported.
