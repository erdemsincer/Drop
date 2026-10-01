import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useChangePassword } from '@/features/users/hooks/useAccountMutations';
import { useMe } from '@/features/users/hooks/useMe';
import { Button, Header, Notice, Screen, TextField, colors, haptics, radius, spacing } from '@/ui';

type Errors = { current?: string; next?: string; confirm?: string };

export default function ChangePasswordScreen() {
  const mutation = useChangePassword();
  // Apple/Google accounts set their first password without a current one.
  const hasPassword = useMe().data?.hasPassword ?? true;

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const submit = () => {
    const found: Errors = {
      current: current || !hasPassword ? undefined : 'Mevcut şifreni gir.',
      next:
        next.length < 8
          ? 'Yeni şifre en az 8 karakter olmalı.'
          : hasPassword && next === current
            ? 'Yeni şifre mevcut şifrenden farklı olmalı.'
            : undefined,
      confirm: confirm === next ? undefined : 'Şifreler eşleşmiyor.',
    };
    setErrors(found);

    if (found.current || found.next || found.confirm) {
      haptics.error();
      return;
    }

    mutation.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          haptics.success();
          router.back();
        },
        onError: () => haptics.error(),
      },
    );
  };

  const apiError = mutation.error ? getApiError(mutation.error) : null;
  const wrongCurrent = apiError?.code === 'auth.invalid_credentials';

  const clear = (field: keyof Errors) => setErrors(existing => ({ ...existing, [field]: undefined }));

  return (
    <Screen>
      <Header title={hasPassword ? 'Şifreyi değiştir' : 'Şifre belirle'} onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {hasPassword ? (
            <TextField
              label="Mevcut şifre"
              icon="lock-closed-outline"
              value={current}
              onChangeText={value => {
                setCurrent(value);
                clear('current');
                if (mutation.isError) mutation.reset();
              }}
              secureTextEntry
              autoComplete="current-password"
              error={errors.current ?? (wrongCurrent ? 'Mevcut şifre hatalı.' : undefined)}
            />
          ) : (
            <Notice
              tone="warning"
              message="Apple ile giriş yapıyorsun. Bir şifre belirlersen e-postan ve şifrenle de girebilirsin."
            />
          )}

          <TextField
            label="Yeni şifre"
            icon="key-outline"
            value={next}
            onChangeText={value => {
              setNext(value);
              clear('next');
            }}
            placeholder="En az 8 karakter"
            secureTextEntry
            autoComplete="new-password"
            error={errors.next}
          />

          <TextField
            label="Yeni şifre (tekrar)"
            icon="key-outline"
            value={confirm}
            onChangeText={value => {
              setConfirm(value);
              clear('confirm');
            }}
            secureTextEntry
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={submit}
            error={errors.confirm}
          />

          {mutation.isError && !wrongCurrent && (
            <Notice message={apiError?.detail ?? 'Şifre değiştirilemedi. Bağlantını kontrol et.'} />
          )}

          <View style={styles.info}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              Güvenliğin için diğer cihazlardaki oturumların kapanır; bu cihazda açık kalırsın.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Şifreyi Güncelle" icon="checkmark" loading={mutation.isPending} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
  infoText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
