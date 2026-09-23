import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/apiError';
import { getApiError } from '@/api/getApiError';
import { useCreateBusiness } from '@/features/businesses/hooks/useCreateBusiness';
import { getBusinessErrorMessage } from '@/features/businesses/utils/businessLabels';
import { Button, Header, Notice, Screen, TextField, colors, haptics, spacing, typography } from '@/ui';

export default function CreateBusinessScreen() {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const mutation = useCreateBusiness();

  const apiError = mutation.error ? getApiError(mutation.error) : null;
  const fieldApiError = apiError ? getApiErrorMessage(apiError, 'Name') : undefined;

  const handleCreate = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      setNameError('İşletme adı zorunludur.');
      haptics.error();
      return;
    }

    mutation.mutate(
      { name: trimmed },
      {
        onSuccess: business => {
          haptics.success();
          router.replace({ pathname: '/(app)/business/[businessId]', params: { businessId: business.id } });
        },
        onError: () => haptics.error(),
      },
    );
  };

  return (
    <Screen>
      <Header title="Yeni işletme" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>İşletmeni tanıt</Text>
          <Text style={styles.subheading}>
            Müşteriler Drop&apos;larında bu adı görecek. Oluşturduğunda işletmenin sahibi olarak eklenirsin.
          </Text>

          <View style={styles.form}>
            <TextField
              label="İşletme adı"
              icon="storefront-outline"
              value={name}
              onChangeText={value => {
                setName(value);
                setNameError('');
              }}
              placeholder="Örn. Drop Coffee"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              maxLength={200}
              error={nameError || (apiError?.errors ? fieldApiError : undefined)}
            />

            {apiError && !apiError.errors && (
              <Notice message={getBusinessErrorMessage(apiError.code, apiError.detail)} />
            )}
            {mutation.isError && !apiError && <Notice message="Sunucuya ulaşılamadı." />}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="İşletmeyi Oluştur" icon="checkmark-circle" loading={mutation.isPending} onPress={handleCreate} />
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
    padding: spacing.xl,
  },
  heading: {
    ...typography.title,
    color: colors.text,
  },
  subheading: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
