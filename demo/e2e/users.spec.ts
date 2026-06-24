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
});
