import { useQuery } from '@tanstack/react-query';

import { getBranchQr } from '../api/businessApi';
import { businessKeys } from './queryKeys';

/** Keeps the displayed QR current: refetches right when the server says it rotates. */
export const useBranchQr = (branchId: string) =>
  useQuery({
    queryKey: businessKeys.branchQr(branchId),
    queryFn: () => getBranchQr(branchId),
    enabled: Boolean(branchId),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: query => {
      const refreshAt = query.state.data?.refreshAt;
      if (!refreshAt) return 5_000;
      return Math.max(1_000, new Date(refreshAt).getTime() - Date.now() + 250);
    },
    refetchIntervalInBackground: false,
  });
