import { authenticator } from 'otplib';
import { type Page } from '@playwright/test';

import { expect, test } from './fixtures';
import {
  createUserViaApi,
  deleteUserViaApi,
  fillAndSubmitLogin,
  newApiRequest,
  type ThrowawayUser,
} from './helpers';

/**
 * Reads the displayed 2FA secret from the setup screen. It is rendered in a
 * <code> element right after the "Can't scan?" helper text (the only <code> on
 * screen at the confirm step). The backend hands out an unpadded base32 secret,
 * which is exactly what otplib expects.
 */
async function readDisplayedSecret(page: Page): Promise<string> {
  const secretLocator = page.locator('code').first();
  await expect(secretLocator).toBeVisible();
  const raw = (await secretLocator.textContent())?.replace(/\s+/g, '') ?? '';
  expect(raw.length).toBeGreaterThan(0);
  return raw;
}

/**
 * Computes a TOTP code, waiting for a fresh 30s window when there is little time
 * left — so a code is never reused across the confirm and challenge steps (the
 * backend rejects a replayed code).
 */
async function freshTotp(page: Page, secret: string): Promise<string> {
  await page.waitForFunction(
    () => 30 - (Math.floor(Date.now() / 1000) % 30) > 3,
    undefined,
    { timeout: 32_000 },
  );
  return authenticator.generate(secret);
}

test.describe('two-factor (throwaway user)', () => {
  let user: ThrowawayUser;

  test.beforeEach(async ({ playwright }) => {
    const request = await newApiRequest(playwright);
    user = await createUserViaApi(request, { name: 'TwoFactor Test' });
    await request.dispose();
  });

  test.afterEach(async ({ playwright }) => {
    const request = await newApiRequest(playwright);
    await deleteUserViaApi(request, user.id);
    await request.dispose();
  });

  test('enable -> confirm -> recovery codes, then 2FA challenge on next login', async ({ page }) => {
    // --- Sign in as the throwaway user ----------------------------------
    await page.goto('/login');
    await fillAndSubmitLogin(page, user.email, user.password);
    await expect(page).toHaveURL(/\/$/);

    // --- Walk the enable flow on the security page ----------------------
    await page.goto('/security');
    // "Set up two-factor authentication" is a card title; the start button
    // carries the same accessible name.
    const startButton = page.getByRole('button', { name: 'Set up two-factor authentication' });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // The QR + secret appears; capture the secret and confirm with a TOTP code.
    await expect(page.getByText("Can't scan? Enter this key manually:")).toBeVisible();
    const secret = await readDisplayedSecret(page);
    const confirmCode = await freshTotp(page, secret);

    await page.locator('#authkit-2fa-confirm').fill(confirmCode);
    await page.getByRole('button', { name: 'Confirm & enable' }).click();

    // --- Recovery codes are shown after a successful confirm ------------
    await expect(
      page.getByRole('heading', { name: 'Two-factor authentication is enabled' }),
    ).toBeVisible();
    await expect(page.getByText('Save these codes somewhere safe.', { exact: false })).toBeVisible();
    const recoveryItems = page.getByRole('listitem').filter({ has: page.locator('code') });
    expect(await recoveryItems.count()).toBeGreaterThan(1);

    // Dismiss the recovery codes -> panel flips to the "enabled" view. (Use the
    // exact "Close" button; a toast's "Close … alert" button also matches loosely.)
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByText('Two-factor authentication is enabled').first()).toBeVisible();

    // --- Sign out -------------------------------------------------------
    await page.goto('/');
    await page
      .getByRole('button', { name: new RegExp(`TwoFactor Test|${user.email.replace(/\./g, '\\.')}`) })
      .click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // --- Sign in again -> 2FA challenge appears -------------------------
    await fillAndSubmitLogin(page, user.email, user.password);
    await expect(
      page.getByText('Enter the 6-digit code from your authenticator app.'),
    ).toBeVisible();

    // A fresh TOTP code (new time window) completes the login.
    const challengeCode = await freshTotp(page, secret);
    await page.locator('#authkit-2fa-code').fill(challengeCode);
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
