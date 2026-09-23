import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getApiError } from '@/api/getApiError';
import { createBusiness } from '@/features/businesses/api/businessApi';
import { authStorage } from '@/storage/authStorage';

import { login, register, type RegisterRequest } from '../api/authApi';

export type BusinessSignupRequest = RegisterRequest & {
  businessName: string;
};

/**
 * Account + business in one step.
 * If the e-mail is already registered we sign in with the given password instead,
 * so existing customers can add a business, and a retry after a failed business
 * step (e.g. name taken) does not trip over the account created on the first try.
 */
export const useBusinessSignup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessName, ...account }: BusinessSignupRequest) => {
      try {
        await register(account);
      } catch (error) {
        if (getApiError(error)?.code !== 'auth.email_exists') throw error;
      }

      const session = await login({ email: account.email, password: account.password });
      await authStorage.setAccessToken(session.accessToken);

      return createBusiness({ name: businessName });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['businesses'] }),
  });
};
