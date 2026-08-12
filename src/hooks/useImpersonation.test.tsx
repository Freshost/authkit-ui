import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AuthkitClient } from '../api/client';
import type { UserResponse } from '../api/types';
import { authkitHookWrapper, makeQueryClient } from '../test/integration';
import { authkitKeys } from './useAuth';
import { useImpersonate, useStopImpersonating } from './useImpersonation';

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

function clientWith(overrides: Partial<AuthkitClient>): AuthkitClient {
  return overrides as AuthkitClient;
}

describe('impersonation hooks', () => {
  it('clears host data and seeds the target for same-guard impersonation', async () => {
    const client = clientWith({ impersonate: vi.fn().mockResolvedValue(target) });
    const queryClient = makeQueryClient();
    queryClient.setQueryData(['host', 'secret'], { value: 'actor-only' });
    const wrapper = authkitHookWrapper({ client, queryClient });
    const { result } = renderHook(() => useImpersonate(), { wrapper });

    await result.current.mutateAsync({ userId: target.id });

    expect(client.impersonate).toHaveBeenCalledWith({ userId: target.id });
    expect(queryClient.getQueryData(['host', 'secret'])).toBeUndefined();
    expect(queryClient.getQueryData(authkitKeys.me)).toEqual(target);
  });

  it('does not seed the actor guard cache for cross-guard impersonation', async () => {
    const client = clientWith({ impersonate: vi.fn().mockResolvedValue(target) });
    const queryClient = makeQueryClient();
    const wrapper = authkitHookWrapper({ client, queryClient });
    const { result } = renderHook(() => useImpersonate(), { wrapper });

    await result.current.mutateAsync({ guard: 'client', userId: target.id });

    expect(queryClient.getQueryData(authkitKeys.me)).toBeUndefined();
  });

  it('restores and caches the actor after stopping impersonation', async () => {
    const client = clientWith({
      stopImpersonating: vi.fn().mockResolvedValue({ message: 'stopped' }),
      getMe: vi.fn().mockResolvedValue(actor),
    });
    const queryClient = makeQueryClient();
    queryClient.setQueryData(authkitKeys.me, target);
    queryClient.setQueryData(['host', 'target-data'], true);
    const wrapper = authkitHookWrapper({ client, queryClient });
    const { result } = renderHook(() => useStopImpersonating(), { wrapper });

    const restored = await result.current.mutateAsync();

    expect(restored).toEqual(actor);
    expect(client.stopImpersonating).toHaveBeenCalledOnce();
    expect(client.getMe).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(['host', 'target-data'])).toBeUndefined();
    expect(queryClient.getQueryData(authkitKeys.me)).toEqual(actor);
  });

  it('does not fetch me after stopping a cross-guard impersonation', async () => {
    const client = clientWith({
      stopImpersonating: vi.fn().mockResolvedValue({ message: 'stopped' }),
      getMe: vi.fn(),
    });
    const queryClient = makeQueryClient();
    queryClient.setQueryData(authkitKeys.me, target);
    const wrapper = authkitHookWrapper({ client, queryClient });
    const { result } = renderHook(
      () => useStopImpersonating({ restoreActor: false }),
      { wrapper },
    );

    const restored = await result.current.mutateAsync();

    expect(restored).toBeNull();
    expect(client.getMe).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(authkitKeys.me)).toBeUndefined();
  });
});
