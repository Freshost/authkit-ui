import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResult,
  MessageResponse,
  TwoFactorChallengeRequest,
  UpdateProfileRequest,
  UserResponse,
} from '../api/types';
import { isTwoFactorRequired } from '../api/types';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { messageFrom } from '../utils';

/** Stable query keys used across the package. */
export const authkitKeys = {
  me: ['authkit', 'me'] as const,
  users: ['authkit', 'users'] as const,
  twoFactor: ['authkit', 'two-factor'] as const,
  config: ['authkit', 'config'] as const,
  sessions: ['authkit', 'sessions'] as const,
  logins: ['authkit', 'logins'] as const,
  apiTokens: ['authkit', 'api-tokens'] as const,
};

type MeQueryOptions = Omit<
  UseQueryOptions<UserResponse, unknown, UserResponse, typeof authkitKeys.me>,
  'queryKey' | 'queryFn'
>;

/**
 * The currently authenticated user. Errors (401) mean "not signed in" — the
 * query does not retry and is consumed by <AuthGuard>. Does not impose global
 * QueryClient defaults; only sets per-query `retry`/`staleTime`.
 */
export function useMe(options?: MeQueryOptions): UseQueryResult<UserResponse, unknown> {
  const { client } = useAuthkit();
  return useQuery({
    queryKey: authkitKeys.me,
    queryFn: () => client.getMe(),
    retry: false,
    staleTime: 60_000,
    ...options,
  });
}

/**
 * Password login. Resolves to a UserResponse (logged in, cache seeded) or a
 * `{ two_factor: true }` marker — inspect the result with `isTwoFactorRequired`
 * and follow up with {@link useTwoFactorChallenge}.
 */
export function useLogin(): UseMutationResult<LoginResult, unknown, LoginRequest> {
  const { client } = useAuthkit();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) => client.login(body),
    onSuccess: (result) => {
      if (!isTwoFactorRequired(result)) {
        queryClient.setQueryData(authkitKeys.me, result);
      }
    },
  });
}

/** Completes a two-step login with a TOTP or recovery code; seeds the user cache. */
export function useTwoFactorChallenge(): UseMutationResult<
  UserResponse,
  unknown,
  TwoFactorChallengeRequest
> {
  const { client } = useAuthkit();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TwoFactorChallengeRequest) => client.twoFactorChallenge(body),
    onSuccess: (user) => {
      queryClient.setQueryData(authkitKeys.me, user);
    },
  });
}

/** Logs out and clears the entire query cache. */
export function useLogout(): UseMutationResult<MessageResponse, unknown, void> {
  const { client } = useAuthkit();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/**
 * Updates the current user's own name and email. On success the returned user
 * seeds the `me` cache so the UI reflects the change immediately. Toasts result.
 */
export function useUpdateProfile(): UseMutationResult<UserResponse, unknown, UpdateProfileRequest> {
  const { client, notify } = useAuthkit();
  const { t } = useTranslation(AUTHKIT_NS);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => client.updateProfile(body),
    onSuccess: (user) => {
      queryClient.setQueryData(authkitKeys.me, user);
      notify.success(t('profile.success'));
    },
    onError: (err) => notify.error(messageFrom(err, t('profile.error'))),
  });
}

/**
 * Changes the current user's password. On success the backend signs out every
 * OTHER session; this session stays valid. Surfaces a success/error toast.
 */
export function useChangePassword(): UseMutationResult<
  MessageResponse,
  unknown,
  ChangePasswordRequest
> {
  const { client, notify } = useAuthkit();
  const { t } = useTranslation(AUTHKIT_NS);
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => client.changePassword(body),
    onSuccess: () => notify.success(t('account.success')),
    onError: (err) => notify.error(messageFrom(err, t('account.error'))),
  });
}
