# Feature-based package split: final plan

## Context
The codebase is organized by history, not by feature, so its pieces can't be reused in other apps:
- The model mixes generic MNX with engine policy.
- Timing lives inside layout.
- Music theory is spread across the model, engine, react, audio and the app.
- The converter depends on our engine.
- Fonts are compiled into the engine.

Goal:
- Standalone packages organized by feature (a score viewer or editor, other renderers or engines, a generic converter), grouped into repos by what changes together, published on public npm.
- A small dependency guard: a pre-commit check of the package graph against an allowlist file the user edits, an AGENTS.md rule.
- Music fonts that can be swapped, in any common format.

The design went through five audit rounds × three auditors (Opus high, Sonnet high, Opus medium), each finding verified against the code. The execution section is written for parallel subagents with strict file ownership, so merging can't revert anyone's work.

User-settled decisions:
- feature packages;
- `music-theory` built by refactoring existing theory;
- `mnx-score` owns the musical timeline;
- the schema ships in `mnx` (examples excluded);
- the guard is a small pre-commit check of the package graph, bypassed by editing its allowlist, built last so it doesn't block the split;
- swappable fonts.

---

# Part 1: Design

## Packages (`@polyhymnia/*`)
| Package | Owns | Depends on |
|---|---|---|
| `music-theory` | Pitch, intervals, chords, scales, keys | — |
| `mnx` | `.`: types, `readMnx`, rational, duration, scoped addressing, `assignIds`, `Diagnostic` (`voice: number`). `./edit`: `applyIntent` (with a part index), cleanup. `./schema` | — |
| `mnx-score` | Timeline, `performance()` | mnx, music-theory |
| `notation-fonts` | Glyph tables per style, default fonts and metadata, `fontFaceCss()`, pipeline (`requirements.txt`), licences | — |
| `notation-engine` | Engraving on top of the timeline, beaming policy, hitTest, slots, preview, `placements`, `positionAtTick` | mnx, mnx-score, music-theory, notation-fonts |
| `notation-react` | `Notation` SVG renderer, interaction, marks, playback display, styles, per-glyph font | engine, mnx, mnx-score, notation-fonts |
| `web-audio` | Clip/NoteEvent, synth, sampler, scheduler, unlock. MIDI numbers only. `Clip = {events, durationSeconds}` | — |
| `musicxml-to-mnx` | Library + CLI, Ajv validation against the `mnx` schema, `assignIds` | mnx, npm `musicxml-to-mnx` (stalmok, MIT), pinned behind `convert()` |
| app | Quiz mechanics, RNG, instruments, presets (`NotesReveal`, `ScaleReveal`, `mnxBuild`, `fittingMeter`, `durationKey`), ornaments page, render check | all, from npm |
| playground (`apps/web`) | Notation demos (the preset demos move to the app) | engine, react, mnx, mnx-score, music-theory, web-audio |

**Repos:**
1. `notation`: mnx, mnx-score, notation-fonts, engine, react, playground. Versioned with changesets.
2. `music-theory`
3. `web-audio`
4. `musicxml-to-mnx`
5. app

## Ids (`mnx`)
- **Scope.** `elementIds(doc, scope)`, with `scope = {parts?, staves?, maxVoices?}`.
  - The default scope is today's: part 0, staff 1, the first 2 kept sequences.
  - `ElementPosition` gains `part` and `staff`.
- **Id format.**
  - Inside the default scope, generated ids keep today's form (`m{i}.s{j}.e{k}`, `.full`, `.t{k}`, `.n{k}`).
  - Outside it they get a composed prefix `p{n}.st{k}.`, with parts other than 0 and staves other than 1 each named.
  - A third or later sequence is already distinct through `s{j}`.
- **Reservation and walk order.**
  - Explicit ids are reserved over the whole document.
  - The walk always does the default scope first, so ids inside the default scope never depend on the requested scope.
