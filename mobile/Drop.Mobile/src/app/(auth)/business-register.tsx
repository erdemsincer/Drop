import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/apiError';
import { getApiError } from '@/api/getApiError';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { AuthSwitchLink } from '@/features/auth/components/AuthSwitchLink';
import { useBusinessSignup } from '@/features/auth/hooks/useBusinessSignup';
import { type AuthFormErrors, validateRegister } from '@/features/auth/utils/authValidation';
import { getBusinessErrorMessage } from '@/features/businesses/utils/businessLabels';
import { useAuth } from '@/providers/AuthProvider';
import { Button, Notice, TextField, colors, haptics, radius, spacing } from '@/ui';

const accountFields = ['Email', 'Password', 'FirstName', 'LastName'];

export default function BusinessRegisterScreen() {
  const [businessName, setBusinessName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});

  const { refresh } = useAuth();
  const mutation = useBusinessSignup();

  const apiError = mutation.error ? getApiError(mutation.error) : null;
  const hasAccountFieldError = accountFields.some(name => apiError?.errors?.[name]?.length);

  const update = (field: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setFormErrors(errors => ({ ...errors, [field]: '' }));
  };

  const submit = () => {
    const errors = validateRegister(firstName, lastName, email, password);
    if (!businessName.trim()) errors.businessName = 'İşletme adı zorunludur.';
    setFormErrors(errors);

    if (Object.keys(errors).length) {
      haptics.error();
      return;
    }

    mutation.mutate(
      {
        businessName: businessName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      },
      {
        onSuccess: async business => {
          haptics.success();
          await refresh();
          // Approval needs a verified owner e-mail, so ask for the code right away.
          router.replace({
            pathname: '/(app)/account/verify-email',
            params: { from: 'signup', businessId: business.id },
          });
        },
        onError: () => haptics.error(),
      },
    );
  };

  const fieldError = (name: string, apiName: string) =>
    formErrors[name] || (hasAccountFieldError && apiError ? getApiErrorMessage(apiError, apiName) : undefined);

  const generalError = apiError
    ? hasAccountFieldError
      ? null
      : apiError.code === 'auth.invalid_credentials'
        ? 'Bu e-posta ile kayıtlı bir hesabın var ama şifre eşleşmedi. Mevcut şifreni gir.'
        : apiError.code === 'validation.failed'
          ? getApiErrorMessage(apiError, 'Name') ?? 'Lütfen alanları kontrol et.'
          : getBusinessErrorMessage(apiError.code, apiError.detail)
    : mutation.isError
      ? 'Sunucuya ulaşılamadı. Bağlantını kontrol et.'
      : null;

  return (
    <AuthShell
      eyebrow="DROP İŞLETME"
      title="İşletmeni Drop'a taşı."
      subtitle="Boş kapasiteni dakikalar içinde yakındaki müşterilere duyur."
      footer={
        <AuthSwitchLink prompt="Müşteri olarak mı devam edeceksin?" action="Geri dön" onPress={() => router.back()} />
      }
    >
      <TextField
        label="İşletme adı"
        icon="storefront-outline"
        value={businessName}
        onChangeText={update('businessName', setBusinessName)}
        placeholder="Örn. Drop Coffee"
        autoCapitalize="words"
        maxLength={200}
        error={formErrors.businessName}
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>YETKİLİ HESABI</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <TextField
            label="Ad"
            icon="person-outline"
            value={firstName}
            onChangeText={update('firstName', setFirstName)}
            placeholder="Ad"
            autoComplete="given-name"
            error={fieldError('firstName', 'FirstName')}
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
            error={fieldError('lastName', 'LastName')}
          />
        </View>
      </View>

      <TextField
        label="E-posta"
        icon="mail-outline"
        value={email}
        onChangeText={update('email', setEmail)}
        placeholder="isletme@ornek.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        error={fieldError('email', 'Email')}
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
        error={fieldError('password', 'Password')}
      />

      <View style={styles.info}>
        <Ionicons name="information-circle" size={18} color={colors.primary} />
        <Text style={styles.infoText}>
          Zaten Drop hesabın varsa aynı e-posta ve şifreni gir; işletmen mevcut hesabına eklenir.
        </Text>
      </View>

      {generalError && <Notice message={generalError} />}

      <Button title="İşletmemi Kaydet" icon="storefront" loading={mutation.isPending} onPress={submit} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  infoText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
});
