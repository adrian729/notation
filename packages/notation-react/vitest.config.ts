import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const packages = fileURLToPath(new URL('../', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@polyhymnia\/mnx$/, replacement: `${packages}mnx/src/index.ts` },
      { find: /^@polyhymnia\/mnx\/edit$/, replacement: `${packages}mnx/src/edit/index.ts` },
      { find: /^@polyhymnia\/mnx-score$/, replacement: `${packages}mnx-score/src/index.ts` },
      { find: /^@polyhymnia\/notation-fonts$/, replacement: `${packages}notation-fonts/src/index.ts` },
      { find: /^@polyhymnia\/notation-engine$/, replacement: `${packages}notation-engine/src/index.ts` },
    ],
  },
  test: {
    // The rendering test tier (roadmap.md): the real component in a real DOM.
    environment: 'jsdom',
    include: ['test/**/*.test.tsx', 'test/**/*.test.ts'],
  },
});