- **Minting authority.**
  - The timeline builds one `ElementIds` per document. It mints elements first, then padding rests, with `mint(candidate, ctx {measureIndex, voice?, tick?})`, then **freezes** it.
  - Explicit beam ids go through `registerExplicit` (today `normalize-reader.ts:86-97` handles them separately).
- **Beams.**
  - Each `layoutScore` call mints beams into `ids.fork()`, a child built from a copy of `taken`. Re-layouts stay idempotent and beam ids never get `~2` (the AGENTS id-stability rule).
  - Today beams are minted before padding. The two candidate forms can't collide, so ids stay identical.
  - Beam collisions are now reported. Today they are dropped (`normalize.ts:213`), so this is a documented bug fix.
- Tie ids (`${from}.tie`) and slur ids stay derived, as today.

## Timeline (`mnx-score`)
- `buildTimeline(doc, {scope, divisions})` returns the timeline, including a read-only `ids` (`idAt`, `nodeOf`, `has`, `fork`).
- **Pickup and capacity.**
  - They are measure-wide: they read every voice of every part and staff. Voices outside the scope are read silently, and their diagnostics are emitted only in scope.
  - Pickup = the longest content in measure 0 that is shorter than the meter and isn't a whole-bar rest. Whole-bar rests don't rule a pickup out. Shorter voices stay left-aligned, as today.
  - A documented change from `normalize.ts:183-187`, pinned by tests.
- **Entries.** Each entry carries:
  - `id`, `kind` (note, chord, rest, fullMeasureRest, space), `part`, `staff`, `voice` (ordinal), `eventIndex`, `measureIndex`;
  - `tick`, `measureTick`, `duration` (as a Rational and in ticks), `base`, `dots`, `tuplet {id, actual, normal, display}`, `wholeBar`, `synthetic`, `restPosition`;
  - `notes[{id, pitch (MNX), midi, tie {start, stop}}]`.
- **Ties.** `{id, from, to, side}`.
- **Measures.** `index`, `startTick`, `endTick`, `time {beats, beatType, symbol}`, `pickup`, `capacity`.
- **Also:**
  - tempo segments, play-order segments;
  - `activeAt`, `byId`;
  - `writtenTickToSeconds`, `secondsToWrittenTick`.
- **Padding rests** have `synthetic: true` and id `m{i}.v{ordinal}.pad{k}`, with the prefix outside the default scope. Ordinal is counted per part and staff, per measure, which equals today's `voiceIndex`.
- **The engine** joins its own data to entries by id and never re-parses pitch or time. It owns:
  - staff positions (from pitch, clef and `restPosition`);
  - stems, accidental display, beaming, brackets, breaks.
- **Diagnostics, merged in a fixed order:**
  1. `readMnx`, `invalid-divisions`.
  2. Timeline:
     - `no-parts`, `no-measures`, `measure-count-mismatch`, `missing-sequences`;
     - `invalid-time-signature`/`-pitch`/`-duration`, `too-many-voices`;
     - tempo and play order, each with its `mnx-unsupported`;
     - ties, `measure-underfull`/`-overfull`, `zero-length-element`;
     - time-affecting `mnx-unsupported`: unsupported note value (event skipped), unsupported tuplet ratio (laid out untupled), nested tuplets (flattened), grace, tremolo (blank time), kit notes or empty events (become space), unknown content.
  3. Engine:
     - `mnx-unsupported` for constructs it doesn't draw, e.g. 3+ dots drawn as 2, part names;
     - `invalid-key-signature`, `slur-target-unresolved`, `system-measure-unresolved`, `beam-*`, `tie-unplaced`, curve diagnostics.
  4. Every `id-collision`: the frozen timeline's ids, then the beam fork.

  `intent-*` belongs to `./edit`, outside layout. The goldens with diagnostics each contain a single code, so the new order doesn't change them. The golden check still compares diagnostics per code, as multisets.
