import { useMutation, useQueryClient } from '@tanstack/react-query';

import { renameBusiness } from '../api/businessApi';

export const useRenameBusiness = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => renameBusiness(businessId, name),
    // The name shows on branch dashboards and customer drop cards too.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['branches'] }),
        queryClient.invalidateQueries({ queryKey: ['drops'] }),
      ]),
  });
};
