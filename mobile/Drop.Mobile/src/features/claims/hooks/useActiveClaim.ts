import { useQuery } from '@tanstack/react-query';

import { getActiveClaim } from '../api/claimApi';

export const useActiveClaim = () => {
  return useQuery({
    queryKey: ['claims', 'active'],

    queryFn: getActiveClaim,

    staleTime: 5_000,

    refetchInterval: 15_000,
  });
};
