import { useMutation } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useAuth } from '@/providers/AuthProvider';
import { authStorage } from '@/storage/authStorage';
import { Notice, colors, haptics, radius, spacing } from '@/ui';

import { signInWithProvider } from '../api/authApi';

const isCancel = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ERR_REQUEST_CANCELED';

/** "Continue with Apple" under the e-mail form: one tap signs in or creates the account. */
export function SocialSignIn() {
  const { refresh } = useAuth();
  const [iosAvailable, setAppleAvailable] = useState<boolean | null>(null);
  const appleAvailable = Platform.OS === 'ios' ? iosAvailable : false;

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const apple = useMutation({
    mutationFn: async () => {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) throw new Error('apple.no_token');

      // Apple shares the name only on the very first sign-in, so it rides along now.
      return signInWithProvider('apple', {
        idToken: credential.identityToken,
        firstName: credential.fullName?.givenName,
        lastName: credential.fullName?.familyName,
      });
    },
    onSuccess: async session => {
      await authStorage.setSession(session);
      haptics.success();
      await refresh();
      router.replace('/(app)/(tabs)');
    },
    onError: error => {
      if (!isCancel(error)) haptics.error();
    },
  });

  // Expo Go (SDK 57) ships without the Apple module, so the button only appears in real builds.
  if (!appleAvailable) return null;

  const apiError = apple.error ? getApiError(apple.error) : null;
  const errorMessage =
    !apple.error || isCancel(apple.error)
      ? null
      : apiError?.code === 'auth.external_email_missing'
        ? 'Apple e-posta adresini paylaşmadı. E-postanla kayıt olmayı dene.'
        : apiError
          ? 'Apple ile giriş doğrulanamadı. Tekrar dene.'
          : 'Apple ile giriş yapılamadı. Bağlantını kontrol et.';

  return (
    <View style={styles.root}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>veya</Text>
        <View style={styles.line} />
      </View>

      <View pointerEvents={apple.isPending ? 'none' : 'auto'} style={apple.isPending && styles.busy}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={radius.md + 2}
          style={styles.button}
          onPress={() => {
            haptics.tap();
            apple.mutate();
          }}
        />
      </View>

      {errorMessage && <Notice message={errorMessage} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  or: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
  },
  button: {
    height: 52,
  },
  busy: {
    opacity: 0.6,
  },
});
