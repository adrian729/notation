# Public API

React components a consumer imports and writes. Internals: `architecture.md`, `engraving.md`, `interaction.md`, `playback.md`.

## Root component

```ts
interface NotationProps {
  score: MnxDocument;                 // mnx.md, required — plain MNX, no private fields (AGENTS.md)
  options?: NotationOptions;          // below, all fields default
  children?: React.ReactNode;         // compound children, below
  className?: string; style?: React.CSSProperties;
  onLayout?: (layout: LayoutResult) => void;   // architecture.md — declarative alternative to handle.getLayout()
}
```

```tsx
<Notation
  score={doc}
  options={notationOptions}
  className style
  ref={handleRef}          // NotationHandle
/>
```

Renders the `<svg>`, computes layout (`useMemo`, keyed on `score` identity), provides layout to compound children below. No `children` = static, non-interactive, read-only render.

## Compound children — interaction, playback

```tsx
<Notation score={doc} options={opts} ref={handleRef}>
  <Notation.Interaction targets={['slot', 'element']} onIntent={handleIntent} />
  <Notation.Marks states={states} selection={selection} preview={preview} />
  <Notation.Playback view={{ mode: 'notes', activeIds }} />
</Notation>
```

- `Notation.Interaction` props = `NotationInteractionProps` and `Notation.Marks` props = `NotationMarksProps` (both `interaction.md`). `Notation.Playback` props = `{ view: PlaybackView }` (`playback.md`) — implemented for `mode:'notes'`/`'cursor'`/`'off'`; `mode:'cursor'` draws the playback cursor (`playback.md`), takes an optional `position` (default tick 0) and optional `highlightActive`; `mode:'manual'` declares nothing (only `handle.setPlaybackTick` writes highlights).
- Render nothing themselves. `<Notation>` extracts their props via direct-child introspection (`React.Children`) — single render pass, no context round-trip. Must be direct children, same constraint as `<select><option>`.
- One of each meaningful; duplicate = last wins.
- Compound over flat props: pay only for what's used (no interaction code in the tree for a read-only reveal); a new behavior is a new child, not a bigger prop object.

## Imperative handle

```ts
interface NotationHandle {
  getLayout(): LayoutResult;
  getTimeMap(): TimeMap;
  setPlaybackTick(tick: number): void;
  exportSVG(): string;
  focus(id: NoteId): void;                        // NoteId — a plain string, mnx.md's ID rule
}
```

Implemented in `notation-react`: `getLayout`, `getTimeMap`, `exportSVG`, `setPlaybackTick` (drives note highlighting from `timemap.activeAt(tick)` and, when `mode:'cursor'` is mounted, moves the cursor via `timemap.positionAtTick(tick)`; imperatively, no re-render, no clock: the app calls it each frame; the last imperative tick survives parent re-renders until layout or mode changes; ignored in `notes` and `off` modes), `focus` (focuses the element `<g>` by id via the same ref map `setPlaybackTick` uses; no-op if the id has no on-screen element). Hit-testing isn't a handle method — callers import `hitTest` from `@polyhymnia/notation-engine` and call `hitTest(handle.getLayout(), p, opts)` directly (`interaction.md`).

## Options

One nested typed object, not flat props. Same type on the React prop and `layoutScore(doc, options)` (`architecture.md`) — one options surface, not two.

```ts
interface NotationOptions {
  divisions?: number;                                                                // mnx.md, default 3360 — engine option, not document data
  spacing?: { k?: number; base?: number };                                          // engraving.md, default k=0.55 base=3.2sp
  beaming?: { mergeBeats?: boolean; beatGrouping?: Record<string, readonly number[]> }; // engraving.md; the engine reads this for its own auto-beaming (a measure with no explicit MNX `beams`)
  accidentals?: {
    courtesyPolicy?: 'none' | 'next-measure' | 'always';                            // default 'next-measure'
    parenthesizeCautionary?: boolean;
    insertAlteration?: 'key' | 'natural';                                            // interaction.md, default 'key'
  };
  tuplets?: { showRatio?: boolean };         // engraving.md, default false — numeral shows actual only
  widthSp?: number;                          // system width, engraving.md
  maxLastSystemFill?: number;                // default 0.65, engraving.md
  font?: NotationFont | readonly NotationFont[]; // font.md "Runtime" — SMuFL font data from @polyhymnia/notation-fonts, tried in order, then the style's default font
  style?: 'modern' | 'mensural';             // font.md, default 'mensural' — glyph table + stem policy, independent of the font
}
```

Every field defaults; `<Notation score={doc}>` alone is valid.

## Authoring scores

