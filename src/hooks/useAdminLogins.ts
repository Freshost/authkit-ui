import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { AdminLoginPage } from '../api/types';
import { useAuthkit } from '../provider';
import { authkitKeys } from './useAuth';

/** Loads one server-paginated page of successful sign-ins across the guard. */
export function useAdminLogins(page = 1, perPage = 20): UseQueryResult<AdminLoginPage, unknown> {
  const { client } = useAuthkit();
  return useQuery({
    queryKey: authkitKeys.adminLogins(page, perPage),
    queryFn: () => client.listAdminLogins({ page, perPage }),
  });
}
