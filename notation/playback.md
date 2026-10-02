# Playback position

The component never touches `AudioContext`, never schedules, never owns a clock. It accepts a position and paints.

**No clocks, as a rule:** the notation packages never run clocks, timers, `requestAnimationFrame`, Web Audio, or time events. The app owns time and tells the notation where playback is; the notation only computes what to show. Everything below — timeline conversions, `Playback` views, cursor motion — is driven by app-supplied position, never by internal timing.

## Timeline: the shared source of truth

Musical time lives in `@polyhymnia/mnx-score` (`architecture.md`). `buildTimeline(doc, {scope?, divisions?})` computes exact onset ticks, durations, ids and midi for every element once; layout and sound both consume it, so dotted-note arithmetic, tuplet scaling, tie merging and pickup handling have one implementation.

```ts
interface Timeline {
  divisions: number;
  entries: readonly TimelineEntry[];      // one per written note, chord, rest, full-measure rest or space (padding rests are synthetic)
  ties: readonly TimelineTie[]; measures: readonly TimelineMeasure[];
  tempo: readonly TempoSegment[];         // piecewise-constant, from global.measures[].tempos
  playOrder: readonly PlaySegment[];      // unrolled repeats/voltas/jumps, tempo-independent
  diagnostics: readonly Diagnostic[]; ids: TimelineIds;
  activeAt(tick: number): readonly NoteId[];   // written spans — a tie continuation lights on its own, not the tie head
  byId(id: NoteId): TimelineEntry | undefined; // entry ids and note ids
  writtenTickToSeconds(tick: number, tempo?: TempoOverride): number;
  secondsToWrittenTick(seconds: number, tempo?: TempoOverride): number;
}
interface TimelineEntry { id; kind; part; staff; voice; measureIndex; tick; durationTicks; notes: readonly { id; pitch; midi; tie: {start; stop} }[]; … }
interface PlaySegment { fromTick: number; toTick: number; playedStartTick: number }   // written ticks, in play order
```

Every id is an MNX id (`mnx.md`'s ID rule): the document's own `id` when present, else a deterministic positional id. The same ids key the rendered `<g>`s, so `activeAt` resolves to drawn elements; an app driving highlight off content it authored itself must give that content real MNX ids to get a stable target.

Which timeline: `layout.timeline` (or `handle.getTimeline()`) is the default-scope timeline the layout drew, for cursor sync; `buildTimeline(doc, {scope: 'all'})` covers every part, staff and voice for whole-score playback. Ids inside the default scope are identical in both. Where an entry was drawn comes from `layout.placements` and `positionAtTick(layout, tick)` (`@polyhymnia/notation-engine`).

## How the audio engine uses it

Scheduling — `performance(timeline, {tempo?})` from `@polyhymnia/mnx-score` turns the timeline into sound events, so the audio engine does no musical arithmetic:

```ts
const timeline = handle.getTimeline();
const { events, tickAtSeconds } = performance(timeline);   // { id, midi, startSeconds, durationSeconds }[]
const playback = player.play(events.map((e) => ({ id: e.id, midi: e.midi, start: e.startSeconds, duration: e.durationSeconds })));
```

Reporting — audio time → notation time, driven by the *audible* clock:

```ts
function frame() {
  handle.setPlaybackTick(tickAtSeconds(playback.time()));
  raf = requestAnimationFrame(frame);
}
```

**Latency contract:** the position fed to the component MUST derive from `audioContext.currentTime` (`playback.time()` already subtracts output latency), never the scheduler's lookahead pointer. Web Audio lookahead queues 100–200ms ahead; driving the cursor from "what was last queued" makes it visibly run ahead of the sound. Second 0 = when the first note actually sounds; lead-in is the caller's problem, not the component's.

## Repeats and jumps

Layout stays in written order; nothing is duplicated or moved. `timeline.playOrder` lists the written-tick segments to play, in order, with repeats, voltas (`ending`) and jumps (`segno` / `dsalfine` with `segno` and `fine`) unrolled and contiguous runs merged; a score with no such constructs yields one segment. A repeat plays `max(times, highest ending number in the ending group at that repeat)` passes, so `1, 2, 3` endings play three times. Each segment carries `playedStartTick`, its start on the unrolled timeline. `performance` offsets each segment by the summed seconds of the earlier ones, and its `tickAtSeconds` maps the unrolled clock back to a written tick for `activeAt` / `positionAtTick`.

Sound generation lives in `packages/web-audio` (`audio.md`).

Tie-merged sounds can straddle a segment boundary (a note tied across a repeat barline). `performance` clips: it schedules a merged note in a segment only when its start is in `[fromTick, toTick)` and clamps its duration to `toTick`. Tempo lookups use written ticks, so tempo changes inside a repeated section apply on every pass, and a tempo mark in a later measure does not carry back into an earlier one on a backward jump. After a jump, repeats and endings are not taken again. A `segno` or `fine` without a jump, and an `ending` without `numbers`, are ignored (written order, no diagnostic). Written order plus an `mnx-unsupported` diagnostic is the fallback for: nested repeats, endings combined with jumps, multiple jumps (or multiple segnos/fines alongside a jump), a jump without a preceding segno, a `dsalfine` without a following fine, a mid-measure jump, an invalid jump, and a repeat structure too long to unroll.

## Tempo

Lives in the MNX document, not the audio engine — a metronome mark is notation data. `global.measures[i].tempos[]` (`mnx.md`) is the source; the timeline resolves each entry's `location.fraction` (an offset from that measure's start) to an absolute tick and its `value` to a beat unit:

