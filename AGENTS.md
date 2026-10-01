# Modules
- Each package (`mnx`, `music-theory`, `mnx-score`, `notation-fonts`, `notation-engine`, `notation-react`, `audio`, `tools/musicxml-to-mnx`) is an isolated module, publishable as its own npm package later without moving code. `notation-fonts` is the font workspace package (glyph tables, committed fonts, build/add/verify scripts); `font:sync` copies only the two default woff2 into `notation-react/styles/`.
- Dependency direction only: `mnx` and `music-theory` are leaves; `mnx-score` ← `mnx`, `music-theory`; `notation-engine` ← `mnx`, `mnx-score`, `music-theory`, `notation-fonts`; `notation-react` ← `notation-engine`, `mnx-score`, `notation-fonts`, `mnx`; `audio` ← `notation-engine` (types only) and `mnx`; tools use `mnx` (+ `notation-engine` until Phase D). Never import upward or sideways.
- Cross-package imports go through the package name and entry points declared in its `package.json` `exports`, never relative paths or deep `src/` paths. Every cross-package import must be declared in that package's `package.json`.
- `mnx` and `notation-engine`: no DOM, no React, no Node APIs (`lib` excludes DOM). Renderer-specific code lives only in a renderer package (`notation-react`, future others).
- New concern that doesn't fit an existing package's role → new package, not a folder inside another.
- `apps/*` consume packages only through their public exports; no app code inside packages.

# App
- `apps/app` (`@polyhymnia/app`) is the ear-training product SPA: Vite + React 19 + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first, no `tailwind.config.js`), shadcn/ui, TanStack Router (file-based, `routeTree.gen.ts` committed).
- shadcn components live in `apps/app/src/components/ui`, generated via the shadcn CLI (`--cwd apps/app`), not hand-written.
- Class merging uses the npm `cn` package, never `clsx`/`tailwind-merge`. `src/lib/utils.ts` builds one configured `cn` via `createCn` from `cn/config`, extending `theme.text` with the semantic type scale; import `cn` from `@/lib/utils` everywhere, never straight from `"cn"`. Without that config `cn` reads custom `text-*` size tokens (`text-meta`, `text-title`, …) as text *colors* and silently deletes a co-occurring `text-*-foreground`, so `cn`'s type scale must stay in sync with the `--text-*` tokens in `styles/theme.css` (`test/cn-type-scale.test.ts` guards this).
- Colors: Catppuccin (Latte light, Mocha dark), primary = pink. `primary` is for fills (exact Latte/Mocha pink); pink text, links, rings and notation highlights use `primary-strong` (AA-safe on light backgrounds). Scales in `apps/app/src/styles/palette.css`, semantic shadcn tokens + notation `--pn-*` mapping in `apps/app/src/styles/theme.css`. Use semantic tokens or palette scales, never raw color values. Never pure black or white (`white`/`black` are remapped to Latte base / Mocha crust).
- `apps/web` (`@polyhymnia/web`) is the notation demo/playground, not the product app.

# Audio
- `audio` imports engine (types only), never react, never `mnx` at runtime. Direction `mnx ← engine ← {react, audio}`.
- Playback builders (`melodic`, `harmonic`) take MIDI numbers; audio never parses pitch strings.
- `.` entry: no DOM, no Web Audio; only `./webaudio` touches `AudioContext`.
- No rAF, `setTimeout` or `setInterval` in audio. The app owns the UI clock.
- Sound derives only from `TimeMap` (`entries`, `tickToSeconds`, `playOrder`, `writtenTickAtSeconds`); audio never reads MNX documents.
- Third-party audio libs or samples only behind `Instrument`, pinned, own entry; ask before installing.
- `NoteEvent.id` is an MNX id; quiz data stays in the app.
- Audio docs: `notation/audio.md`.

# Interaction (answer entry)
- Built: hit-testing, insertion slots, `applyIntent` (`notation/interaction.md`). Design every new feature so interaction keeps working on it; never take a shortcut interaction would have to undo.
- Targets ear-training exercises (dictation, click-what-you-heard, error detection), not a sheet editor; editor features (drag pitch, palette, free multi-voice entry, measure/meter edits, copy/paste) are deferred, different scope.
- `notation-*` packages never produce sound and never run clocks/timers/rAF/animations-as-time; the app owns time and passes position, notation only shows.
- Every drawn element keeps its MNX/positional id and a hitbox in `LayoutResult`; ids stay stable when an edited document is re-laid out.
- Derived notation (beams, tuplet brackets, accidentals, padding rests) is recomputed from MNX on each layout or produced by a pure MNX → MNX function; no state that exists only after rendering.

