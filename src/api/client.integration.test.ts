// Integration tests for the REAL AuthkitClient against the running backend.
// The backend rate-limits the login endpoint per IP, so this suite keeps real
// admin logins to a minimum: one shared authenticated session covers the
// read-only authenticated assertions, and only the logout test needs its own.
import { beforeAll, describe, it, expect } from 'vitest';

import { AuthkitError } from './client';
import { isTwoFactorRequired, type UserResponse } from './types';
import { loginWithRetry, makeRealClient } from '../test/integration';
import type { AuthkitClient } from './client';

const ADMIN_EMAIL = 'admin@demo.test';
const ADMIN_PASSWORD = 'password123';

/** Narrows a LoginResult to a UserResponse, failing the test on a 2FA marker. */
function asUser(result: unknown): UserResponse {
  if (isTwoFactorRequired(result as never)) {
    throw new Error('expected a logged-in user, got a pending 2FA challenge');
  }
  return result as UserResponse;
}

describe('AuthkitClient (real backend)', () => {
  // One shared admin session (one login) reused by the authenticated read tests.
  let admin: AuthkitClient;
  let adminLoginResult: UserResponse;

  beforeAll(async () => {
    admin = makeRealClient();
    adminLoginResult = asUser(
      await loginWithRetry(admin, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    );
  });

  it('getMeta() returns roles and feature flags', async () => {
    const client = makeRealClient();
    const meta = await client.getMeta();

    expect(Array.isArray(meta.roles)).toBe(true);
    expect(meta.roles).toContain('admin');
    expect(typeof meta.minPasswordLength).toBe('number');
    expect(meta.features).toMatchObject({
      userManagement: expect.any(Boolean),
      twoFactor: expect.any(Boolean),
      auditLog: expect.any(Boolean),
      sessions: expect.any(Boolean),
    });
  });

  it('login() with admin credentials returns the admin UserResponse', () => {
    // Asserted on the shared login from beforeAll (avoids an extra admin login).
    expect(adminLoginResult.email).toBe(ADMIN_EMAIL);
    expect(adminLoginResult.role).toBe('admin');
    expect(adminLoginResult.disabled).toBe(false);
    expect(typeof adminLoginResult.id).toBe('string');
  });

  it('login() with a wrong password rejects with AuthkitError 401 and a non-empty code', async () => {
    const client = makeRealClient();

    let caught: unknown;
    try {
      await client.login({ email: ADMIN_EMAIL, password: 'definitely-not-the-password' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AuthkitError);
    const authErr = caught as AuthkitError;
    expect(authErr.status).toBe(401);
    expect(authErr.code).toBeTruthy();
    expect(authErr.code.length).toBeGreaterThan(0);
  });

  it('getMe() on the shared session returns the user (cookie jar carries the session)', async () => {
    const me = await admin.getMe();
    expect(me.email).toBe(ADMIN_EMAIL);
    expect(me.role).toBe('admin');
  });

  it('getRecoveryCodesStatus() unauthenticated rejects with 401', async () => {
    const client = makeRealClient();
    let caught: unknown;
    try {
      await client.getRecoveryCodesStatus();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AuthkitError);
    expect((caught as AuthkitError).status).toBe(401);
  });

  it('getRecoveryCodesStatus() for an authenticated admin without 2FA rejects (not_enrolled, 409)', async () => {
    // Security contract: the GET endpoint returns a COUNT ({ remaining: number }),
    // never the codes themselves — but only once 2FA is enrolled. The seeded admin
    // has no 2FA, so an authenticated call rejects with `not_enrolled` (409) rather
    // than leaking anything. The enrolled `{ remaining }` path is covered by the
    // Playwright 2FA suite. This proves the endpoint is auth'd AND never returns a
    // `recoveryCodes` array.
    expect(adminLoginResult.twoFactorEnabled).toBe(false);

    let caught: unknown;
    try {
      await admin.getRecoveryCodesStatus();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AuthkitError);
    const err = caught as AuthkitError;
    expect(err.status).toBe(409);
    expect(err.code).toBe('not_enrolled');
  });

  it('logout() then getMe() rejects with AuthkitError 401', async () => {
    // Own session so logging out does not disturb the shared admin client.
    const client = makeRealClient();
    await loginWithRetry(client, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    const bye = await client.logout();
    expect(bye).toHaveProperty('message');

    let caught: unknown;
    try {
      await client.getMe();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AuthkitError);
    expect((caught as AuthkitError).status).toBe(401);
  });
});
