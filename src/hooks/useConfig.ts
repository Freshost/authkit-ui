import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { MetaResponse } from '../api/types';
import { useAuthkit } from '../provider';
import { authkitKeys } from './useAuth';

type ConfigQueryOptions = Omit<
  UseQueryOptions<MetaResponse, unknown, MetaResponse, typeof authkitKeys.config>,
  'queryKey' | 'queryFn'
>;

/**
 * Fetches the backend's public frontend config ({prefix}/meta): the assignable
 * role options, feature flags and password rules. This is the single source of
 * truth — the UI reads roles from here instead of hardcoding them. Cached
 * effectively forever since config is static for the app's lifetime.
 */
export function useAuthkitConfig(
  options?: ConfigQueryOptions,
): UseQueryResult<MetaResponse, unknown> {
  const { client } = useAuthkit();
  return useQuery({
    queryKey: authkitKeys.config,
    queryFn: () => client.getMeta(),
    staleTime: Infinity,
    retry: false,
    ...options,
  });
}
