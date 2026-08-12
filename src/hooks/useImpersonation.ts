import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { ImpersonateRequest, UserResponse } from '../api/types';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { messageFrom } from '../utils';
import { authkitKeys } from './useAuth';

function removeQueriesExceptMe(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({
    predicate: (query) =>
      query.queryKey[0] !== authkitKeys.me[0] || query.queryKey[1] !== authkitKeys.me[1],
  });
}

/**
 * Starts impersonation through the current (actor) guard.
 *
 * For same-guard impersonation, omit `guard`; the returned target becomes the
 * current `me` value immediately. For cross-guard impersonation, pass `guard`
 * and navigate to the target portal in the mutation callback. The host owns
 * that navigation because only it knows the target guard's URL/client.
 */
export function useImpersonate(): UseMutationResult<
  UserResponse,
  unknown,
  ImpersonateRequest
> {
  const { client, notify } = useAuthkit();
  const queryClient = useQueryClient();
  const { t } = useTranslation(AUTHKIT_NS);

  return useMutation({
    mutationFn: (body) => client.impersonate(body),
    onSuccess: (user, request) => {
      // Identity changes invalidate every host query, not just Authkit data.
      // This follows logout's existing fail-safe behaviour and prevents actor
      // data remaining visible to the impersonated identity.
      if (!request.guard) {
        removeQueriesExceptMe(queryClient);
        queryClient.setQueryData(authkitKeys.me, user);
      } else {
        queryClient.removeQueries();
      }
      notify.success(t('impersonation.started', { email: user.email }));
    },
    onError: (err) => notify.error(messageFrom(err, t('impersonation.startError'))),
  });
}

export interface StopImpersonatingOptions {
  /** Fetch and cache the restored actor. Set false when leaving a cross-guard target portal. */
  restoreActor?: boolean;
}

/** Stops impersonation through the target guard and optionally restores its local actor. */
export function useStopImpersonating(
  options?: StopImpersonatingOptions,
): UseMutationResult<
  UserResponse | null,
  unknown,
  void
> {
  const { client, notify } = useAuthkit();
  const queryClient = useQueryClient();
  const { t } = useTranslation(AUTHKIT_NS);

  return useMutation({
    mutationFn: async () => {
      await client.stopImpersonating();
      return options?.restoreActor === false ? null : client.getMe();
    },
    onSuccess: (actor) => {
      if (actor) {
        removeQueriesExceptMe(queryClient);
        queryClient.setQueryData(authkitKeys.me, actor);
      } else {
        queryClient.removeQueries();
      }
      notify.success(t('impersonation.stopped'));
    },
    onError: (err) => notify.error(messageFrom(err, t('impersonation.stopError'))),
  });
}
