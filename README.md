<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/readme/banner-dark.png">
    <img alt="Polyhymnia — ear training for musicians: the difference between reading music and hearing it" src="docs/readme/banner-light.png" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/adrian729/polyhymnia/actions/workflows/pages.yml"><img alt="Deploy status" src="https://github.com/adrian729/polyhymnia/actions/workflows/pages.yml/badge.svg"></a>
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-ea76cb">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
  <img alt="pnpm workspace" src="https://img.shields.io/badge/pnpm-workspace-f69220">
  <img alt="Score format: MNX" src="https://img.shields.io/badge/score%20format-MNX-004044">
</p>

<p align="center">
  <a href="https://adrian729.github.io/polyhymnia/"><b>Open the app</b></a> &nbsp;·&nbsp;
  <a href="notation/README.md">Notation renderer design</a>
</p>

Polyhymnia trains the part of musicianship that reading notation alone does not: hearing what is written. Short exercises play real scores and ask you to name, place or correct what you heard — no abstract interval buttons, no MIDI. It is also the proving ground for a from-scratch music engraver that reads [MNX](https://w3c-cg.github.io/mnx/), the emerging W3C score format.

## Exercises

Four exercises ship today, in recommended order:

| Folio | Exercise | What it trains |
|:--:|---|---|
| 01 | **Interval Comparison** | Hear two intervals and say which is wider, or whether they match. No note names, nothing to read. |
| 02 | **Interval Identification** | Hear one interval and name it, from perfect 4ths and 5ths up to compound intervals. |
| 03 | **Multi-Note Interval Identification** | Hear a stack of three to five notes and name every note's interval above the lowest. |
| 04 | **Chord Identification** | Hear one chord and name its quality, from major and minor up to seventh chords. |

Each has lesson and custom modes, and the app is entirely client-side.

## How it is built

The interesting part is the notation stack: it renders MNX to glyphs in the browser, with no server and no general-purpose score model. Packages follow one dependency direction — `mnx ← engine ← {react, audio}` — and cross-package imports go only through the entry points declared in each `package.json`.

| Package | Role |
|---|---|
| `@polyhymnia/mnx` | Pinned MNX schema with generated types, plus pitch, rational and duration maths. |
| `@polyhymnia/music-theory` | Pitch, interval, chord, scale and key theory. Pure, no dependencies. |
| `@polyhymnia/mnx-score` | The timeline over MNX: musical time, stable ids, pitch to MIDI, ties, tempo and play order, plus `performance()` events for playback. |
| `@polyhymnia/notation-fonts` | Glyph tables, committed notation fonts and their build, add and verify scripts. |
| `@polyhymnia/notation-engine` | Renderer-agnostic layout: MNX → timeline → engraving records → positioned glyphs, plus hit-testing and cursor positions. No DOM. |
| `@polyhymnia/notation-react` | React components that draw an engine `LayoutResult`, with playback highlight and answer entry. |
| `@polyhymnia/audio` | Derives sound from the timeline's `performance()` events. Only its `./webaudio` and `./sampler` entries touch Web Audio. |
| `@polyhymnia/musicxml-to-mnx` | Offline CLI that converts MusicXML to committed MNX, validated against the pinned schema. |
| `@polyhymnia/app` | The ear-training product SPA (Vite, React, TanStack Router, Tailwind). |
| `@polyhymnia/web` | The notation playground used to develop the renderer. |

## Development

```bash
pnpm install
pnpm build       # run first on a fresh clone
pnpm typecheck
pnpm test
pnpm dev         # ear-training app (apps/app)
pnpm dev:demo    # notation playground (apps/web)
```

`pnpm build` must run before `pnpm typecheck`: cross-package imports resolve through gitignored `dist/` output, so a clean clone has nothing to resolve against until it is built.

## Documentation

- [`notation/README.md`](notation/README.md) — renderer design: public React API, supported MNX subset, layout pipeline, engraving rules, interaction, playback, roadmap.
- [`docs/`](docs/) — exercise specifications, the ear-training landscape survey, and font and illustration notes.

## License

[MIT](LICENSE) © 2026 Adrián Sánchez Albanell. Bundled fonts and ornaments keep their own licences — see the OFL and CREDITS files beside them.
