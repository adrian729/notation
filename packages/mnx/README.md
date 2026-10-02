# @polyhymnia/mnx

The [MNX](https://w3c-cg.github.io/mnx/) score format for TypeScript: the pinned JSON schema, generated types, `readMnx` (version check), rational time maths, scoped element ids and `applyIntent` edits.

```sh
npm install @polyhymnia/mnx
```

```ts
import { readMnx } from '@polyhymnia/mnx';
import { applyIntent } from '@polyhymnia/mnx/edit';
import schema from '@polyhymnia/mnx/schema' with { type: 'json' };

const { doc, diagnostics } = readMnx(json);
```

MIT licensed. Source: https://github.com/adrian729/notation
