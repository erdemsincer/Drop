import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authStorage } from '@/storage/authStorage';

import { changePassword, resendVerification, updateProfile, verifyEmail } from '../api/userApi';

const meKey = ['users', 'me'] as const;

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: me => queryClient.setQueryData(meKey, me),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: changePassword,
    // The old refresh token was revoked with every other session; keep this device signed in.
    onSuccess: session => authStorage.setSession(session),
  });

export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: meKey }),
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
      ]),
  });
};

export const useResendVerification = () => useMutation({ mutationFn: resendVerification });
