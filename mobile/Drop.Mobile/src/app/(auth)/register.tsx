import { useMutation } from '@tanstack/react-query';
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
import { register } from '@/features/auth/api/authApi';
import {
  type AuthFormErrors,
  validateRegister,
} from '@/features/auth/utils/authValidation';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => router.replace('/(auth)/login'),
  });

  const apiError = mutation.error
    ? getApiError(mutation.error)
    : null;

  const updateField = (
    field: string,
    value: string,
    setter: (next: string) => void
  ) => {
    setter(value);

    setFormErrors((errors) => ({
      ...errors,
      [field]: '',
    }));
  };

  const submit = () => {
    const errors = validateRegister(
      firstName,
      lastName,
      email,
      password
    );

    setFormErrors(errors);

    if (Object.keys(errors).length) {
      return;
    }

    mutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
    });
  };

  const fieldError = (
    name: string,
    apiName: string
  ) =>
    formErrors[name] ??
    (apiError
      ? getApiErrorMessage(apiError, apiName)
      : undefined);

  const hasGeneralApiError =
    apiError &&
    !['Email', 'Password', 'FirstName', 'LastName'].some(
      (name) => apiError.errors?.[name]?.length
    );

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
              BİRKAÇ SANİYE SÜRER
            </Text>

            <Text style={styles.title}>
              Hesabını oluştur.
            </Text>

            <Text style={styles.subtitle}>
              Yakınındaki fırsatları kaçırma.
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Ad"
              value={firstName}
              onChangeText={(value) =>
                updateField(
                  'firstName',
                  value,
                  setFirstName
                )
              }
              error={fieldError(
                'firstName',
                'FirstName'
              )}
              autoComplete="given-name"
            />

            <Field
              label="Soyad"
              value={lastName}
              onChangeText={(value) =>
                updateField(
                  'lastName',
                  value,
                  setLastName
                )
              }
              error={fieldError(
                'lastName',
                'LastName'
              )}
              autoComplete="family-name"
            />

            <Field
              label="E-posta"
              value={email}
              onChangeText={(value) =>
                updateField(
                  'email',
                  value,
                  setEmail
                )
              }
              error={fieldError(
                'email',
                'Email'
              )}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Field
              label="Şifre"
              value={password}
              onChangeText={(value) =>
                updateField(
                  'password',
                  value,
                  setPassword
                )
              }
              error={fieldError(
                'password',
                'Password'
              )}
              autoComplete="new-password"
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            <Text style={styles.hint}>
              Şifre en az 8 karakter olmalıdır.
            </Text>

            {hasGeneralApiError ? (
              <Text style={styles.error}>
                {getApiErrorMessage(apiError)}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              style={[
                styles.button,
                mutation.isPending
                  ? styles.disabled
                  : undefined,
              ]}
              disabled={mutation.isPending}
              onPress={submit}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Kayıt Ol
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
  accessibilityRole="button"
  onPress={() => router.replace('/(auth)/login')}
>
            <Text style={styles.link}>
              Zaten hesabın var mı?{' '}
              <Text style={styles.linkStrong}>
                Giriş yap
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps =
  React.ComponentProps<typeof TextInput> & {
    label: string;
    error?: string;
  };

function Field({
  label,
  error,
  style,
  ...props
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        {...props}
        placeholder={label}
        autoCorrect={false}
        accessibilityLabel={label}
        style={[
          styles.input,
          error
            ? styles.inputError
            : undefined,
          style,
        ]}
      />

      {error ? (
        <Text style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
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
    gap: 12,
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

  field: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
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

  hint: {
    color: '#64748b',
    fontSize: 13,
  },

  button: {
    marginTop: 10,
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