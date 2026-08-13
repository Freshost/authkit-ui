import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AuthkitClient } from '../api/client';
import type { UserResponse } from '../api/types';
import { renderWithAuthkit } from '../test/integration';
import { ImpersonationBanner } from './ImpersonationBanner';

const actor: UserResponse = {
  id: 'actor-id',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'admin',
  twoFactorEnabled: false,
  disabled: false,
  createdAt: '2026-01-01T00:00:00Z',
};

const target: UserResponse = {
  id: 'target-id',
  email: 'user@example.com',
  name: 'User',
  role: 'user',
  twoFactorEnabled: false,
  disabled: false,
  createdAt: '2026-01-01T00:00:00Z',
  impersonatedBy: { guard: 'admin', id: actor.id, email: actor.email },
};

describe('ImpersonationBanner', () => {
  it('renders a sticky status bar and restores the actor', async () => {
    const client = {
      getMe: vi.fn().mockResolvedValueOnce(target).mockResolvedValueOnce(actor),
      stopImpersonating: vi.fn().mockResolvedValue({ message: 'stopped' }),
    } as unknown as AuthkitClient;
    const onStopped = vi.fn();

    const { container } = renderWithAuthkit(
      <ImpersonationBanner className="host-banner" onStopped={onStopped} />,
      { client },
    );

    await screen.findByText('Acting as user@example.com');
    const banner = container.querySelector('.host-banner');
    expect(banner).toHaveClass('pf-v6-c-banner', 'pf-m-warning', 'pf-m-sticky');

    fireEvent.click(screen.getByRole('button', { name: 'Stop impersonating' }));

    await vi.waitFor(() => expect(onStopped).toHaveBeenCalledWith(actor));
    expect(client.stopImpersonating).toHaveBeenCalledOnce();
  });

  it('does not render outside an impersonation session', async () => {
    const client = {
      getMe: vi.fn().mockResolvedValue(actor),
    } as unknown as AuthkitClient;

    const { container } = renderWithAuthkit(<ImpersonationBanner />, { client });

    await vi.waitFor(() => expect(client.getMe).toHaveBeenCalledOnce());
    expect(container).toBeEmptyDOMElement();
  });
});
