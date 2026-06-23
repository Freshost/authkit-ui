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
  MessageResponse,
  RecoveryCodesResponse,
  RecoveryCodesStatusResponse,
  TwoFactorConfirmRequest,
  TwoFactorDisableRequest,
  TwoFactorEnrollmentResponse,
} from '../api/types';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { messageFrom } from '../utils';
import { authkitKeys } from './useAuth';

/** Starts enrollment: returns the TOTP secret + otpauth URL to render as a QR code. */
export function useEnableTwoFactor(): UseMutationResult<TwoFactorEnrollmentResponse, unknown, void> {
  const { client } = useAuthkit();
  return useMutation({ mutationFn: () => client.enableTwoFactor() });
}

/** Confirms enrollment with a TOTP code; returns the one-time recovery codes. */
export function useConfirmTwoFactor(): UseMutationResult<
  RecoveryCodesResponse,
  unknown,
  TwoFactorConfirmRequest
> {
  const { client, notify } = useAuthkit();
  const { t } = useTranslation(AUTHKIT_NS);
  return useMutation({
    mutationFn: (body: TwoFactorConfirmRequest) => client.confirmTwoFactor(body),
    onSuccess: () => notify.success(t('twoFactor.enabledNotice')),
  });
}

/** Disables 2FA after re-authenticating with the account password. */
export function useDisableTwoFactor(): UseMutationResult<
  MessageResponse,
  unknown,
  TwoFactorDisableRequest
> {
  const { client, notify } = useAuthkit();
  const queryClient = useQueryClient();
  const { t } = useTranslation(AUTHKIT_NS);
  return useMutation({
    mutationFn: (body: TwoFactorDisableRequest) => client.disableTwoFactor(body),
    onSuccess: () => {
      notify.success(t('twoFactor.disabled'));
      void queryClient.invalidateQueries({ queryKey: authkitKeys.twoFactor });
    },
  });
}

type RecoveryCodesStatusQueryOptions = Omit<
  UseQueryOptions<
    RecoveryCodesStatusResponse,
    unknown,
    RecoveryCodesStatusResponse,
    typeof authkitKeys.twoFactor
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Fetches how many unused recovery codes remain. Codes are hashed at rest, so the
 * plaintext is only available from the confirm/regenerate result, never re-read.
 * Opt-in via `options.enabled`.
 */
export function useRecoveryCodesStatus(
  options?: RecoveryCodesStatusQueryOptions,
): UseQueryResult<RecoveryCodesStatusResponse, unknown> {
  const { client } = useAuthkit();
  return useQuery({
    queryKey: authkitKeys.twoFactor,
    queryFn: () => client.getRecoveryCodesStatus(),
    staleTime: 0,
    ...options,
  });
}

/** Regenerates recovery codes (invalidates the previous set); returns the new ones. */
export function useRegenerateRecoveryCodes(): UseMutationResult<
  RecoveryCodesResponse,
  unknown,
  void
> {
  const { client, notify } = useAuthkit();
  const queryClient = useQueryClient();
  const { t } = useTranslation(AUTHKIT_NS);
  return useMutation({
    mutationFn: () => client.regenerateRecoveryCodes(),
    onSuccess: () => {
      // The new plaintext codes are returned to the caller to display once; the
      // cached twoFactor status (remaining count) is refetched, never seeded with
      // plaintext (codes are hashed at rest and not re-readable).
      void queryClient.invalidateQueries({ queryKey: authkitKeys.twoFactor });
      notify.success(t('twoFactor.recoveryRegenerated'));
    },
    onError: (err) => notify.error(messageFrom(err, t('twoFactor.error'))),
  });
}
