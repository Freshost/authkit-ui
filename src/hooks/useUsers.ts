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
  CreateUserRequest,
  MessageResponse,
  SetPasswordRequest,
  UpdateUserRequest,
  UserResponse,
} from '../api/types';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { messageFrom } from '../utils';
import { authkitKeys } from './useAuth';

type UsersQueryOptions = Omit<
  UseQueryOptions<UserResponse[], unknown, UserResponse[], typeof authkitKeys.users>,
  'queryKey' | 'queryFn'
>;

/** Lists all users (requires the user-management endpoints to be enabled). */
export function useUsers(options?: UsersQueryOptions): UseQueryResult<UserResponse[], unknown> {
  const { client } = useAuthkit();
  return useQuery({
    queryKey: authkitKeys.users,
    queryFn: () => client.listUsers(),
    ...options,
  });
}

/** Shared success/error wiring: invalidate the list + toast. */
function useUsersMutationHandlers(successKey: string) {
  const { notify } = useAuthkit();
  const queryClient = useQueryClient();
  const { t } = useTranslation(AUTHKIT_NS);
  return {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authkitKeys.users });
      notify.success(t(successKey));
    },
    onError: (err: unknown) => notify.error(messageFrom(err, t('users.error'))),
  };
}

export function useCreateUser(): UseMutationResult<UserResponse, unknown, CreateUserRequest> {
  const { client } = useAuthkit();
  const handlers = useUsersMutationHandlers('users.created');
  return useMutation({ mutationFn: (body: CreateUserRequest) => client.createUser(body), ...handlers });
}

export function useUpdateUser(): UseMutationResult<
  UserResponse,
  unknown,
  { id: string; body: UpdateUserRequest }
> {
  const { client } = useAuthkit();
  const handlers = useUsersMutationHandlers('users.updated');
  return useMutation({
    mutationFn: ({ id, body }) => client.updateUser(id, body),
    ...handlers,
  });
}

export function useDeleteUser(): UseMutationResult<MessageResponse, unknown, string> {
  const { client } = useAuthkit();
  const handlers = useUsersMutationHandlers('users.deleted');
  return useMutation({ mutationFn: (id: string) => client.deleteUser(id), ...handlers });
}

export function useSetUserPassword(): UseMutationResult<
  UserResponse,
  unknown,
  { id: string; body: SetPasswordRequest }
> {
  const { client } = useAuthkit();
  const handlers = useUsersMutationHandlers('users.passwordReset');
  return useMutation({
    mutationFn: ({ id, body }) => client.setUserPassword(id, body),
    ...handlers,
  });
}
