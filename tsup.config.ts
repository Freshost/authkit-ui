import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Never bundle peers — the app owns the single React / PatternFly instance.
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react-router',
    '@tanstack/react-query',
    'react-i18next',
    'i18next',
    '@freshost/ui',
    '@freshost/ui/icons',
  ],
});
