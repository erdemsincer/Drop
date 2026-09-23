import { useQuery } from '@tanstack/react-query';

import { getMyBusinesses } from '../api/businessApi';
import { businessKeys } from './queryKeys';

export const useMyBusinesses = () =>
  useQuery({
    queryKey: businessKeys.mine,
    queryFn: getMyBusinesses,
  });
