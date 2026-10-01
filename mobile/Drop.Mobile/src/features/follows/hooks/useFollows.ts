import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { registerPushToken } from '@/features/notifications/pushRegistration';

import { type FollowedBusiness, followBusiness, getFollows, unfollowBusiness } from '../api/followApi';

const followsKey = ['follows'] as const;

export const useFollows = () =>
  useQuery({
    queryKey: followsKey,
    queryFn: getFollows,
    staleTime: 5 * 60_000,
  });

type Variables = { businessId: string; name: string; follow: boolean };

/** Optimistic: the button flips at once and rolls back if the request fails. */
export const useToggleFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ businessId, follow }: Variables) =>
      follow ? followBusiness(businessId) : unfollowBusiness(businessId),

    onMutate: async ({ businessId, name, follow }) => {
      await queryClient.cancelQueries({ queryKey: followsKey });
      const previous = queryClient.getQueryData<FollowedBusiness[]>(followsKey);

      queryClient.setQueryData<FollowedBusiness[]>(followsKey, (current = []) =>
        follow
          ? [{ businessId, name, followedAt: new Date().toISOString() }, ...current.filter(x => x.businessId !== businessId)]
          : current.filter(x => x.businessId !== businessId),
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      queryClient.setQueryData(followsKey, context?.previous);
    },

    onSuccess: (_data, { follow }) => {
      // Following is when a push permission prompt makes sense to the user.
      if (follow) void registerPushToken({ askPermission: true });
    },

    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: followsKey }),
        // The business page shows the follower count.
        queryClient.invalidateQueries({ queryKey: ['business-profile'] }),
      ]),
  });
};
