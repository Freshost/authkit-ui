import { clientIp, expect, test } from './fixtures';

import {
  createUserViaApi,
  deleteUserViaApi,
  fillAndSubmitLogin,
  newApiRequest,
  type ThrowawayUser,
} from './helpers';

test.describe('account page (throwaway user)', () => {
  let user: ThrowawayUser;

  // Provision a throwaway user via the API in a short-lived admin request
  // context. Never touches the shared admin's own record.
  test.beforeEach(async ({ playwright }) => {
    const request = await newApiRequest(playwright);
    user = await createUserViaApi(request, { name: 'Account Test' });
    await request.dispose();
  });

  test.afterEach(async ({ playwright }) => {
    if (!user) return;
    const request = await newApiRequest(playwright);
    await deleteUserViaApi(request, user.id);
    await request.dispose();
  });

  test('the throwaway user can change ITS own password', async ({ page }) => {
    const newPassword = 'newpassword456';

    // Log in AS the throwaway user (fresh context, isolated cookies).
    await page.goto('/login');
    await fillAndSubmitLogin(page, user.email, user.password);
    await expect(page).toHaveURL(/\/$/);

    // Go to the account page and change the password. ("Change password" is a
    // card title; the submit button carries the same accessible name.)
    await page.goto('/account');
    await expect(page.getByRole('button', { name: 'Change password', exact: true })).toBeVisible();

    await page.locator('#authkit-cp-current').fill(user.password);
    await page.locator('#authkit-cp-new').fill(newPassword);
    await page.locator('#authkit-cp-confirm').fill(newPassword);
    await page.getByRole('button', { name: 'Change password', exact: true }).click();

    // Success surfaces as a toast alert.
    await expect(
      page.getByText('Password changed. Other sessions have been signed out.'),
    ).toBeVisible();

    // Prove the new password works: changing it signs out other sessions, so
    // re-login with the NEW password from a fresh context.
    const fresh = await page.context().browser()!.newContext({
      extraHTTPHeaders: { 'X-Forwarded-For': clientIp() },
    });
    const freshPage = await fresh.newPage();
    await freshPage.goto('/login');
    await fillAndSubmitLogin(freshPage, user.email, newPassword);
    await expect(freshPage).toHaveURL(/\/$/);
    await expect(freshPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await fresh.close();
  });

  test('the throwaway user can create and revoke an API token', async ({ page }) => {
    await page.goto('/login');
    await fillAndSubmitLogin(page, user.email, user.password);
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/account');

    await page.getByRole('button', { name: 'Create token', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Create API token' });
    await createDialog.locator('#authkit-token-name').fill('Playwright CLI');
    const expires = new Date();
    expires.setUTCDate(expires.getUTCDate() + 7);
    await createDialog.locator('#authkit-token-expiry').fill(expires.toISOString().slice(0, 10));
    await createDialog.getByLabel('profile:read').check();
    await createDialog.locator('#authkit-token-password').fill(user.password);
    await createDialog.getByRole('button', { name: 'Create token', exact: true }).click();

    const issuedDialog = page.getByRole('dialog', { name: 'Copy your API token' });
    await expect(issuedDialog.getByText('Copy this token now. It will not be shown again.')).toBeVisible();
    await expect(issuedDialog.locator('pre')).toContainText('gak_');
    await issuedDialog.getByRole('contentinfo').getByRole('button', { name: 'Close' }).click();

    const row = page.getByRole('row').filter({ hasText: 'Playwright CLI' });
    await expect(row).toContainText('profile:read');
    await row.getByRole('button', { name: 'Revoke' }).click();
    const revokeDialog = page.getByRole('dialog', { name: 'Revoke Playwright CLI?' });
    await revokeDialog.getByRole('button', { name: 'Revoke' }).click();
    await expect(row).toHaveCount(0);
  });
});
