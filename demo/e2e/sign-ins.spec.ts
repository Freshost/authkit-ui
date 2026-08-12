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

    const row = page.getByRole('row').filter({ hasText: ADMIN.email }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText('Admin');
    await expect(row).toContainText('Password');
    await expect(row).toContainText(rateLimitIp);
  });
});