- **`layoutScore(doc, opts)`**
  - builds the default-scope timeline internally (memoized per document and divisions) and forks its ids for beams;
  - returns `layout.timeline` and `layout.placements`: per entry `{x, y, systemIndex}`, per measure `{systemIndex, x, w}`;
  - `positionAtTick(layout, tick)` uses placements and `layout.systems`.
- **`Notation`** keeps `{score, options}` and gains `getTimeline()`.
- **Audio.**
  - `performance(timeline, {tempo})` returns `{events, durationSeconds, tickAtSeconds}`.
  - Use `layout.timeline` for cursor sync.
  - For whole-score playback, use `buildTimeline(doc, {scope: 'all'})`. Its ids match the layout's; notes outside the layout just get no cursor.

## Theory (`music-theory`)
- **Pitch output.**
  - `parsePitch` returns an MNX `Pitch` (`alter` omitted when 0).
  - `parseSpelledPitch` replaces `tokenPitch` (5 uses).
  - Spelling functions return `SpelledPitch`, with `alter` always present. `toMnxPitch` strips it at MNX boundaries.
- **Pitch functions:**
  - from the model's `pitch.ts`: `parsePitch`, `pitchToMidi`, `STEP_LETTERS`, `stepNumberOf`;
  - new: `formatPitch`, `pitchClass`, `enharmonicAlternate`, `chromaticRange`;
  - `PREFERRED_ROOT_PITCHES`, and `midiToPitch(midi)` as a plain table lookup;
  - `midiOf` (throws on bad input) and `tryMidiOf` (returns `undefined`). They replace audio's `midiOfPitch`, `tokenMidi` and `midiOfToken`;
  - the app's `range.ts` re-exports are updated.
- **Seeded randomness.**
  - The app keeps `midiToPitchRng(midi, rng)`, which still consumes exactly one `rng()`. It has five call sites: `tones.ts:97`, three generators, and `chord-identification/generator.ts:54`.
  - The `pitchAbove` fallback with `() => 0` (`tones.ts:92`) must equal the table lookup.
  - A one-off script compares the first 200 questions per seed for every generator, before and after.
- **Intervals:**
  - the interval table;
  - consonance classes, computed on the simple reduction so compounds get a class;
  - simple/compound;
  - `intervalBetween` → `{degree, quality, semitones, direction}`, including unison and descending;
  - `intervalDisplayName`, `intervalIdDisplayName`;
  - `transpose` (from `pitchAbove` + `spellAtDegree`);
  - `spellRelative`, `IntervalSpec`, `widestSemitones`.
- **Chords.** The quality table, `chordById`, `isChordId`, `chordSpan`.
- **Scales and keys:**
  - `ScaleName`, `scalePitches`, `scaleFifths` (clamped to ±7);
  - sharp and flat order, `keyAlterations(fifths)`, `keyAlterOf(fifths, step: StepLetter)`.
- **Stays in the app:**
  - `PlayingMode`/`direction`, `toTones`/`buildTones`/`withinRange`/`randomRootInRange`, `rangeForIntervals`;
  - family UI order, `CHORD_SETS`, catalog/session/store/lessonFlow;
  - `clefForMidis`, the RNG utilities, `midiToPitchRng`, `scaleKey`.

## Fonts
- **A font is data:** `{name, metadata (SMuFL JSON), src}`.
  - The caller loads it before layout. `layoutMemo` keys on the font object.
  - `resolveGlyph(name)` returns a font index and its metadata. Every metric lookup goes through it: the ~53 call sites in `vertical`, `horizontal`, `tuplets`, `beams`, `curves`, `emit` and `preview`, plus the global `engravingDefaults` (`metadata.ts:63`).
  - Test: a synthetic font with doubled advance widths reflows the layout.
- **Style ≠ font.**
  - A style is a glyph map, a stem policy (`vertical.ts:696-712`) and a `data-pn-style` CSS hook.
  - Mensural stays the default style.
  - Each style has a set of core glyphs and a set of optional ones.
