import { expect, test } from './fixtures';

import { ADMIN, fillAndSubmitLogin } from './helpers';

// Each test gets its own browser context (Playwright's default per-test
// isolation), so cookies never leak between tests.

test.describe('login', () => {
  test('valid admin login navigates to the dashboard', async ({ page }) => {
    await page.goto('/login');
    await fillAndSubmitLogin(page, ADMIN.email, ADMIN.password);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    // The dashboard greets the signed-in admin by email.
    await expect(page.getByText(`Signed in as ${ADMIN.email}`)).toBeVisible();
  });

  test('invalid password shows the error and stays on /login', async ({ page }) => {
    await page.goto('/login');
    await fillAndSubmitLogin(page, ADMIN.email, 'definitely-wrong-password');

    // Web-first assertion waits for the error helper text to appear.
    await expect(
      page.getByText('Sign in failed. Check your email and password.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a transport failure is not reported as an invalid password', async ({ page }) => {
    await page.route('**/auth/login', (route) => route.abort('failed'));
    await page.goto('/login');
    await fillAndSubmitLogin(page, ADMIN.email, ADMIN.password);

    await expect(
      page.getByText('Cannot connect to the server. Check your connection and try again.'),
    ).toBeVisible();
    await expect(
      page.getByText('Sign in failed. Check your email and password.'),
    ).not.toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('remember-me is a Switch and can be toggled', async ({ page }) => {
    await page.goto('/login');
    const remember = page.getByRole('switch', { name: 'Keep me signed in' });
    await expect(remember).toBeVisible();
    await expect(remember).not.toBeChecked();
    // The visual toggle span intercepts pointer events on the input, so click
    // the associated label text to flip the switch.
    const rememberLabel = page.locator('label[for="authkit-login-remember"]');
    await rememberLabel.click();
    await expect(remember).toBeChecked();
    await rememberLabel.click();
    await expect(remember).not.toBeChecked();
  });

  test('show/hide password toggles the input type and aria-label', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('#authkit-login-password');
    await passwordInput.fill('some-secret');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const showBtn = page.getByRole('button', { name: 'Show password' });
    await expect(showBtn).toBeVisible();
    await showBtn.click();

    await expect(passwordInput).toHaveAttribute('type', 'text');
    const hideBtn = page.getByRole('button', { name: 'Hide password' });
    await expect(hideBtn).toBeVisible();
    await hideBtn.click();

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible();
  });

  test('login page theme toggle switches the dark class on <html>', async ({ page }) => {
    await page.goto('/login');
    const html = page.locator('html');

    // Start from a known state: pick Light first.
    const themeToggle = page.getByRole('button', { name: 'Theme' });
    await themeToggle.click();
    await page.getByRole('menuitem', { name: 'Light' }).click();
    await expect(html).not.toHaveClass(/pf-v6-theme-dark/);

    // Now switch to Dark and assert the class is applied.
    await themeToggle.click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();
    await expect(html).toHaveClass(/pf-v6-theme-dark/);

    // And back to Light removes it again.
    await themeToggle.click();
    await page.getByRole('menuitem', { name: 'Light' }).click();
    await expect(html).not.toHaveClass(/pf-v6-theme-dark/);
  });
});
