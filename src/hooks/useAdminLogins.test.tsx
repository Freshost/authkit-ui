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

    const { result } = renderHook(() => useAdminLogins(2, 50), {
      wrapper: authkitHookWrapper({ client }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.listAdminLogins).toHaveBeenCalledWith({ page: 2, perPage: 50 });
    expect(result.current.data).toEqual(page);
  });
});
