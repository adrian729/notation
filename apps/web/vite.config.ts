import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.PAGES_BASE ?? '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        ornaments: fileURLToPath(new URL('./ornaments.html', import.meta.url)),
      },
    },
  },
});
