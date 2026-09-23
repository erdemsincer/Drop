import { useQuery } from '@tanstack/react-query';

import { getCurrentLocation } from '../services/locationService';

export const useCurrentLocation = () => {
  return useQuery({
    queryKey: ['current-location'],
    queryFn: getCurrentLocation,

    staleTime: 5 * 60 * 1000,

    retry: false,
  });
};