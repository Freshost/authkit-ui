import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { AdminLoginPage, AdminLoginQuery } from '../api/types';
import { useAuthkit } from '../provider';
import { authkitKeys } from './useAuth';

/** Loads one server-paginated page of successful sign-ins across the guard. */
export function useAdminLogins(query: AdminLoginQuery = {}): UseQueryResult<AdminLoginPage, unknown> {
  const { client } = useAuthkit();
  return useQuery({
    queryKey: authkitKeys.adminLogins(query),
    queryFn: () => client.listAdminLogins(query),
    placeholderData: (previous) => previous,
  });
}
