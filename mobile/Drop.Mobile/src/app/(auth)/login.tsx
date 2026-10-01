import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { getApiErrorMessage } from '@/api/apiError';
import { getApiError } from '@/api/getApiError';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { SocialSignIn } from '@/features/auth/components/SocialSignIn';
import { AuthSwitchLink } from '@/features/auth/components/AuthSwitchLink';
import { BusinessSignupLink } from '@/features/auth/components/BusinessSignupLink';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { type AuthFormErrors, validateLogin } from '@/features/auth/utils/authValidation';
import { useAuth } from '@/providers/AuthProvider';
import { Button, Notice, TextField, colors, haptics } from '@/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});

  const { refresh } = useAuth();
  const loginMutation = useLogin();

  const apiError = loginMutation.error ? getApiError(loginMutation.error) : null;

  const handleLogin = () => {
    const errors = validateLogin(email, password);
    setFormErrors(errors);

    if (Object.keys(errors).length) {
      haptics.error();
      return;
    }

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: async () => {
          haptics.success();
          await refresh();
          router.replace('/(app)/(tabs)');
        },
        onError: () => haptics.error(),
      },
    );
  };

  const emailError =
    formErrors.email || (apiError ? getApiErrorMessage(apiError, 'Email') : undefined);
  const passwordError =
    formErrors.password || (apiError ? getApiErrorMessage(apiError, 'Password') : undefined);

  const generalError =
    apiError && !apiError.errors
      ? apiError.code === 'auth.invalid_credentials'
        ? 'E-posta veya şifre hatalı.'
        : getApiErrorMessage(apiError)
      : loginMutation.isError && !apiError
        ? 'Sunucuya ulaşılamadı. Bağlantını kontrol et.'
        : null;

  return (
    <AuthShell
      eyebrow="YAKININDAKİ FIRSATLAR"
      title="Tekrar hoş geldin."
      subtitle="Drop'ları yakalamak için hesabına giriş yap."
      footer={
        <>
          <AuthSwitchLink
            prompt="Hesabın yok mu?"
            action="Kayıt ol"
            onPress={() => router.push('/(auth)/register')}
          />
          <BusinessSignupLink />
        </>
      }
    >
      <TextField
        label="E-posta"
        icon="mail-outline"
        value={email}
        onChangeText={value => {
          setEmail(value);
          setFormErrors(errors => ({ ...errors, email: '' }));
        }}
        placeholder="ornek@drop.app"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
        error={apiError?.errors ? emailError : formErrors.email}
      />

      <TextField
        label="Şifre"
        icon="lock-closed-outline"
        value={password}
        onChangeText={value => {
          setPassword(value);
          setFormErrors(errors => ({ ...errors, password: '' }));
        }}
        placeholder="Şifren"
        secureTextEntry
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
        error={apiError?.errors ? passwordError : formErrors.password}
      />

      <Pressable
        accessibilityRole="link"
        hitSlop={8}
        style={styles.forgot}
        onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: { email: email.trim() } })}
      >
        <Text style={styles.forgotText}>Şifremi unuttum</Text>
      </Pressable>

      {generalError && <Notice message={generalError} />}

      <Button
        title="Giriş Yap"
        trailingIcon="arrow-forward"
        loading={loginMutation.isPending}
        onPress={handleLogin}
      />

      <SocialSignIn />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -6,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
