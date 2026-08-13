import { expect, test } from './fixtures';

import { ADMIN, loginViaUi } from './helpers';

test.describe('administrator sign-in overview', () => {
  test('shows the signed-in user, time, method, and client IP', async ({ page, rateLimitIp }) => {
    await loginViaUi(page, ADMIN.email, ADMIN.password);

    const card = page.getByRole('region', { name: 'Recent user sign-ins' });
    await expect(card).toContainText(ADMIN.email);
    await expect(card).toContainText('Password');
    await expect(card).toContainText(rateLimitIp);
    await page.getByRole('button', { name: 'View all sign-ins' }).click();

    await expect(page).toHaveURL(/\/sign-ins$/);
    await expect(page.getByRole('heading', { name: 'User sign-ins' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toHaveCount(1);

    const row = page.getByRole('row').filter({ hasText: ADMIN.email }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText('Admin');
    await expect(row).toContainText('Password');
    await expect(row).toContainText(rateLimitIp);

    await page.getByRole('textbox', { name: 'Filter by user' }).fill(ADMIN.email);
    await expect(row).toBeVisible();

    await page.getByRole('button', { name: 'User', exact: true }).click();
    await page.getByRole('menuitem', { name: 'IP address', exact: true }).click();
    await page.getByRole('textbox', { name: 'Filter by IP address' }).fill(rateLimitIp);
    await expect(row).toBeVisible();

    await page.getByRole('button', { name: 'IP address', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Method', exact: true }).click();
    await page.getByRole('button', { name: 'Filter by method' }).click();
    await page.getByRole('menuitem', { name: 'Password', exact: true }).click();
    await expect(row).toBeVisible();

    await page.getByRole('button', { name: 'Date and time' }).click();
    await expect(page.getByRole('columnheader', { name: 'Date and time' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });
});
