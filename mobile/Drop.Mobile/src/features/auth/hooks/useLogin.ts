import { useMutation } from '@tanstack/react-query';

import { authStorage } from '@/storage/authStorage';
import { login } from '../api/authApi';

export const useLogin = () =>
  useMutation({
    mutationFn: login,
    onSuccess: data => authStorage.setSession(data),
  });
