import { test as base, type APIRequestContext, type Browser } from '@playwright/test';

/**
 * The demo backend rate-limits the login + 2FA-challenge endpoints to 5 attempts
 * per 60s PER CLIENT IP, and (being a trusted-proxy localhost setup) keys that
 * IP off the X-Forwarded-For header. Tests share 127.0.0.1, so without
 * isolation a handful of logins would trip the limiter (429 "Too many
 * attempts").
 *
 * Each test therefore gets a UNIQUE synthetic client IP, injected as
 * X-Forwarded-For on every request from its browser context. This puts each
 * test in its own rate-limit bucket — the correct, server-friendly way to keep
 * the suite green without touching the backend. Helper API contexts get their
 * own unique IPs too (see clientIp()).
 */

let ipCounter = 0;

/** Allocates a fresh, unique synthetic client IP for rate-limit isolation. */
export function clientIp(): string {
  ipCounter += 1;
  // 10.x.y.z space, derived from a monotonic counter (well under 2^24 tests).
  const n = ipCounter + Math.floor(Math.random() * 1000) * 1000;
  return `10.${(n >> 16) & 0xff}.${(n >> 8) & 0xff}.${(n & 0xff) || 1}`;
}

/** An API request context pinned to a unique client IP via X-Forwarded-For. */
export async function newApiContext(browser: Browser): Promise<APIRequestContext> {
  return browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': clientIp() } }).then((c) => c.request);
}

export const test = base.extend<{ rateLimitIp: string }>({
  rateLimitIp: async ({}, use) => {
    await use(clientIp());
  },
  // Override the default context so every page request carries the per-test IP.
  context: async ({ browser, rateLimitIp }, use) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': rateLimitIp },
    });
    await use(context);
    await context.close();
  },
});

export { expect } from '@playwright/test';
