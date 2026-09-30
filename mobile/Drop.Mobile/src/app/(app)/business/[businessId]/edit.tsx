import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useMyBusinesses } from '@/features/businesses/hooks/useMyBusinesses';
import { useRenameBusiness } from '@/features/businesses/hooks/useRenameBusiness';
import { Avatar, Button, Header, Notice, Screen, TextField, colors, haptics, spacing } from '@/ui';

export default function EditBusinessScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const business = useMyBusinesses().data?.find(item => item.id === businessId);
  const mutation = useRenameBusiness(businessId);

  const [name, setName] = useState(business?.name ?? '');
  const [nameError, setNameError] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setNameError('İşletme adını gir.');
      haptics.error();
      return;
    }

    mutation.mutate(name.trim(), {
      onSuccess: () => {
        haptics.success();
        router.back();
      },
      onError: () => haptics.error(),
    });
  };

  const apiError = mutation.error ? getApiError(mutation.error) : null;

  return (
    <Screen>
      <Header title="İşletmeyi düzenle" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatar}>
            <Avatar name={name.trim() || business?.name || '?'} size={84} />
          </View>

          <TextField
            label="İşletme adı"
            icon="storefront-outline"
            value={name}
            onChangeText={value => {
              setName(value);
              setNameError('');
            }}
            autoCapitalize="words"
            maxLength={200}
            returnKeyType="done"
            onSubmitEditing={submit}
            error={nameError}
          />

          <Text style={styles.hint}>
            Müşteriler Drop kartlarında bu adı görür. Şube adları ayrı düzenlenir.
          </Text>

          {mutation.isError && (
            <Notice
              message={
                apiError?.code === 'business.access_denied'
                  ? 'İşletme adını yalnızca işletme sahibi değiştirebilir.'
                  : 'Kaydedilemedi. Bağlantını kontrol et.'
              }
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Kaydet" icon="checkmark" loading={mutation.isPending} onPress={submit} />
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
  avatar: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hint: {
    marginTop: -spacing.sm,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
