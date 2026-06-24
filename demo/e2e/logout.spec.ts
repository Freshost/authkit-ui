import { expect, test } from './fixtures';

import { ADMIN, loginViaUi } from './helpers';

test.describe('logout', () => {
  test('user menu -> sign out returns to /login', async ({ page }) => {
    await loginViaUi(page, ADMIN.email, ADMIN.password);

    // Open the user menu (the toggle is labelled with the signed-in name/email).
    await page.getByRole('button', { name: /Admin1|admin@demo\.test/ }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });

  test('protected routes redirect to /login when signed out', async ({ page }) => {
    await loginViaUi(page, ADMIN.email, ADMIN.password);

    await page.getByRole('button', { name: /Admin1|admin@demo\.test/ }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Now a protected route should bounce back to /login.
    await page.goto('/users');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

    await page.goto('/account');
    await expect(page).toHaveURL(/\/login$/);
  });
});
