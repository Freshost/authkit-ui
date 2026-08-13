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

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter by user' }), {
      target: { value: 'Jane Doe' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'User' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'IP address' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Filter by IP address' }), {
      target: { value: '203.0.113' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'IP address' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Method' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filter by method' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remember me' }));

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

    expect(screen.getByText('Jane Doe', { selector: '.pf-v6-c-label__text' })).toBeInTheDocument();
    expect(screen.getByText('203.0.113', { selector: '.pf-v6-c-label__text' })).toBeInTheDocument();
    expect(screen.getByText('Remember me', { selector: '.pf-v6-c-label__text' })).toBeInTheDocument();
  });
});
