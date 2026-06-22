import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The demo consumes @freshost/authkit-ui straight from the library source (one
// repo up) via an alias — so editing the package hot-reloads here, and there's a
// single React / PatternFly copy (deduped below). A published app would just
// `pnpm add @freshost/authkit-ui` instead.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@freshost/authkit-ui': resolve(__dirname, '../../src/index.ts'),
    },
    dedupe: ['react', 'react-dom', '@tanstack/react-query', 'react-router', 'react-i18next', 'i18next'],
  },
  server: {
    port: 5173,
    // Allow importing the library source from outside the frontend root.
    fs: { allow: [resolve(__dirname, '../..')] },
    // Same-origin to the browser; cookies flow through to the Goravel backend.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8090', changeOrigin: false },
    },
  },
});