# Score format
- MNX (w3c-cg/mnx) is the only score format. Public APIs take and return plain MNX. Never add private fields or `_x` extensions to documents.
- No custom score model, builder API, or internal "MNX + additions" representation in packages; app-private helpers that return plain MNX (`mnxBuild`) are allowed. Layout structures derived from MNX stay inside `notation-engine`.
- Only `layout/normalize*.ts` in `notation-engine` reads MNX documents; later stages consume its flat records.
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

# music-theory
- Pure, no dependencies. Its `Pitch` stays structurally equal to MNX's.
- Callers import pitch, interval, chord, scale and key logic only from `@polyhymnia/music-theory`; never re-implement it in apps or packages.

# MusicXML
- Import-only, offline: `tools/musicxml-to-mnx` → committed `.mnx.json`. No runtime import or export until a product flow needs it.
- Conversion uses npm `mnxconverter`, pinned, behind one `convert()` wrapper. Output must pass Ajv against the pinned schema and headless `layoutScore` with no errors and no `mnx-unsupported` outside `UNSUPPORTED_ALLOWLIST` (`tools/musicxml-to-mnx/src/check.ts`, currently empty). Grow the allowlist only for constructs the engine will support but doesn't draw yet.
- Keep `patches/mnxconverter@1.2.0.patch` (fixes broken published entry points) until the package verifiably works unpatched.

# Fonts
- Add fonts only via `pnpm --filter @polyhymnia/notation-fonts font:add`; verify with `font:verify`. Never hand-edit `packages/notation-fonts/fonts/**`.
- Fonts reach layout only as `NotationFont` data via `NotationOptions.font`; never hard-code a font name or metric in engine or react.
- Docs: `notation/font.md`.

# Package split
- Plan: `docs/plans/package-split.md`. Phase work runs in streams on branches `split/<phase>-<stream>` in worktrees `.worktrees/<stream>`.
- Streams modify only files in their ownership list, stage with explicit paths (never `git add -A`), run prettier only on owned files.
- Never run `git checkout`/`restore`/`reset`/`stash` on non-owned paths. Never rebase or force-push. Never regenerate goldens.
- Need a change outside the ownership list → stop and report.
- Coordinator owns manifests, lockfile, tsconfig, barrels, `AGENTS.md`, docs, goldens. Merge with `git merge --no-ff`, one stream at a time, then `pnpm -r typecheck` and tests.

# Dependencies
- Simple work → write it ourselves even if a library exists. Complex work → dependency, pinned, wrapped for replacement, maintained and tracking the MNX schema.
- Ajv and `json-schema-to-typescript` are devDependencies only; never in `notation-*` runtime bundles. Sole exception: `tools/musicxml-to-mnx` lists Ajv under `dependencies` because its offline CLI validates at run time.
- Rejected, don't reintroduce without re-evaluation: Python `w3c-cg/mnxconverter` (stale), `@mnxjs/*` (source gone), `@quonset/minim`, `musicxml-interfaces` (AGPL), `@stringsync/musicxml` (stale).

# Tests
- Add a test only to prevent a real regression: silent-drift engraving output, a contract (diagnostic, id stability, applyIntent result, hit-test behavior), or a bug that was actually fixed. Otherwise don't.
- New behavior → at most a few tests for its distinct branches. Never one test per constant, option, or trivial mapping; never restate the implementation.
- Fixed bug → one regression test that fails without the fix. Don't add neighboring "for completeness" cases.
- Table-driven over copy-paste. Extra rows only when each guards a different branch; no cross-products (e.g. every key × every clef).
- Golden/snapshot only for a distinct engraving feature not already covered by another golden. Never add or regenerate goldens/snapshots to make a change pass without reviewing the diff.
- Test only through public entry points; never export internals for tests. Never weaken an assertion to go green.
- Before adding, check an existing test doesn't already cover it. Prefer deleting or merging a redundant test over adding one.
- Agents: run tests with `--reporter=dot`; never print golden diffs.
