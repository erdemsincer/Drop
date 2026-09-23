import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/apiError';
import { getApiError } from '@/api/getApiError';
import { login, register } from '@/features/auth/api/authApi';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { AuthSwitchLink } from '@/features/auth/components/AuthSwitchLink';
import { BusinessSignupLink } from '@/features/auth/components/BusinessSignupLink';
import { type AuthFormErrors, validateRegister } from '@/features/auth/utils/authValidation';
import { useAuth } from '@/providers/AuthProvider';
import { authStorage } from '@/storage/authStorage';
import { Button, Notice, TextField, colors, haptics } from '@/ui';

const apiFields = ['Email', 'Password', 'FirstName', 'LastName'];

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});

  const { refresh } = useAuth();

  // Register, then sign straight in so the user lands in the app.
  const mutation = useMutation({
    mutationFn: async (request: Parameters<typeof register>[0]) => {
      await register(request);
      const session = await login({ email: request.email, password: request.password });
      await authStorage.setSession(session);
    },
    onSuccess: async () => {
      haptics.success();
      await refresh();
      router.replace('/(app)');
    },
    onError: () => haptics.error(),
  });

  const apiError = mutation.error ? getApiError(mutation.error) : null;

  const update = (field: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setFormErrors(errors => ({ ...errors, [field]: '' }));
  };

  const submit = () => {
    const errors = validateRegister(firstName, lastName, email, password);
    setFormErrors(errors);

    if (Object.keys(errors).length) {
      haptics.error();
      return;
    }

    mutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
    });
  };

  const fieldError = (name: string, apiName: string) =>
    formErrors[name] || (apiError ? getApiErrorMessage(apiError, apiName) : undefined);

  const hasFieldApiError = apiFields.some(name => apiError?.errors?.[name]?.length);

  const generalError = apiError
    ? hasFieldApiError
      ? null
      : apiError.code === 'auth.email_exists'
        ? 'Bu e-posta ile zaten bir hesap var.'
        : getApiErrorMessage(apiError)
    : mutation.isError
      ? 'Sunucuya ulaşılamadı. Bağlantını kontrol et.'
      : null;

  return (
    <AuthShell
      eyebrow="BİRKAÇ SANİYE SÜRER"
      title="Hesabını oluştur."
      subtitle="Yakınındaki anlık fırsatları ilk sen yakala."
      footer={
        <>
          <AuthSwitchLink
            prompt="Zaten hesabın var mı?"
            action="Giriş yap"
            onPress={() => router.replace('/(auth)/login')}
          />
          <BusinessSignupLink />
        </>
      }
    >
      <View style={styles.row}>
        <View style={styles.half}>
          <TextField
            label="Ad"
            icon="person-outline"
            value={firstName}
            onChangeText={update('firstName', setFirstName)}
            placeholder="Ad"
            autoComplete="given-name"
            error={hasFieldApiError ? fieldError('firstName', 'FirstName') : formErrors.firstName}
          />
        </View>
        <View style={styles.half}>
          <TextField
            label="Soyad"
            icon="person-outline"
            value={lastName}
            onChangeText={update('lastName', setLastName)}
            placeholder="Soyad"
            autoComplete="family-name"
            error={hasFieldApiError ? fieldError('lastName', 'LastName') : formErrors.lastName}
          />
        </View>
      </View>

      <TextField
        label="E-posta"
        icon="mail-outline"
        value={email}
        onChangeText={update('email', setEmail)}
        placeholder="ornek@drop.app"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        error={hasFieldApiError ? fieldError('email', 'Email') : formErrors.email}
      />

      <TextField
        label="Şifre"
        icon="lock-closed-outline"
        value={password}
        onChangeText={update('password', setPassword)}
        placeholder="En az 8 karakter"
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={hasFieldApiError ? fieldError('password', 'Password') : formErrors.password}
      />

      <PasswordStrength password={password} />

      {generalError && <Notice message={generalError} />}

      <Button
        title="Hesap Oluştur"
        trailingIcon="arrow-forward"
        loading={mutation.isPending}
        onPress={submit}
      />
    </AuthShell>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) && /[a-z]/.test(password) ? 1 : 0) +
    (/\d/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const palette = [colors.border, colors.danger, colors.warning, colors.success, colors.success];
  const labels = ['En az 8 karakter', 'Zayıf', 'Orta', 'Güçlü', 'Çok güçlü'];

  return (
    <View style={styles.strength}>
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3].map(index => (
          <View
            key={index}
            style={[
              styles.strengthBar,
              { backgroundColor: index < score ? palette[score] : colors.border },
            ]}
          />
        ))}
      </View>
      <Text style={styles.strengthLabel}>{labels[password ? score : 0]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  strength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    minWidth: 96,
    textAlign: 'right',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
