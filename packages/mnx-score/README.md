# @polyhymnia/mnx-score

The musical timeline over an MNX document: ticks, durations, stable ids, pitch → MIDI, ties, tempo and play order (repeats, voltas, D.S. al Fine), plus performance events for playback.

```sh
npm install @polyhymnia/mnx-score
```

```ts
import { buildTimeline, performance } from '@polyhymnia/mnx-score';

const timeline = buildTimeline(doc);
const { events, durationSeconds, tickAtSeconds } = performance(timeline, { tempo: { bpm: 90 } });
```

MIT licensed. Source: https://github.com/adrian729/notation
