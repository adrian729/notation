# @polyhymnia/musicxml-to-mnx

Offline MusicXML → MNX converter (library and CLI) wrapping npm `musicxml-to-mnx` behind one `convert()` that never throws, with Ajv validation against the `@polyhymnia/mnx` schema and positional ids.

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

Releases are versioned with changesets and published to npm as `@polyhymnia/musicxml-to-mnx`.

MIT licensed.
