import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const packages = fileURLToPath(new URL('../../packages/', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@polyhymnia\/mnx$/, replacement: `${packages}mnx/src/index.ts` },
      { find: /^@polyhymnia\/notation-engine$/, replacement: `${packages}notation-engine/src/index.ts` },
    ],
  },
});
