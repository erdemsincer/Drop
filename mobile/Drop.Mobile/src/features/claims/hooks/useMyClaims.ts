import { useQuery } from '@tanstack/react-query';

import { getMyClaims } from '../api/claimApi';

export const useMyClaims = () =>
  useQuery({
    queryKey: ['claims', 'mine'],
    queryFn: getMyClaims,
  });
