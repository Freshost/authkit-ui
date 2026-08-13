import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AuthkitClient } from '../api/client';
import type { AdminLoginPage } from '../api/types';
import { renderWithAuthkit } from '../test/integration';
import { AdminLoginsCard } from './AdminLoginsCard';

describe('AdminLoginsCard', () => {
  it('shows recent sign-ins and delegates the full-history action', async () => {
    const page: AdminLoginPage = {
      items: [
        {
          id: 'event-1',
          userId: 'user-1',
          userName: 'Jane Doe',
          userEmail: 'jane@example.com',
          action: 'auth.login',
          ip: '203.0.113.7',
          createdAt: '2026-08-13T10:00:00Z',
        },
      ],
      page: 1,
      perPage: 3,
      total: 12,
      totalPages: 4,
    };
    const client = {
      listAdminLogins: vi.fn().mockResolvedValue(page),
    } as unknown as AuthkitClient;
    const onViewAll = vi.fn();

    renderWithAuthkit(<AdminLoginsCard limit={3} onViewAll={onViewAll} />, { client });

    await screen.findByText('Jane Doe');
    const card = screen.getByRole('region', { name: 'Recent user sign-ins' });
    expect(card).toHaveTextContent('Jane Doe');
    expect(card).toHaveTextContent('jane@example.com');
    expect(card).toHaveTextContent('203.0.113.7');
    expect(card).toHaveTextContent('12 total');
    expect(client.listAdminLogins).toHaveBeenCalledWith({ page: 1, perPage: 3, sort: 'desc' });

    fireEvent.click(screen.getByRole('button', { name: 'View all sign-ins' }));
    expect(onViewAll).toHaveBeenCalledOnce();
  });
});
