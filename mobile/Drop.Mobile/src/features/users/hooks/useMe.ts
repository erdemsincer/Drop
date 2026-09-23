import { useQuery } from '@tanstack/react-query';

import { getMe } from '../api/userApi';

export const useMe = () =>
  useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMe,
    staleTime: 5 * 60_000,
  });
