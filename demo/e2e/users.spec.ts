import { expect, test } from './fixtures';

import { ADMIN, loginViaUi, THROWAWAY_PASSWORD, uniqueEmail } from './helpers';

test.describe('users management (admin)', () => {
  test('create, edit, then delete a throwaway user', async ({ page }) => {
    const email = uniqueEmail('users-crud');
    const name = 'CRUD User';
    const editedName = 'CRUD User Edited';

    await loginViaUi(page, ADMIN.email, ADMIN.password);
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();

    // The row for our throwaway user — scoped by its unique email so we never
    // depend on total counts or other rows.
    const ourRow = page.getByRole('row').filter({ hasText: email });

    // --- Create ---------------------------------------------------------
    await page.getByRole('button', { name: 'Add user' }).click();
    const createDialog = page.getByRole('dialog');
    // PatternFly FormGroup labels aren't <label htmlFor>, so target the stable
    // field ids the package assigns.
    await createDialog.locator('#authkit-user-email').fill(email);
    await createDialog.locator('#authkit-user-name').fill(name);
    await createDialog.locator('#authkit-user-password').fill(THROWAWAY_PASSWORD);
    await createDialog.getByRole('button', { name: 'Create' }).click();

    await expect(createDialog).toBeHidden();
    await expect(ourRow).toBeVisible();
    await expect(ourRow).toContainText(name);

    // --- Edit -----------------------------------------------------------
    await ourRow.getByRole('button', { name: 'Kebab toggle' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog.locator('#authkit-user-email')).toHaveValue(email);
    await editDialog.locator('#authkit-user-name').fill(editedName);
    await editDialog.getByRole('button', { name: 'Save' }).click();

    await expect(editDialog).toBeHidden();
    await expect(ourRow).toContainText(editedName);

    // --- Delete ---------------------------------------------------------
    await ourRow.getByRole('button', { name: 'Kebab toggle' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const deleteDialog = page.getByRole('dialog');
    await expect(deleteDialog).toContainText(email);
    await deleteDialog.getByRole('button', { name: 'Delete' }).click();

    await expect(deleteDialog).toBeHidden();
    await expect(ourRow).toHaveCount(0);
  });

  test('impersonate a user, show the persistent banner, then restore the admin', async ({ page }) => {
    const email = uniqueEmail('impersonation');

    await loginViaUi(page, ADMIN.email, ADMIN.password);
    await page.goto('/users');

    await page.getByRole('button', { name: 'Add user' }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.locator('#authkit-user-email').fill(email);
    await createDialog.locator('#authkit-user-name').fill('Impersonation Target');
    await createDialog.locator('#authkit-user-role').selectOption('user');
    await createDialog.locator('#authkit-user-password').fill(THROWAWAY_PASSWORD);
    await createDialog.getByRole('button', { name: 'Create' }).click();

    const targetRow = page.getByRole('row').filter({ hasText: email });
    await expect(targetRow).toBeVisible();
    await targetRow.getByRole('button', { name: 'Kebab toggle' }).click();
    await page.getByRole('menuitem', { name: 'Sign in as user' }).click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toContainText(email);
    const impersonateResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/v1/auth/impersonate'),
    );
    await confirmDialog.getByRole('button', { name: 'Sign in as user' }).click();
    const response = await impersonateResponse;
    expect(response.ok(), await response.text()).toBeTruthy();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(`You are signed in as ${email}`)).toBeVisible();
    await expect(page.getByText(`Original account: ${ADMIN.email}`)).toBeVisible();

    await page.reload();
    await expect(page.getByText(`You are signed in as ${email}`)).toBeVisible();
    const stopResponse = page.waitForResponse((response) =>
      response.url().endsWith('/api/v1/auth/impersonate/stop'),
    );
    await page.getByRole('button', { name: 'Stop impersonating' }).click();
    expect((await stopResponse).ok()).toBeTruthy();

    const restored = await page.evaluate(async () => {
      const response = await fetch('/api/v1/auth/me', { credentials: 'include' });
      return { ok: response.ok, body: await response.json() };
    });
    expect(restored.ok, JSON.stringify(restored.body)).toBeTruthy();
    expect(restored.body.email).toBe(ADMIN.email);

    await expect(page.getByText(`You are signed in as ${email}`)).toBeHidden();
    await expect(page.getByText(`Signed in as ${ADMIN.email}`)).toBeVisible();

    await page.goto('/users');
    const restoredRow = page.getByRole('row').filter({ hasText: email });
    await restoredRow.getByRole('button', { name: 'Kebab toggle' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(restoredRow).toHaveCount(0);
  });
});
