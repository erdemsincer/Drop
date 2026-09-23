import { useQuery } from '@tanstack/react-query';

import { getBranches } from '../api/businessApi';
import { businessKeys } from './queryKeys';

export const useBranches = (businessId: string) =>
  useQuery({
    queryKey: businessKeys.branches(businessId),
    queryFn: () => getBranches(businessId),
    enabled: Boolean(businessId),
  });
