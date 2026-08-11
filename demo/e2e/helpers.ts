import { expect, type APIRequestContext, type Page, type Playwright } from '@playwright/test';

import { clientIp } from './fixtures';

/** Backend API base (same origin the Vite dev server proxies /api to). */
export const API_BASE = 'http://127.0.0.1:8099/api/v1';

/**
 * Creates an API request context pinned to a unique synthetic client IP, so its
 * login calls land in their own rate-limit bucket (see fixtures.ts).
 */
export async function newApiRequest(playwright: Playwright): Promise<APIRequestContext> {
  return playwright.request.newContext({
    extraHTTPHeaders: {
      'X-Forwarded-For': clientIp(),
      Origin: 'http://127.0.0.1:8099',
    },
  });
}

export const ADMIN = { email: 'admin@demo.test', password: 'password123' };

/** A throwaway password that satisfies the backend min length (8). */
export const THROWAWAY_PASSWORD = 'password123';

/** A unique, never-reused email for a throwaway user. */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

export interface ThrowawayUser {
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
}

/**
 * Logs an admin session into the given API request context (mutates its cookie
 * jar) and returns it. Used to provision/clean up throwaway users out-of-band.
 */
async function adminApiLogin(request: APIRequestContext): Promise<void> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: ADMIN,
  });
  expect(res.ok(), `admin API login failed: ${res.status()}`).toBeTruthy();
}

/**
 * Creates a throwaway user directly via the backend API (as admin), so stateful
 * specs never have to touch the shared admin's own record. The provided request
 * context's cookies are left logged-in as admin.
 */
export async function createUserViaApi(
  request: APIRequestContext,
  overrides: Partial<Pick<ThrowawayUser, 'email' | 'name' | 'role' | 'password'>> = {},
): Promise<ThrowawayUser> {
  await adminApiLogin(request);
  const email = overrides.email ?? uniqueEmail();
  const name = overrides.name ?? 'E2E Throwaway';
  const role = overrides.role ?? 'user';
  const password = overrides.password ?? THROWAWAY_PASSWORD;
  const res = await request.post(`${API_BASE}/auth/users`, {
    data: { email, name, role, password },
  });
  expect(res.ok(), `create user failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { id: string };
  return { id: body.id, email, name, role, password };
}

/** Best-effort cleanup: deletes a throwaway user as admin. Never throws. */
export async function deleteUserViaApi(request: APIRequestContext, id: string): Promise<void> {
  try {
    await adminApiLogin(request);
    await request.delete(`${API_BASE}/auth/users/${id}`);
  } catch {
    /* best effort */
  }
}

/**
 * Drives the real login UI: fills the credential form and clicks "Sign in".
 * Does NOT assert navigation — callers decide what success looks like (the demo
 * dev build prefills the admin credentials, so we clear the fields first).
 */
export async function fillAndSubmitLogin(page: Page, email: string, password: string): Promise<void> {
  // PatternFly FormGroup labels aren't <label htmlFor>, so the inputs are
  // matched by accessible name (role), not getByLabel.
  const emailInput = page.getByRole('textbox', { name: 'Email', exact: true });
  const passwordInput = page.locator('#authkit-login-password');
  await emailInput.waitFor();
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

/** Logs in through the UI and waits for the dashboard ("/"). */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await fillAndSubmitLogin(page, email, password);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}