```ts
interface TempoSegment { tick: number; seconds: number; bpm: number; beatUnit: { base: NoteValueBase; dots: number } }   // ramps deferred
interface TempoOverride { bpm: number; beatUnit?: { base: NoteValueBase; dots?: number } }   // one constant tempo; beatUnit default: a quarter note
```

A `tempos` entry whose `value` uses a note-value base the timeline doesn't support falls back to a quarter-note beat unit + `mnx-unsupported` (`mnx.md`).

`writtenTickToSeconds` = a prefix-sum lookup over the tempo segments, O(log n); with an override the map for that call is a single segment at the override's rate.

Both conversions, and `performance`, take an optional `TempoOverride`: a single constant tempo replacing the document's tempo map for that call. The document's `global.measures[].tempos` stay the default when it is omitted. This is what a user-adjustable practice tempo needs — the conversions are pure per-call functions, so a tempo slider re-points playback without re-rendering or re-laying out anything, and `timeline.tempo` keeps reporting the document's map. Still no clocks: the app converts its own elapsed audio time and hands the notation a position.

## Modes

```ts
type PlaybackView =
  | { mode: 'off' }
  | { mode: 'notes'; activeIds: readonly NoteId[] }
  | { mode: 'cursor'; position?: {tick:number}|{seconds:number}; highlightActive?: boolean }
  | { mode: 'manual' };   // no declared output; only handle.setPlaybackTick writes highlights
```

`notes` is the common case — a `Set` membership check written imperatively onto each element's `<g>` ref, `data-pn-playing="true"` on matches. Costs nothing (a chord-ID quiz playing four notes is the whole feature). Implemented (`notation-react`, plan `phase3-rhythm.md` step 7a): `<Notation.Playback view={{mode:'notes', activeIds}} />` for the declarative case, or `handle.setPlaybackTick(tick)` to derive the same highlight from `layout.timeline.activeAt(tick)` without a `Playback` child. `activeAt` looks up each written note/chord's own span — so a tied continuation lights when playback reaches it, and the tie start unlights; `performance` still merges ties, so the sound is one note across the tie. `cursor` is continuous playback: `<Notation.Playback view={{mode:'cursor', position}} />` renders the cursor at `positionAtTick(layout, tick)` (`position` is optional and defaults to tick 0, so imperative-only driving works; `{seconds}` is converted with the timeline's `performance().tickAtSeconds`, correct with repeats); `highlightActive: true` also derives the `data-pn-playing` set from `layout.timeline.activeAt(tick)`. Scroll-follow is not built; the app scrolls itself using `positionAtTick`. With a practice tempo, the app converts its elapsed time with `performance(timeline, {tempo}).tickAtSeconds(seconds)` and passes the resulting `activeAt` ids in `notes` mode.

`positionAtTick` interpolates piecewise-linearly between column x positions, timed so the cursor reaches column *i* exactly when it sounds — NOT time-proportional, since spacing follows the power law in `engraving.md` and proportional motion would drift off the noteheads for mixed durations.

## 60fps cursor without re-rendering the score

The app owns time and calls `handle.setPlaybackTick(tick)` each frame (from its own rAF, derived from `audioContext.currentTime` per the latency contract above). The handle writes the cursor rect's `x`/`y`/`height` and `data-pn-system` directly on the React-owned `<g data-pn-cursor>`, plus `data-pn-playing` on elements. No React render, no node creation, so no StrictMode hazard and the `architecture.md` rule holds. The notation package runs no clock and no animation (no WAAPI, no rAF, no `animateCursor`). The declarative `position` prop is the initial and low-frequency position: the first render places the cursor synchronously from `positionAtTick` (so `renderToString` emits `x`/`y`/`height`), and placement is a layout effect, so no stale frame after re-layout. Once `setPlaybackTick` has been called, that tick wins over `position` across parent re-renders (hover/select re-renders do not move a paused cursor) until the score/layout or the mode changes. Highlights follow one rule: written by `setPlaybackTick` or declared position only for `mode:'cursor'` with `highlightActive`, for `manual`/no `Playback` child, and by `activeIds` in `notes` mode (which ignores `setPlaybackTick`). The cursor is pure output of layout + tick: it is not in `LayoutResult`, has no hitbox, and does not affect ids or layout. It is hidden when `positionAtTick` returns null (empty score).

## Presentation

CSS only. The component emits `<g data-pn="cursor" data-pn-cursor><rect/></g>` spanning the system's staff height (0.3 sp wide, `visibility="hidden"` until positioned); `packages/notation-react/styles/notation.css` gives it `--pn-cursor` / `--pn-cursor-opacity`, and the app can restyle via `[data-pn-cursor]`. `mode:'notes'` only sets `data-pn-playing` — styling is entirely the app's call (`architecture.md` theming contract).
