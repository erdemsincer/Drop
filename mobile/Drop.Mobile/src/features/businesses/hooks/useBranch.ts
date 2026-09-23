import { useQuery } from '@tanstack/react-query';

import { getBranch } from '../api/businessApi';
import { businessKeys } from './queryKeys';

export const useBranch = (branchId: string) =>
  useQuery({
    queryKey: businessKeys.branch(branchId),
    queryFn: () => getBranch(branchId),
    enabled: Boolean(branchId),
  });
