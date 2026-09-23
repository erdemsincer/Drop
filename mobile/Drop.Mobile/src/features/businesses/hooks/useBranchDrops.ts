import { useQuery } from '@tanstack/react-query';

import { getBranchDrops } from '../api/businessApi';
import { businessKeys } from './queryKeys';

export const useBranchDrops = (branchId: string) =>
  useQuery({
    queryKey: businessKeys.branchDrops(branchId),
    queryFn: () => getBranchDrops(branchId),
    enabled: Boolean(branchId),
    refetchInterval: 30_000,
  });
