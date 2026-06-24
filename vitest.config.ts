import { defineConfig } from 'vitest/config';

// Tests run against the package source (not the built bundle). React / PatternFly
// peers resolve from node_modules; jsdom provides the DOM. Vitest 4's oxc transform
// handles the automatic JSX runtime, so test files need no React import.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    // Integration tests hit a real backend whose login endpoint is rate-limited
    // per IP. Run test files serially so concurrent suites don't burst-trip it,
    // and allow extra time for real round-trips plus rate-limit backoff.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
