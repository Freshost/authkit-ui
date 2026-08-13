import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AuthkitClient } from '../api/client';
import type { AdminLoginPage } from '../api/types';
import { authkitHookWrapper } from '../test/integration';
import { useAdminLogins } from './useAdminLogins';

describe('useAdminLogins', () => {
  it('uses a page-specific query and forwards pagination to the client', async () => {
    const page: AdminLoginPage = {
      items: [], page: 2, perPage: 50, total: 51, totalPages: 2,
    };
    const client = {
      listAdminLogins: vi.fn().mockResolvedValue(page),
    } as unknown as AuthkitClient;

    const query = {
      page: 2,
      perPage: 50,
      user: 'Jane',
      ip: '203.0.113',
      method: 'password' as const,
      sort: 'asc' as const,
    };
    const { result } = renderHook(() => useAdminLogins(query), {
      wrapper: authkitHookWrapper({ client }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.listAdminLogins).toHaveBeenCalledWith(query);
    expect(result.current.data).toEqual(page);
  });
});
