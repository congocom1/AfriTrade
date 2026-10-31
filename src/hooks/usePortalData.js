import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';

/** Separate each account/tenant's cache and ignore responses from older keys. */
export function usePortalData(key, load, options = {}) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['portal', user?.id || user?.email || 'anonymous', user?.role || '', user?.tenant_id || '', ...key],
    queryFn: load,
    enabled: Boolean(user) && (options.enabled ?? true),
    retry: 1,
    staleTime: 15_000,
    refetchInterval: options.refreshInterval || false,
  });
  return { data: query.data, loading: query.isPending, error: query.error, reload: query.refetch, updatedAt: query.dataUpdatedAt };
}
