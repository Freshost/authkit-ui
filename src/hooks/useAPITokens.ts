import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { APITokenResponse, CreateAPITokenRequest, IssuedAPITokenResponse, MessageResponse } from '../api/types';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { messageFrom } from '../utils';
import { authkitKeys } from './useAuth';

export function useAPITokens(): UseQueryResult<APITokenResponse[], unknown> {
  const { client } = useAuthkit();
  return useQuery({ queryKey: authkitKeys.apiTokens, queryFn: () => client.listAPITokens(), retry: false, staleTime: 30_000 });
}

export function useCreateAPIToken(): UseMutationResult<IssuedAPITokenResponse, unknown, CreateAPITokenRequest> {
  const { client, notify } = useAuthkit();
  const { t } = useTranslation(AUTHKIT_NS);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => client.createAPIToken(body),
    onSuccess: () => {
      notify.success(t('apiTokens.created'));
      void queryClient.invalidateQueries({ queryKey: authkitKeys.apiTokens });
    },
    onError: (err) => notify.error(messageFrom(err, t('apiTokens.error'))),
  });
}

export function useRevokeAPIToken(): UseMutationResult<MessageResponse, unknown, string> {
  const { client, notify } = useAuthkit();
  const { t } = useTranslation(AUTHKIT_NS);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.revokeAPIToken(id),
    onSuccess: () => {
      notify.success(t('apiTokens.revoked'));
      void queryClient.invalidateQueries({ queryKey: authkitKeys.apiTokens });
    },
    onError: (err) => notify.error(messageFrom(err, t('apiTokens.error'))),
  });
}

export function useRevokeAllAPITokens(): UseMutationResult<MessageResponse, unknown, void> {
  const { client, notify } = useAuthkit();
  const { t } = useTranslation(AUTHKIT_NS);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.revokeAllAPITokens(),
    onSuccess: () => {
      notify.success(t('apiTokens.allRevoked'));
      void queryClient.invalidateQueries({ queryKey: authkitKeys.apiTokens });
    },
    onError: (err) => notify.error(messageFrom(err, t('apiTokens.error'))),
  });
}
