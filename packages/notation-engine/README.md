# @polyhymnia/notation-engine

Renderer-agnostic music engraving for MNX. `layoutScore` turns an MNX document into positioned glyphs, lines and paths in staff spaces, with hit-testing and playback cursor positions. No DOM, no React; any renderer can draw its `LayoutResult`.

```sh
npm install @polyhymnia/notation-engine
```

```ts
import { layoutScore, hitTest, positionAtTick } from '@polyhymnia/notation-engine';

const layout = layoutScore(doc, { style: 'modern' });
const hit = hitTest(layout, { x, y });
const cursor = positionAtTick(layout, tick);
```

MIT licensed. Source: https://github.com/adrian729/notation
