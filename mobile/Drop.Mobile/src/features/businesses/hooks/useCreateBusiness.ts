import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createBusiness } from '../api/businessApi';
import { businessKeys } from './queryKeys';

export const useCreateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBusiness,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: businessKeys.mine }),
  });
};
