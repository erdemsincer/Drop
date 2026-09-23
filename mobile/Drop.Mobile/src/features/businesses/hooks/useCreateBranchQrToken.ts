import { useMutation } from '@tanstack/react-query';

import { createBranchQrToken } from '../api/businessApi';

export const useCreateBranchQrToken = () =>
  useMutation({
    mutationFn: createBranchQrToken,
  });
