import { useQuery } from '@tanstack/react-query';

import { getDropDetail } from '../api/dropApi';

export const useDropDetail = (
  dropId: string,
) => {
  return useQuery({
    queryKey: ['drops', 'detail', dropId],

    queryFn: () =>
      getDropDetail(dropId),

    enabled: Boolean(dropId),

    staleTime: 10_000,
  });
};