- **Fallback.**
  - `LayoutResult.fonts` and `GlyphRun.font` are omitted when a single font is used, so goldens stay unchanged.
  - React sets the font family on each `<text>`, preview glyphs included.
- **Pipeline (`font:add`).**
  - Inputs: OTF, TTF, WOFF or WOFF2, with or without metadata.
  - Without metadata:
    - fonttools reads units and converts them as units ÷ unitsPerEm × 4 staff spaces;
    - missing anchors fall back to the notehead edge (`vertical.ts:655-658`);
    - missing defaults are inherited from the default font.
  - Legacy fonts need a `mapping.json`. They are re-encoded to SMuFL codepoints and calibrated on the `noteheadBlack` height.
  - The TrueType and CFF renaming fixes `rename_and_compress.py:18`.
  - The reserved font name is parsed from the OFL; if there is none, the original name is kept.
  - Each font gets its own NOTICE.
- **`font:verify`.** Checks core coverage per style, cmap against metadata, the reserved font name and the licence, and renders a test sheet.
- **Recipe.** Extend `notation/font.md`.
- **Proof.** Add Leland and a TrueType font without metadata, using only `font:add`. One golden.

## Guards (last phase, small)
- `.githooks/pre-commit` runs a small node check: each package's `@polyhymnia/*` dependencies must equal its entry in `.githooks/deps.json`; otherwise the commit stops with "Dependency chain change. Ask the user."
- The user bypasses it by updating `deps.json` in the same commit.
- Enabled by the root `prepare` script (`git config core.hooksPath .githooks`).
- AGENTS.md rule: never edit `.githooks/**`, use `--no-verify` or change hook config; hook fails → stop and ask the user.
- Nothing else: no lockfile or lifecycle checks, no env overrides, no CI verification.

---

# Part 2: Execution

## Roles
- **Coordinator** (main session):
  - owns every shared file;
  - writes the scaffold and contract commits;
  - merges streams, regenerates goldens, updates docs and AGENTS.md, runs the full verification.
- **Streams**: subagents, each in its own worktree with an explicit **ownership list**.
- **User**:
  - sets up repo settings and publishing;
  - approves edits to the OpenCode global config;
  - copies the guard hook into the new repos (Phase H).

**Shared files, which only the coordinator touches:** every `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig*.json`, package barrels (`src/index.ts`, entry files), `AGENTS.md`, `notation/*.md`, `docs/**`, `test/golden/**`, CI and hook files.

## Merge protocol (prevents lost and reverted work)
1. **Phase base.** Each phase starts from a tagged base, `split/<phase>-base`. Every stream branches from it:

   ```
   git worktree add .worktrees/<stream> -b split/<phase>-<stream> split/<phase>-base
   ```

   No stream reuses an old branch, and none starts from a stale base.
2. **Contracts first.** Before streams start, the coordinator commits the new types and signatures as stubs, plus manifests, barrels and exports. Streams code against a fixed interface and never touch manifests.
3. **Stream rules** (pasted into every stream prompt):
   - Modify only files in the ownership list.
   - Stage with explicit paths, never `git add -A`.
   - Run prettier only on owned files.
   - Never run `git checkout`/`restore`/`reset`/`stash` on non-owned paths.
   - Never regenerate goldens.
   - Never rebase or force-push.
   - If you need a change outside the ownership list, stop and report it.
4. **Ownership check before merging:** `git diff --name-only split/<phase>-base...split/<phase>-<stream>` must be a subset of the stream's ownership globs. Anything outside gets the stream rejected and redone, never hand-patched.
5. **Merging:**
   - Merge one stream at a time with `git merge --no-ff`.
   - After each merge: `pnpm -r typecheck` and `pnpm test -- --reporter=dot`.
   - Conflicts can only occur in coordinator files. Resolve them by hand; never use `-X ours`/`-X theirs` or whole-file checkout.
6. **Integration commit** after all streams in the phase: docs, AGENTS.md, goldens (via the reshape or diff script, then reviewed) Then tag the next base and delete the phase worktrees.
7. **Same-phase rule:** streams in the same phase own disjoint files. A file can belong to a later phase, never to two streams at once.

