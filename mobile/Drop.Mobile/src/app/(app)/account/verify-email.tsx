import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useResendVerification, useVerifyEmail } from '@/features/users/hooks/useAccountMutations';
import { useMe } from '@/features/users/hooks/useMe';
import { Button, CodeInput, Header, Notice, Screen, colors, haptics, radius, spacing, typography } from '@/ui';

const RESEND_SECONDS = 60;

/**
 * Entered right after sign-up (`from=signup`, optionally with the new
 * `businessId`) or later from the profile banner.
 */
export default function VerifyEmailScreen() {
  const { from, businessId } = useLocalSearchParams<{ from?: string; businessId?: string }>();
  const fromSignup = from === 'signup';

  const me = useMe().data;
  const verify = useVerifyEmail();
  const resend = useResendVerification();

  const [code, setCode] = useState('');
  // Sign-up just sent a code, so the first resend waits out the cooldown too.
  const [cooldown, setCooldown] = useState(fromSignup ? RESEND_SECONDS : 0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const leave = () => {
    if (!fromSignup) {
      router.back();
      return;
    }

    router.replace('/(app)/(tabs)');
    if (businessId) router.push({ pathname: '/(app)/business/[businessId]', params: { businessId } });
  };

  const submit = (value = code) => {
    if (value.length !== 6 || verify.isPending) return;

    verify.mutate(value, {
      onSuccess: () => {
        haptics.success();
        leave();
      },
      onError: () => {
        haptics.error();
        setCode('');
      },
    });
  };

  const sendAgain = () => {
    haptics.tap();
    setCooldown(RESEND_SECONDS);
    resend.mutate();
  };

  const apiError = verify.error ? getApiError(verify.error) : null;
  const errorMessage = !verify.isError
    ? null
    : apiError?.code === 'auth.invalid_verification_code'
      ? 'Kod hatalı ya da süresi dolmuş. Tekrar dene veya yeni kod iste.'
      : (apiError?.detail ?? 'Doğrulanamadı. Bağlantını kontrol et.');

  return (
    <Screen>
      <Header title="E-posta doğrulama" onBack={fromSignup ? undefined : () => router.back()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.icon}>
          <Ionicons name="mail-open" size={34} color={colors.primary} />
        </View>

        <Text style={styles.title}>E-postanı kontrol et</Text>
        <Text style={styles.body}>
          <Text style={styles.email}>{me?.email ?? 'E-posta adresine'}</Text> 6 haneli bir kod gönderdik. Kodu aşağıya gir.
        </Text>

        <CodeInput
          value={code}
          onChange={value => {
            setCode(value);
            if (verify.isError) verify.reset();
          }}
          onComplete={submit}
          error={!!errorMessage}
        />

        {errorMessage && <Notice message={errorMessage} />}

        <Pressable
          accessibilityRole="button"
          disabled={cooldown > 0}
          onPress={sendAgain}
          hitSlop={8}
          style={styles.resend}
        >
          <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
            {cooldown > 0 ? `Yeni kod ${cooldown} sn sonra istenebilir` : 'Kod gelmedi mi? Yeniden gönder'}
          </Text>
        </Pressable>

        <View style={styles.why}>
          <Ionicons name="shield-checkmark" size={18} color={colors.success} />
          <Text style={styles.whyText}>
            Doğrulanmış e-posta; şifre sıfırlama ve işletme onayı için gerekli. Spam klasörüne de göz atmayı unutma.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Doğrula" icon="checkmark" loading={verify.isPending} disabled={code.length !== 6} onPress={() => submit()} />
        {fromSignup && <Button title="Sonra doğrularım" variant="ghost" size="md" onPress={leave} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  icon: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 24,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    marginTop: -spacing.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  email: {
    color: colors.text,
    fontWeight: '800',
  },
  resend: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  resendDisabled: {
    color: colors.textSubtle,
    fontWeight: '600',
  },
  why: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
  },
  whyText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
