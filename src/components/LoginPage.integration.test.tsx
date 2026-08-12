// Integration test for the real <LoginPage> against the running backend: type the
// admin credentials, submit, and assert onSuccess fires with the real user.
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import type { UserResponse } from '../api/types';
import {
  makeRealClient,
  makeRealClientWithLoginRetry,
  renderWithAuthkit,
} from '../test/integration';
import { LoginPage } from './LoginPage';

const ADMIN_EMAIL = 'admin@demo.test';
const ADMIN_PASSWORD = 'password123';

describe('<LoginPage /> (real backend)', () => {
  it('renders remember-me Switch and show-password control with accessible names', () => {
    const client = makeRealClient();
    renderWithAuthkit(<LoginPage headerUtilities={<span>Language selector</span>} />, { client });

    // Switch label "Keep me signed in" (login.rememberMe).
    expect(screen.getByLabelText('Keep me signed in')).toBeInTheDocument();
    // Show/hide password toggle (login.showPassword) — accessible via aria-label.
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    expect(screen.getByText('Language selector')).toBeInTheDocument();
  });

  it('logs in the admin and fires onSuccess with the real backend user', async () => {
    const client = makeRealClientWithLoginRetry();
    const onSuccess = vi.fn<(user: UserResponse) => void>();
    const user = userEvent.setup();

    renderWithAuthkit(<LoginPage onSuccess={onSuccess} />, { client });

    const emailInput = screen.getByLabelText(/email/i);
    // Password field: query by id to avoid the label/aria-label collision with the
    // show-password button. import.meta.env.DEV is true under vitest, so the field
    // may be prefilled — clear & retype to be deterministic.
    const passwordInput = document.getElementById('authkit-login-password') as HTMLInputElement;

    await user.clear(emailInput);
    await user.type(emailInput, ADMIN_EMAIL);
    await user.clear(passwordInput);
    await user.type(passwordInput, ADMIN_PASSWORD);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Generous timeout: the real login round-trip may include rate-limit backoff.
    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      },
      { timeout: 15_000 },
    );

    const loggedIn = onSuccess.mock.calls[0]?.[0];
    expect(loggedIn?.email).toBe(ADMIN_EMAIL);
    expect(loggedIn?.role).toBe('admin');
  });
});
