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

function renderAccount(impersonating: boolean, allowActions?: boolean) {
  const meta: MetaResponse = {
    roles: ['admin', 'user'], minPasswordLength: 8,
    features: {
      userManagement: true, twoFactor: true, auditLog: false, sessions: false,
      impersonation: true, apiTokens: true, impersonationSensitiveActions: allowActions,
    },
    apiTokens: { allowedScopes: ['dns:acme'], defaultLifetimeDays: 30, maxLifetimeDays: 365, maxPerUser: 10 },
  };
  const client = {
    getMeta: vi.fn().mockResolvedValue(meta),
    getMe: vi.fn().mockResolvedValue({
      ...user,
      ...(impersonating ? { impersonatedBy: { guard: 'admin', id: 'actor-id', email: 'admin@example.com' } } : {}),
    }),
    listAPITokens: vi.fn().mockResolvedValue([]),
  } as unknown as AuthkitClient;
  renderWithAuthkit(<AccountPage />, { client });
  return client;
}

describe('AccountPage impersonation capabilities', () => {
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
