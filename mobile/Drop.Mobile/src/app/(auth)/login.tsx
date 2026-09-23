import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/api/apiError';
import { getApiError } from '@/api/getApiError';
import { useLogin } from '@/features/auth/hooks/useLogin';
import {
  type AuthFormErrors,
  validateLogin,
} from '@/features/auth/utils/authValidation';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});

  const { refresh } = useAuth();
  const loginMutation = useLogin();

  const apiError = loginMutation.error
    ? getApiError(loginMutation.error)
    : null;

  const handleLogin = () => {
    const errors = validateLogin(email, password);

    setFormErrors(errors);

    if (Object.keys(errors).length) {
      return;
    }

    loginMutation.mutate(
      {
        email: email.trim(),
        password,
      },
      {
        onSuccess: async () => {
          await refresh();
          router.replace('/(app)');
        },
      }
    );
  };

  const emailError =
    formErrors.email ??
    (apiError
      ? getApiErrorMessage(apiError, 'Email')
      : undefined);

  const passwordError =
    formErrors.password ??
    (apiError
      ? getApiErrorMessage(apiError, 'Password')
      : undefined);

  const generalApiError =
    apiError && !emailError && !passwordError
      ? getApiErrorMessage(apiError)
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <View
        pointerEvents="none"
        style={styles.orbTop}
      />

      <View
        pointerEvents="none"
        style={styles.orbBottom}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>
              DROP
            </Text>

            <View style={styles.logoLine} />

            <Text style={styles.eyebrow}>
              YAKININDAKİ FIRSATLAR
            </Text>

            <Text style={styles.title}>
              Tekrar hoş geldin.
            </Text>

            <Text style={styles.subtitle}>
              Fırsatları görmek için hesabına giriş yap.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>
              E-posta
            </Text>

            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);

                setFormErrors((errors) => ({
                  ...errors,
                  email: '',
                }));
              }}
              placeholder="ornek@drop.app"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              accessibilityLabel="E-posta"
              style={[
                styles.input,
                emailError
                  ? styles.inputError
                  : undefined,
              ]}
            />

            {emailError ? (
              <Text style={styles.error}>
                {emailError}
              </Text>
            ) : null}

            <Text style={styles.label}>
              Şifre
            </Text>

            <TextInput
              value={password}
              onChangeText={(value) => {
                setPassword(value);

                setFormErrors((errors) => ({
                  ...errors,
                  password: '',
                }));
              }}
              placeholder="Şifren"
              secureTextEntry
              autoComplete="current-password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Şifre"
              style={[
                styles.input,
                passwordError
                  ? styles.inputError
                  : undefined,
              ]}
            />

            {passwordError ? (
              <Text style={styles.error}>
                {passwordError}
              </Text>
            ) : null}

            {generalApiError ? (
              <Text style={styles.error}>
                {generalApiError}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              style={[
                styles.button,
                loginMutation.isPending
                  ? styles.disabled
                  : undefined,
              ]}
              onPress={handleLogin}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Giriş Yap
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push('/(auth)/register')
            }
          >
            <Text style={styles.link}>
              Hesabın yok mu?{' '}
              <Text style={styles.linkStrong}>
                Kayıt ol
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f5f8',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 32,
  },

  orbTop: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#dbeafe',
    top: -130,
    right: -80,
  },

  orbBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#dcfce7',
    bottom: -130,
    left: -100,
  },

  header: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 26,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 5,
  },

  logo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2.5,
  },

  logoLine: {
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#a3e635',
    marginTop: 18,
    marginBottom: 14,
  },

  eyebrow: {
    color: '#a3e635',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },

  subtitle: {
    marginTop: 8,
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },

  form: {
    gap: 8,
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },

  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginTop: 6,
    letterSpacing: 0.2,
  },

  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 54,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },

  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },

  error: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
  },

  button: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#84cc16',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#65a30d',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  disabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#172108',
    fontWeight: '800',
    fontSize: 16,
  },

  link: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 24,
    fontSize: 14,
  },

  linkStrong: {
    color: '#0f172a',
    fontWeight: '800',
  },
});