import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const packages = fileURLToPath(new URL('../', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@polyhymnia\/mnx$/, replacement: `${packages}mnx/src/index.ts` },
      { find: /^@polyhymnia\/mnx\/edit$/, replacement: `${packages}mnx/src/edit/index.ts` },
      { find: /^@polyhymnia\/mnx-score$/, replacement: `${packages}mnx-score/src/index.ts` },
      { find: /^@polyhymnia\/music-theory$/, replacement: `${packages}music-theory/src/index.ts` },
      { find: /^@polyhymnia\/notation-fonts$/, replacement: `${packages}notation-fonts/src/index.ts` },
    ],
  },
});