`score: MnxDocument` is the only source of truth — no private extensions, no JSX-per-note composition (`<Note pitch="C4"/>` as a real content element). A note can't render standalone: layout needs the whole score for spacing/beaming, so a per-note component would just be a non-rendering data-collection shim — a second implicit data model reconciling into MNX anyway, for no benefit. There is no builder API; MNX content comes from one of three places:

1. **Hand-written `.mnx.json`** — the natural form for fixed exercise content. `apps/web/src/scores/*.mnx.json` is both the demo gallery's content and the reference for what hand-authored MNX looks like; every file there is validated against the pinned schema by the same Ajv test `mnx.md` describes for fixture files.
2. **Generated in code** — the app's presets (below) and any future content generator construct plain MNX object literals; `music-theory`'s `parsePitch` and `mnx`'s `Rational`/`noteValueLength` (`mnx.md`) are the only package helpers, and no package ships a `score()`/`measure()`/`note()` builder layer (an app-private helper that returns plain MNX, like `mnxBuild`, is fine).
3. **MusicXML import, offline** — `tools/musicxml-to-mnx convert <in.musicxml> <out.mnx.json>` converts MusicXML exported from notation apps (MuseScore/Dorico/Sibelius) into committed `.mnx.json` files, the same way hand-written scores are committed: convert (npm `musicxml-to-mnx`, pinned, converter warnings printed) → Ajv against the pinned schema (`tools/musicxml-to-mnx/src/check.ts`) → deterministic ids assigned to events/notes that lack them (`src/ids.ts`) → write. The render check (`layoutScore`, no errors, no unexpected `mnx-unsupported`) runs over the committed scores in the app and playground tests. `tools/musicxml-to-mnx/SPIKE.md` is a historical record of the superseded `mnxconverter` spike. Not a runtime import path — no product flow needs a user uploading a file at this point, so none is built (`AGENTS.md`).

Editing existing content (not authoring it fresh) goes through `applyIntent` (`interaction.md`), which is also a pure MNX→MNX function and preserves whatever content it doesn't touch.

## Presets

The presets live in the app (`apps/app/src/components/presets/`: `NotesReveal`, `ScaleReveal`, `mnxBuild`, `fittingMeter`, `durationKey`; demos at route `/presets`), not in `notation-react` — there is no `@polyhymnia/notation-react/presets` export. They are thin wrappers around `<Notation>` for the single-exercise case — not a scoped feature of their own (`README.md`), just sugar that builds a small MNX document from a few typed props with `mnxBuild`, an app-private helper that returns plain MNX. The "no builder API" rule applies to packages only (`AGENTS.md`).

```ts
interface NotesRevealProps { pitches: readonly PitchToken[]; mode: 'melodic' | 'harmonic'; clef: ClefKind; duration?: NoteValue; labels?: readonly string[] }   // duration default { base: 'quarter' }; labels[i] is shown centred under the i-th drawn event, in a row of reserved height below the staff
type ScaleName = 'major' | 'naturalMinor' | 'harmonicMinor' | 'melodicMinor';
interface ScaleRevealProps { root: PitchToken; scale: ScaleName; clef: ClefKind; descending?: boolean; duration?: NoteValue }   // default { base: 'quarter' }
```

- `NotesReveal` width is one rule for every use: the measure is laid out at its natural content width (`widthSp: 1` first pass) plus a fixed 12sp slot per drawn event (`maxLastSystemFill: 1`), rendered at the same staff scale as a 65sp-wide layout filling the container (capped at the container width) and centred. `labels` add no layout branch; each label is positioned from the resulting layout.
- `PitchToken` — the same `'C4'` / `'F#5'` / `'Bb3'` string grammar `parsePitch` (`@polyhymnia/music-theory`) accepts; the presets parse it internally to an MNX `pitch` object.
- `ClefKind` — `'treble' | 'bass' | 'alto' | 'tenor'`, the engine's resolved clef kinds (`engraving.md`); presets translate this to the MNX `{sign, staffPosition}` pair `mnx.md`'s clef mapping table expects.
- `duration` — an MNX note value, `{ base: NoteValueBase; dots?: number }` (`mnx.md`), not a token string — same shape a hand-written `.mnx.json` event's `duration` would use.

`descending: true` with `scale: 'melodicMinor'`: uses the classical descending form (natural-minor pitches, lowered 6th/7th) — a genuinely different pitch set from the ascending form, not the same notes reversed. Every other `scale` value: `descending` reverses the same (ascending) pitch set, since only melodic minor has direction-dependent content.

```tsx
<NotesReveal pitches={['C4','E4','G4']} mode="harmonic" clef="treble" />
<NotesReveal pitches={['C4','E4']} mode="melodic" clef="treble" />
<ScaleReveal root="D4" scale="major" clef="treble" />
```
