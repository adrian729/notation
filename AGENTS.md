# Modules
- Each package (`mnx`, `mnx-score`, `notation-fonts`, `notation-engine`, `notation-react`) is an isolated module published as its own npm package. `notation-fonts` is the font workspace package (glyph tables, committed fonts, build/add/verify scripts); `font:sync` copies only the two default woff2 into `notation-react/styles/`.
- `@polyhymnia/music-theory` and `@polyhymnia/web-audio` live in their own repos (github.com/adrian729/music-theory, github.com/adrian729/web-audio) and come from npm; change them there, never copy their code here. The MusicXML converter (github.com/adrian729/musicxml-to-mnx) and the ear-training app (github.com/adrian729/app) are separate repos too.
- Dependency direction only: `mnx` and `notation-fonts` are leaves; `mnx-score` ← `mnx`, `music-theory`; `notation-engine` ← `mnx`, `mnx-score`, `music-theory`, `notation-fonts`; `notation-react` ← `notation-engine`, `mnx-score`, `notation-fonts`, `mnx`. Never import upward or sideways.
- Cross-package imports go through the package name and entry points declared in its `package.json` `exports`, never relative paths or deep `src/` paths. Every cross-package import must be declared in that package's `package.json`.
- `mnx` and `notation-engine`: no DOM, no React, no Node APIs (`lib` excludes DOM). Renderer-specific code lives only in a renderer package (`notation-react`, future others).
- New concern that doesn't fit an existing package's role → new package, not a folder inside another.
- Pitch, interval, chord, scale and key logic comes only from `@polyhymnia/music-theory`; never re-implement it here.

# Playground
- `apps/web` (`@polyhymnia/web`) is the notation demo/playground, private; it consumes packages only through their public exports. Its sound uses `@polyhymnia/web-audio`, fed by mnx-score `performance()` events.

# Interaction (answer entry)
- Built: hit-testing, insertion slots, `applyIntent` (`notation/interaction.md`). Design every new feature so interaction keeps working on it; never take a shortcut interaction would have to undo.
- Targets ear-training exercises (dictation, click-what-you-heard, error detection), not a sheet editor; editor features (drag pitch, palette, free multi-voice entry, measure/meter edits, copy/paste) are deferred, different scope.
- `notation-*` packages never produce sound and never run clocks/timers/rAF/animations-as-time; the app owns time and passes position, notation only shows.
- Every drawn element keeps its MNX/positional id and a hitbox in `LayoutResult`; ids stay stable when an edited document is re-laid out. Beam ids come from a per-layout fork of the frozen timeline ids.
- Derived notation (beams, tuplet brackets, accidentals, padding rests) is recomputed from MNX on each layout or produced by a pure MNX → MNX function; no state that exists only after rendering.

# Score format
- MNX (w3c-cg/mnx) is the only score format. Public APIs take and return plain MNX. Never add private fields or `_x` extensions to documents.
- No custom score model, builder API, or internal "MNX + additions" representation in packages; app-private helpers that return plain MNX (`mnxBuild`) are allowed. Layout structures derived from MNX stay inside `notation-engine`.
- Only `mnx-score` (timeline: time, ids, pitch → midi) and `notation-engine` `layout/normalize*.ts` (engraving only) read MNX documents; later stages consume the timeline and normalized records; addressing comes from `mnx`.
- Unsupported MNX → render what's possible + `mnx-unsupported` diagnostic; never throw.
- Elements apps reference (playback highlight, quiz lookups, clicks) must carry MNX `id`s; the engine synthesizes positional ids otherwise.
- App/quiz data about notes lives in the app, keyed by note id, never in the MNX document.

# MNX schema
- Pinned in `packages/mnx/schema/` (`SOURCE` = commit, date, version). Upgrade only via `pnpm mnx:update <commit>`, deliberately. Never hand-edit the schema, examples, or generated `src/mnx/types.ts`.

# mnx
- Thin layer only: vendored schema + examples, generated types, `readMnx` version check, rational/duration math, `assignIds`, scoped addressing (`elementIds(doc, scope?)`, `ElementScope`). Add code only for a current consumer; no speculative helpers.
- Default id scope (part 0, staff 1, 2 voices) keeps its ids unchanged; ids outside it are prefixed `p{n}.`/`st{k}.`. Never change default-scope id shapes.
- Edit operations (`applyIntent`) live at `@polyhymnia/mnx/edit`, not `.`; pure MNX → MNX functions that preserve untouched content.
- Beat grouping (`beamGroups`, `beatGroupingFor`) lives in `notation-engine` `src/layout/beam-policy/`, engine-internal; never export it from `mnx`.

# mnx-score
- Owns musical time and ids for layout and playback: `buildTimeline(doc, {scope?, divisions?})` → `Timeline`.
- Engine and audio consumers never re-derive time, pitch → midi or ids from MNX.
- Playback events come from `performance(timeline, {tempo?})`; whole-score playback uses `buildTimeline(doc, {scope: 'all'})`; cursor sync uses `layout.timeline`.

# Fonts
- Add fonts only via `pnpm --filter @polyhymnia/notation-fonts font:add`; verify with `font:verify`. Never hand-edit `packages/notation-fonts/fonts/**`.
- Fonts reach layout only as `NotationFont` data via `NotationOptions.font`; never hard-code a font name or metric in engine or react.
- Docs: `notation/font.md`.

# Dependency guard
- `.githooks/pre-commit` stops a commit when any package's `@polyhymnia/*` dependencies differ from `.githooks/deps.json`.
- Never edit `.githooks/**`, pass `--no-verify`, or change `core.hooksPath`. Hook fails → stop and ask the user; only the user updates `deps.json`.

# Publishing
- Packages publish to public npm under `@polyhymnia` (`publishConfig.access: public`, `files` whitelist, own `LICENSE`); `apps/web` stays `private`.
- Record releasable changes with `pnpm changeset`. Agents never run `changeset publish`, `npm publish`, or push; the user publishes.
- Before a release, `pnpm pack` each package and smoke-install the tarballs in a scratch project.

# Dependencies
- Simple work → write it ourselves even if a library exists. Complex work → dependency, pinned, wrapped for replacement, maintained and tracking the MNX schema.
- Ajv and `json-schema-to-typescript` are devDependencies only; never in `notation-*` runtime bundles.
- Rejected, don't reintroduce without re-evaluation: Python `w3c-cg/mnxconverter` (stale), npm `mnxconverter` (replaced by `musicxml-to-mnx`), `@mnxjs/*` (source gone), `@quonset/minim`, `musicxml-interfaces` (AGPL), `@stringsync/musicxml` (stale).

# Tests
- Add a test only to prevent a real regression: silent-drift engraving output, a contract (diagnostic, id stability, applyIntent result, hit-test behavior), or a bug that was actually fixed. Otherwise don't.
- New behavior → at most a few tests for its distinct branches. Never one test per constant, option, or trivial mapping; never restate the implementation.
- Fixed bug → one regression test that fails without the fix. Don't add neighboring "for completeness" cases.
- Table-driven over copy-paste. Extra rows only when each guards a different branch; no cross-products (e.g. every key × every clef).
- Golden/snapshot only for a distinct engraving feature not already covered by another golden. Never add or regenerate goldens/snapshots to make a change pass without reviewing the diff.
- Test only through public entry points; never export internals for tests. Never weaken an assertion to go green.
- Before adding, check an existing test doesn't already cover it. Prefer deleting or merging a redundant test over adding one.
- Agents: run tests with `--reporter=dot`; never print golden diffs.
