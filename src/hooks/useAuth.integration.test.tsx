// Integration tests for the real useAuth hooks against the running backend.
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { isTwoFactorRequired, type UserResponse } from '../api/types';
import {
  authkitHookWrapper,
  makeQueryClient,
  makeRealClientWithLoginRetry,
} from '../test/integration';
import { useLogin, useMe } from './useAuth';

const ADMIN_EMAIL = 'admin@demo.test';
const ADMIN_PASSWORD = 'password123';

describe('useAuth hooks (real backend)', () => {
  it('useLogin resolves the admin user and a subsequent useMe returns them', async () => {
    // Share one client + QueryClient across both hooks so the login session and
    // the seeded cache flow into useMe (mirrors real provider wiring).
    const client = makeRealClientWithLoginRetry();
    const queryClient = makeQueryClient();
    const wrapper = authkitHookWrapper({ client, queryClient });

    const { result: loginResult } = renderHook(() => useLogin(), { wrapper });

    const result = await loginResult.current.mutateAsync({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    expect(isTwoFactorRequired(result)).toBe(false);
    const user = result as UserResponse;
    expect(user.email).toBe(ADMIN_EMAIL);
    expect(user.role).toBe('admin');

    const { result: meResult } = renderHook(() => useMe(), { wrapper });

    await waitFor(() => {
      expect(meResult.current.isSuccess).toBe(true);
    });
    expect(meResult.current.data?.email).toBe(ADMIN_EMAIL);
  });
});
