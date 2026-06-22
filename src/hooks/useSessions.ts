import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { LoginHistoryEntry, MessageResponse, SessionResponse } from '../api/types';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { messageFrom } from '../utils';
import { authkitKeys } from './useAuth';

/** The current user's recent successful sign-ins. */
export function useLoginHistory(): UseQueryResult<LoginHistoryEntry[], unknown> {
  const { client } = useAuthkit();
  return useQuery({
    queryKey: authkitKeys.logins,
    queryFn: () => client.getLoginHistory(),
    retry: false,
    staleTime: 30_000,
  });
}

/** The current user's active sessions (the current one is flagged). */
export function useSessions(): UseQueryResult<SessionResponse[], unknown> {
  const { client } = useAuthkit();
  return useQuery({
    queryKey: authkitKeys.sessions,
    queryFn: () => client.listSessions(),
    retry: false,
    staleTime: 30_000,
  });
}

/** Terminates one other session, then refreshes the list. */
export function useTerminateSession(): UseMutationResult<MessageResponse, unknown, string> {
  const { client, notify } = useAuthkit();
  const { t } = useTranslation(AUTHKIT_NS);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.terminateSession(id),
    onSuccess: () => {
      notify.success(t('sessions.terminated'));
      void queryClient.invalidateQueries({ queryKey: authkitKeys.sessions });
    },
    onError: (err) => notify.error(messageFrom(err, t('sessions.error'))),
  });
}

/** Signs out every other session, then refreshes the list. */
export function useTerminateOtherSessions(): UseMutationResult<MessageResponse, unknown, void> {
  const { client, notify } = useAuthkit();
  const { t } = useTranslation(AUTHKIT_NS);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.terminateOtherSessions(),
    onSuccess: () => {
      notify.success(t('sessions.othersTerminated'));
      void queryClient.invalidateQueries({ queryKey: authkitKeys.sessions });
    },
    onError: (err) => notify.error(messageFrom(err, t('sessions.error'))),
  });
}
