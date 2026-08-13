import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AuthkitClient } from '../api/client';
import type { AdminLoginPage } from '../api/types';
import { renderWithAuthkit } from '../test/integration';
import { AdminLoginsPage } from './AdminLoginsPage';

describe('AdminLoginsPage', () => {
  it('applies attribute filters, sorts by date and renders one bottom paginator', async () => {
    const page: AdminLoginPage = {
      items: [
        {
          id: 'event-1',
          userId: 'user-1',
          userName: 'Jane Doe',
          userEmail: 'jane@example.com',
          action: 'auth.login_remember',
          ip: '203.0.113.7',
          createdAt: '2026-08-13T10:00:00Z',
        },
      ],
      page: 1,
      perPage: 20,
      total: 1,
      totalPages: 1,
    };
    const client = {
      listAdminLogins: vi.fn().mockResolvedValue(page),
    } as unknown as AuthkitClient;

    renderWithAuthkit(<AdminLoginsPage />, { client });

    await screen.findByText('Jane Doe');
    expect(client.listAdminLogins).toHaveBeenCalledWith({ page: 1, perPage: 20, sort: 'desc' });
    expect(screen.getAllByRole('navigation', { name: 'Pagination' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Date and time' }));
    await waitFor(() =>
      expect(client.listAdminLogins).toHaveBeenCalledWith({
        page: 1,
        perPage: 20,
        sort: 'asc',
      }),
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter user sign-ins' }), {
      target: { value: "user:'Jane Doe' ip:'203.0.113' method:remember" },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(client.listAdminLogins).toHaveBeenCalledWith({
        page: 1,
        perPage: 20,
        sort: 'asc',
        user: 'Jane Doe',
        ip: '203.0.113',
        method: 'remember',
      }),
    );
  });
});
