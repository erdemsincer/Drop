import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addMember, getMembers, removeMember } from '../api/businessApi';
import type { AddMemberRequest } from '../types/business';
import { businessKeys } from './queryKeys';

export const useMembers = (businessId: string) =>
  useQuery({
    queryKey: businessKeys.members(businessId),
    queryFn: () => getMembers(businessId),
    enabled: Boolean(businessId),
  });

export const useAddMember = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddMemberRequest) => addMember(businessId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: businessKeys.members(businessId) }),
  });
};

export const useRemoveMember = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeMember(businessId, userId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: businessKeys.members(businessId) }),
        queryClient.invalidateQueries({ queryKey: businessKeys.mine }),
      ]),
  });
};
