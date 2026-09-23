import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/apiError';
import { getApiError } from '@/api/getApiError';
import { requestPasswordReset, resetPassword } from '@/features/auth/api/authApi';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { AuthSwitchLink } from '@/features/auth/components/AuthSwitchLink';
import { Button, Notice, TextField, colors, haptics, radius, spacing } from '@/ui';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const requestMutation = useMutation({ mutationFn: requestPasswordReset });
  const resetMutation = useMutation({ mutationFn: resetPassword });

  const sendCode = () => {
    if (!emailPattern.test(email.trim())) {
      setErrors({ email: 'Geçerli bir e-posta gir.' });
      haptics.error();
      return;
    }

    requestMutation.mutate(email.trim(), {
      onSuccess: () => {
        haptics.success();
        setErrors({});
        setStep('reset');
      },
      onError: () => haptics.error(),
    });
  };

  const submitReset = () => {
    const next: Record<string, string> = {};
    if (!/^\d{6}$/.test(code.trim())) next.code = 'E-postadaki 6 haneli kodu gir.';
    if (password.length < 8) next.password = 'Şifre en az 8 karakter olmalı.';
    setErrors(next);

    if (Object.keys(next).length) {
      haptics.error();
      return;
    }

    resetMutation.mutate(
      { email: email.trim(), code: code.trim(), newPassword: password },
      {
        onSuccess: () => {
          haptics.success();
          setStep('done');
        },
        onError: () => haptics.error(),
      },
    );
  };

  const resetError = resetMutation.error ? getApiError(resetMutation.error) : null;
  const requestError = requestMutation.error ? getApiError(requestMutation.error) : null;

  return (
    <AuthShell
      eyebrow="HESAP KURTARMA"
      title={step === 'done' ? 'Şifren yenilendi.' : 'Şifreni sıfırla.'}
      subtitle={
        step === 'email'
          ? 'E-postana 6 haneli bir kod göndereceğiz.'
          : step === 'reset'
            ? `${email.trim()} adresine gönderdiğimiz kodu gir.`
            : 'Güvenliğin için tüm cihazlardaki oturumlar kapatıldı.'
      }
      footer={<AuthSwitchLink prompt="Şifreni hatırladın mı?" action="Giriş yap" onPress={() => router.back()} />}
    >
      {step === 'email' && (
        <>
          <TextField
            label="E-posta"
            icon="mail-outline"
            value={email}
            onChangeText={value => {
              setEmail(value);
              setErrors({});
            }}
            placeholder="ornek@drop.app"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="send"
            onSubmitEditing={sendCode}
            error={errors.email}
          />
          {requestMutation.isError && (
            <Notice message={requestError ? getApiErrorMessage(requestError) : 'Sunucuya ulaşılamadı.'} />
          )}
          <Button title="Kod Gönder" icon="paper-plane" loading={requestMutation.isPending} onPress={sendCode} />
        </>
      )}

      {step === 'reset' && (
        <>
          <View style={styles.info}>
            <Text style={styles.infoText}>
              Kod 15 dakika geçerli. Gelmediyse gereksiz/spam klasörüne bak.
            </Text>
          </View>
          <TextField
            label="Doğrulama kodu"
            icon="keypad-outline"
            value={code}
            onChangeText={value => {
              setCode(value.replace(/[^0-9]/g, '').slice(0, 6));
              setErrors(current => ({ ...current, code: '' }));
            }}
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            error={errors.code}
          />
          <TextField
            label="Yeni şifre"
            icon="lock-closed-outline"
            value={password}
            onChangeText={value => {
              setPassword(value);
              setErrors(current => ({ ...current, password: '' }));
            }}
            placeholder="En az 8 karakter"
            secureTextEntry
            autoComplete="new-password"
            returnKeyType="go"
            onSubmitEditing={submitReset}
            error={errors.password}
          />
          {resetMutation.isError && (
            <Notice
              message={
                resetError?.code === 'auth.invalid_reset_code'
                  ? 'Kod hatalı ya da süresi dolmuş. Yeni kod isteyebilirsin.'
                  : resetError
                    ? getApiErrorMessage(resetError)
                    : 'Sunucuya ulaşılamadı.'
              }
            />
          )}
          <Button title="Şifreyi Yenile" icon="checkmark-circle" loading={resetMutation.isPending} onPress={submitReset} />
          <Button
            title="Yeni kod gönder"
            variant="ghost"
            size="md"
            loading={requestMutation.isPending}
            onPress={sendCode}
          />
        </>
      )}

      {step === 'done' && (
        <Button title="Giriş Yap" icon="log-in" onPress={() => router.replace('/(auth)/login')} />
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  info: {
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  infoText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
});
