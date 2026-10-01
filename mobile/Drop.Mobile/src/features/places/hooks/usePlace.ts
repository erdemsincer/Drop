import { useQuery } from '@tanstack/react-query';

import { getPlace } from '../api/placeApi';

export const usePlace = (businessId: string) =>
  useQuery({
    queryKey: ['business-profile', businessId],
    queryFn: () => getPlace(businessId),
    enabled: Boolean(businessId),
  });
