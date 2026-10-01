import { useQuery } from '@tanstack/react-query';

import { getMyStats } from '../api/userApi';

export const useMyStats = () =>
  useQuery({
    // Under "claims" so redeeming or rating a drop refreshes the totals too.
    queryKey: ['claims', 'stats'],
    queryFn: getMyStats,
  });
