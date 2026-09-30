import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getBusinessStats } from '../api/businessApi';
import { businessKeys } from './queryKeys';

export const useBusinessStats = (businessId: string, days: number) =>
  useQuery({
    queryKey: businessKeys.stats(businessId, days),
    queryFn: () => getBusinessStats(businessId, days),
    // Switching the period keeps the old numbers on screen instead of flashing skeletons.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
