import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AuthkitClient } from '../api/client';
import type { MetaResponse, UserResponse } from '../api/types';
import { renderWithAuthkit } from '../test/integration';
import { AccountPage } from './AccountPage';

const user: UserResponse = {
  id: 'target-id', email: 'user@example.com', name: 'User', role: 'user',
  twoFactorEnabled: false, disabled: false, createdAt: '2026-01-01T00:00:00Z',
};

function renderAccount(impersonating: boolean, allowActions?: boolean, allowCreation = false) {
  const meta: MetaResponse = {
    roles: ['admin', 'user'], minPasswordLength: 8,
    features: {
      userManagement: true, twoFactor: true, auditLog: false, sessions: false,
      impersonation: true, apiTokens: true, impersonationSensitiveActions: allowActions,
    },
    apiTokens: { allowedScopes: ['dns:acme'], defaultLifetimeDays: 30, maxLifetimeDays: 365, maxPerUser: 10, allowImpersonatedCreation: allowCreation },
  };
  const client = {
    getMeta: vi.fn().mockResolvedValue(meta),
    getMe: vi.fn().mockResolvedValue({
      ...user,
      twoFactorEnabled: allowCreation,
      ...(impersonating ? { impersonatedBy: { guard: 'admin', id: 'actor-id', email: 'admin@example.com' } } : {}),
    }),
    listAPITokens: vi.fn().mockResolvedValue([]),
    createAPIToken: vi.fn().mockResolvedValue({ id: 'token-id', name: 'CLI', scopes: [], expiresAt: '2027-01-01T00:00:00Z', createdAt: '2026-11-04T00:00:00Z', lastUsedAt: null, token: 'test-token' }),
  } as unknown as AuthkitClient;
  renderWithAuthkit(<AccountPage />, { client });
  return client;
}

describe('AccountPage impersonation capabilities', () => {
  it('creates a delegated PAT without requesting or sending target credentials', async () => {
    const client = renderAccount(true, true, true);
    fireEvent.click(await screen.findByRole('button', { name: 'Create token' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create API token' });
    expect(dialog.querySelector('input[type="password"]')).toBeNull();
    expect(dialog.querySelector('#authkit-token-2fa')).toBeNull();
    fireEvent.change(dialog.querySelector('#authkit-token-name')!, { target: { value: 'CLI' } });
    fireEvent.submit(dialog.querySelector('form')!);
    await waitFor(() => expect(client.createAPIToken).toHaveBeenCalled());
    const payload = vi.mocked(client.createAPIToken).mock.calls[0]![0];
    expect(payload.name).toBe('CLI');
    expect(payload).not.toHaveProperty('password');
    expect(payload).not.toHaveProperty('twoFactorCode');
  });

  it('retains password confirmation for direct login even when delegation is enabled', async () => {
    renderAccount(false, true, true);
    fireEvent.click(await screen.findByRole('button', { name: 'Create token' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create API token' });
    expect(dialog.querySelector('input[type="password"]')).toBeRequired();
  });
  it('keeps PAT and password actions available for a directly signed-in regular user', async () => {
    renderAccount(false);
    expect(await screen.findByRole('button', { name: 'Create token' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Change password' })).toBeVisible();
  });

  it.each([undefined, false])('retains the configured lockout when allow actions is %s', async (allowActions) => {
    const client = renderAccount(true, allowActions);
    await screen.findByDisplayValue(user.email);
    await waitFor(() => expect(client.getMeta).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Create token' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change password' })).not.toBeInTheDocument();
    expect(client.listAPITokens).not.toHaveBeenCalled();
  });

  it('shows the normal PAT creation form and password action when the backend permits them', async () => {
    const client = renderAccount(true, true);
    const create = await screen.findByRole('button', { name: 'Create token' });
    expect(screen.getByRole('button', { name: 'Change password' })).toBeVisible();
    fireEvent.click(create);
    expect(await screen.findByRole('dialog', { name: 'Create API token' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'dns:acme' })).toBeVisible();
    expect(client.listAPITokens).toHaveBeenCalled();
  });
});