## Phases
Phases run in sequence. Streams within a phase run in parallel.

**Phase 0: Housekeeping.** Coordinator and user, sequential.
- Done: npm scope `@polyhymnia` (org created, owner `ranx729`); piano removed from `instruments.ts`; `apps/app/public/samples/CREDITS.txt` (Philharmonia).
- Done: evaluated npm `musicxml-to-mnx` (stalmok, independent project since 2026-07-19). On the LilyPond MusicXML suite (165 files) it throws on 6 (all deliberate: composite meters MNX can't state, one malformed chord) vs `mnxconverter` 19 crashes; 0 schema failures vs 3; same pitched notes on the 140 files both convert, and it keeps lyrics, multi-staff parts and beams that `mnxconverter` drops. Decision: replace `mnxconverter` (and its patch and the planned fork) with it. No upstream issue.
- Samples re-processed (trim, normalise, fade, re-encode) so they are not redistributed as is.
- Commit the housekeeping.

**Phase A: Scaffold.** Coordinator, single commit, user-approved.
- Rename `notation-model` → `mnx` mechanically across the repo: package, imports, the root `mnx:update` script, docs.
- Create empty `music-theory`, `mnx-score` and `notation-fonts` packages: manifests, tsconfig, empty barrels, workspace deps, lockfile.
- Add the `mnx` `./edit` export and remove the examples from `files`.

**Phase B: parallel.**

| Stream | Owns | Work |
|---|---|---|
| B1 mnx | `packages/mnx/src/**` except `mnx/pitch.ts`; `packages/mnx/test/**` except `mnx-pitch.test.ts`; `packages/notation-engine/src/layout/beam-policy/**` (new); import lines in `normalize-beams.ts` and `tuplets.ts` | Scoped `elementIds` with frozen/fork/`registerExplicit`/`mint(ctx)`, purely additive: the existing API keeps working until Phase E, so the engine still compiles. `applyIntent` with a part index, `Diagnostic.voice: number`, `./edit` split, move `meter.ts`/`beam.ts` → engine `beam-policy` |
| B2 presets | `packages/notation-react/src/presets/**` (delete); `apps/app/src/components/presets/**` (new); preset callers in `apps/app/src/**` and `apps/web/src/**` (listed files) | Move presets plus `mnxBuild`/`fittingMeter`/`durationKey` to the app; move the preset demos |
| B3 theory core | `packages/music-theory/src/**`, `packages/music-theory/test/**` | Implement the Theory API by porting code. Callers stay untouched in this phase |
| B4 fonts pipeline | `packages/notation-fonts/**` (minus manifest/barrel), `packages/notation-font/**` (delete after port) | Pipeline (any format, renaming, reserved font name, per-font NOTICE, mapping), `requirements.txt` (coordinator commits it), glyph tables per style, `font:verify` |

Ownership adjustments (as launched):
- B1 may add to the `mnx` barrels but never removes an export; it also owns `packages/notation-engine/test/beam-policy.test.ts` (moved from `mnx-beam.test.ts`). The mnx `meter.ts`/`beam.ts` copies and their exports stay until integration.
- B2 also owns the preset tests in `packages/notation-react/test/notation.test.tsx`, new app preset tests, and the app demo page (plus `routeTree.gen.ts` if it adds a route). `mnxBuild` stays an app-private helper returning plain MNX; the "no builder API" rule is scoped to packages.
- B3 and B4 own their package barrels (no other stream touches them).
- Contract commit before B: the app depends on `notation-engine` (the presets use `layoutScore` instead of react's internal `memoLayout`).

Integration B:
- Remove `beamGroups`, `beatGroupingFor`, `BeamableEvent` and the edit re-export from `mnx` `.`; delete mnx `meter.ts`/`beam.ts`; switch `applyIntent` callers to `@polyhymnia/mnx/edit`.
- Remove the `./presets` export from `notation-react`.
- Apply the streams' manifest, `.gitignore` and script requests; docs; the seeded-sequence baseline capture (before C3).

**Phase C: parallel.** The coordinator first commits the contracts: `NotationOptions.font`/`style`, `GlyphRun.font`, `LayoutResult.fonts`, the `resolveGlyph` signature.

| Stream | Owns | Work |
|---|---|---|
| C1 engine fonts | `packages/notation-engine/src/font/**`, `layout/{vertical,horizontal,tuplets,beams,curves,emit,justify,break}.ts`, `query/preview.ts` (including its theory import), `options.ts` | Resolver, font context threading, styles, fallback, synthetic-font test |
| C2 react fonts | `packages/notation-react/src/**`, `packages/notation-react/styles/**`, new `packages/notation-react/test/fonts*.test.tsx` (existing react tests belong to C3), `apps/web/src/{font.tsx,FontComparison.tsx}` | Per-glyph family, `data-pn-style`, `fontFaceCss` usage, migrate the `FontFamily` users |
| C3 theory callers | `packages/notation-engine/src/layout/{staff,accidentals,records,normalize*,temporal,grouping}.ts`, `query/{hitTest,timemap,slots}.ts`; `packages/mnx/src/mnx/pitch.ts` (delete) + `mnx-pitch.test.ts` (move); mnx and react tests that use `parsePitch` (literals); `packages/audio/src/**` (`melodic`/`harmonic` take MIDI, drop `PitchLike`); app `exercises/**`, `lib/**`, `components/presets/**`; web `sound.ts`, `exercises/**` | Switch callers to `music-theory`, add `midiToPitchRng`, keep seeded sequences identical |

Integration C:
- The seeded-sequence comparison must show no difference.
- Font proof (Leland and a TrueType font without metadata), with one golden.
- Docs.

**Phase D: parallel.**

| Stream | Owns | Work |
|---|---|---|
| D1 timeline (5a) | `packages/mnx-score/src/**`, `packages/mnx-score/test/**`, `packages/notation-engine/test/timeline-parity.test.ts` (new) | `buildTimeline` with the full schema, padding, diagnostics, `performance()`; multi-part, multi-staff and pickup tests; parity test |
| D2 converter | `tools/musicxml-to-mnx/src/**`, `tools/musicxml-to-mnx/test/**` | Drop the engine check, fix the CLI usage line, swap `mnxconverter` for `musicxml-to-mnx` behind `convert()` (surface its `warnings`). The render check moves to the app and playground in integration D. The coordinator commits the manifest swap and removes `patches/mnxconverter@1.2.0.patch` and `patchedDependencies` before D starts |

**Phase E: engine consumes the timeline (5b).** Sequential.
- The coordinator first commits the contract: `layout.timeline`, `layout.placements`, `getTimeline()`.
- **E1 engine.** Owns `packages/notation-engine/src/**` and its tests, except goldens. Normalize consumes the timeline; ids are forked for beams; diagnostics merge; `positionAtTick`; the parity test is deleted.
- **E2 consumers**, after E1 merges. Owns `packages/notation-react/src/**` and its tests; app `SaltarelloScore`, `instruments`, `playback`; web `ScorePlayer`, `sound`, `NoteHeard`, `ErrorDetection`, `Dictation`, `IntervalId`.
- **Integration E.** The coordinator runs the golden reshape script, which checks ids, ticks, durations, entry and measure placements, and diagnostics as multisets per code. The user reviews the diff.

**Phase F: cleanup (5c).** Parallel.
- **F1.** Owns `packages/notation-engine/src/query/timemap.ts` and `playorder.ts` (delete), and `fullness.test.ts`. Remove the old timemap; `fullness.test.ts` stops importing internals.
- **F2.** Owns `packages/audio/src/**` and `packages/audio/test/**`. Drop `eventsFromTimeMap`; `Clip` loses `tickAtSeconds`. Rewrite `clip`/`builders` against `buildTimeline` and move them to mnx-score; the coordinator commits them, to avoid a workspace cycle.

**Deviations (as executed).**
- The MIDI clip builders (`melodic`, `harmonic`, `concat`, `shift`, `transpose`) stay in `web-audio`: they take MIDI numbers only, so `web-audio` has no workspace dependencies and nothing moved to `mnx-score`. Apps map `performance()` events to `NoteEvent`s.
- Phase E had no separate contract commit: E1 defined `layout.timeline`, `layout.placements` and `positionAtTick` itself, and E2 started after E1 merged.
- Integration D kept `mnxconverter` and its patch until D2 merged, then removed them.
- `packages/audio` was renamed to `packages/web-audio` (`@polyhymnia/web-audio`) in integration F.
- Phase G ran as local prep only (metadata, changesets, `npm pack` smoke installs, local `git subtree split` branches); publishing, repo creation, pushes and CI are the user's.
- Local `split/repo-{music-theory,web-audio,musicxml-to-mnx,app}` branches carry each split's history plus a standalone commit (own tsconfig base, README, changesets for packages). `web-audio` history was rebuilt across the `audio` rename with a path-mapping filter, since `git subtree split` does not follow renames. `music-theory` and `web-audio` install, build and test standalone; the converter and the app were verified against packed tarballs and get lockfiles once the packages are on npm. Re-run the split for later monorepo commits to those directories.
- Phase H's guard lives in this repo only until the split repos exist; the user copies `.githooks/` (with a `deps.json` for that repo's packages) and the `prepare` script into each new repo that has internal dependencies.

**Phase G: split and publish.** Coordinator and user, sequential, each publish and each first push user-approved.
- Every package gets `repository`, `publishConfig.access: public`, and has `private` removed.
- Add changesets.
- **G1.** `filter-repo` `music-theory` and `web-audio`. The user creates CI. Publish 0.1.0. The monorepo switches to the published versions.
- **G2.** The monorepo becomes `notation`; publish its packages.
- **G3.** Split `@polyhymnia/musicxml-to-mnx`, publish.
- **G4.** Split the app. Add `dev:link`/`dev:unlink` and Vite `resolve.dedupe: ['react', 'react-dom']`, then switch it to npm.
- Before each publish, `npm pack` and smoke-install in a scratch project.

**Phase H: guard.** Coordinator, after G. Build the small guard (Part 1 "Guards") in each repo, add the AGENTS.md rule, test once: an internal dependency change fails, the same change with `deps.json` updated passes, a non-dependency `package.json` edit passes.

## AGENTS.md rules to rewrite (coordinator, during integrations)
- "Only `normalize*.ts` reads MNX" becomes: the timeline and the engine (engraving only) read MNX; addressing comes from `mnx`.
- Thin model and `beamGroups`.
- Audio rules.
- The MusicXML `layoutScore` check and allowlist.
- The Ajv exception.
- Package names, schema location, dependency direction.
- New: the stream and merge protocol.

## Side findings (handled in Phase 0 or the matching phase)
- **Instruments:** the piano is listed but its samples are gone (2568cfa). The guitar, cello and clarinet samples have no credits.
- **Rule conflict:** `mnxBuild` conflicts with the "no builder API" rule; decide when B2 moves it.
- **Glyph tables** differ in coverage.
- **Docs drift:** the `/mnx` export, the allowlist.
- **Fonts:** the mensural NOTICE is wrong.
- **Converter:** the CLI usage line is wrong.
- **Ids:** beam id collisions are dropped.

## Verification
- **Every merge:** `pnpm -r typecheck` and `pnpm test -- --reporter=dot`.
- **Every integration:** the app and web builds, plus the ownership-diff check.
- **Per phase:**
  - C: the seeded-sequence script and the font proof.
  - D: the parity test.
  - E: the golden reshape script.
  - G: `npm pack` smoke installs.
- **End:** `git status` clean in every repo, CI green, and each package installed in a fresh project.
