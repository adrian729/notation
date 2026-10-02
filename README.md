# Polyhymnia notation

<p align="center">
  <a href="https://github.com/adrian729/notation/actions/workflows/ci.yml"><img alt="CI status" src="https://github.com/adrian729/notation/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-ea76cb">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
  <img alt="pnpm workspace" src="https://img.shields.io/badge/pnpm-workspace-f69220">
  <img alt="Score format: MNX" src="https://img.shields.io/badge/score%20format-MNX-004044">
</p>

<p align="center">
  <a href="https://adrian729.github.io/app/"><b>Open the app</b></a> &nbsp;·&nbsp;
  <a href="notation/README.md">Notation renderer design</a>
</p>

MNX music notation for the browser: a from-scratch engraver that reads [MNX](https://w3c-cg.github.io/mnx/), the emerging W3C score format, renders it to SVG glyphs with no server and no general-purpose score model, and supports answer entry and playback highlighting. It powers the [Polyhymnia ear-training app](https://github.com/adrian729/app).

## Repositories

| Repository | Contents |
|---|---|
| [`notation`](https://github.com/adrian729/notation) (this one) | The MNX notation packages below and the notation playground. |
| [`app`](https://github.com/adrian729/app) | The ear-training app: interval and chord exercises built on these packages. |
| [`music-theory`](https://github.com/adrian729/music-theory) | `@polyhymnia/music-theory` |
| [`web-audio`](https://github.com/adrian729/web-audio) | `@polyhymnia/web-audio` |
| [`musicxml-to-mnx`](https://github.com/adrian729/musicxml-to-mnx) | `@polyhymnia/musicxml-to-mnx`, the offline MusicXML → MNX converter. |

## How it is built

The interesting part is the notation stack: it renders MNX to glyphs in the browser, with no server and no general-purpose score model. Packages follow one dependency direction — `mnx ← mnx-score ← engine ← react` — and cross-package imports go only through the entry points declared in each `package.json`.

| Package | Role |
|---|---|
| `@polyhymnia/mnx` | Pinned MNX schema with generated types, rational and duration maths, scoped ids, and `applyIntent` edits. |
| `@polyhymnia/music-theory` | Pitch, interval, chord, scale and key theory, from npm ([repo](https://github.com/adrian729/music-theory)). |
| `@polyhymnia/mnx-score` | The timeline over MNX: musical time, stable ids, pitch to MIDI, ties, tempo and play order, plus `performance()` events for playback. |
| `@polyhymnia/notation-fonts` | Glyph tables, committed notation fonts and their build, add and verify scripts. |
| `@polyhymnia/notation-engine` | Renderer-agnostic layout: MNX → timeline → engraving records → positioned glyphs, plus hit-testing and cursor positions. No DOM. |
| `@polyhymnia/notation-react` | React components that draw an engine `LayoutResult`, with playback highlight and answer entry. |
| `@polyhymnia/web-audio` | Plays MIDI note events; the playground feeds it `performance()` events. From npm ([repo](https://github.com/adrian729/web-audio)). |
| `@polyhymnia/web` | The notation playground used to develop the renderer. |

## Development

```bash
pnpm install
pnpm build       # run first on a fresh clone
pnpm typecheck
pnpm test
pnpm dev         # notation playground (apps/web)
```

`pnpm build` must run before `pnpm typecheck`: cross-package imports resolve through gitignored `dist/` output, so a clean clone has nothing to resolve against until it is built.

## Documentation

- [`notation/README.md`](notation/README.md) — renderer design: public React API, supported MNX subset, layout pipeline, engraving rules, interaction, playback, roadmap.
- [`docs/`](docs/) — music font research and the package-split plan. Exercise specs and ear-training research live in the [app repo](https://github.com/adrian729/app/tree/main/docs).

## License

[MIT](LICENSE) © 2026 Adrián Sánchez Albanell. Bundled fonts keep their own licences — see the OFL files beside them.
