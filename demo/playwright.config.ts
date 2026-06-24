import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for the authkit-ui demo. Drives the REAL running stack:
 *   - Vite dev server at http://127.0.0.1:5173 (proxies /api -> :8099)
 *   - goravel-authkit backend at :8099, writing the authkit_demo scratch DB.
 *
 * The dev server is assumed to be already running; `webServer` only starts one
 * if the port is free, and always reuses an existing server.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
