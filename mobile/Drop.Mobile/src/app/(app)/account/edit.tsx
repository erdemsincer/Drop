import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useUpdateProfile } from '@/features/users/hooks/useAccountMutations';
import { useMe } from '@/features/users/hooks/useMe';
import { Avatar, Button, Header, Notice, Screen, TextField, colors, haptics, spacing } from '@/ui';

export default function EditProfileScreen() {
  const me = useMe().data;
  const mutation = useUpdateProfile();

  // Seeded once from the cached profile; the screen is only reachable from it.
  const [firstName, setFirstName] = useState(me?.firstName ?? '');
  const [lastName, setLastName] = useState(me?.lastName ?? '');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const submit = () => {
    const next = {
      firstName: firstName.trim() ? undefined : 'Adını gir.',
      lastName: lastName.trim() ? undefined : 'Soyadını gir.',
    };
    setErrors(next);

    if (next.firstName || next.lastName) {
      haptics.error();
      return;
    }

    mutation.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim() },
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
  const preview = `${firstName.trim() || me?.firstName || ''} ${lastName.trim() || me?.lastName || ''}`.trim();

  return (
    <Screen>
      <Header title="Profili düzenle" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatar}>
            <Avatar name={preview || '?'} size={84} />
            {me && <Text style={styles.email}>{me.email}</Text>}
          </View>

          <TextField
            label="Ad"
            icon="person-outline"
            value={firstName}
            onChangeText={value => {
              setFirstName(value);
              setErrors(current => ({ ...current, firstName: undefined }));
            }}
            autoCapitalize="words"
            autoComplete="given-name"
            maxLength={100}
            error={errors.firstName}
          />

          <TextField
            label="Soyad"
            icon="person-outline"
            value={lastName}
            onChangeText={value => {
              setLastName(value);
              setErrors(current => ({ ...current, lastName: undefined }));
            }}
            autoCapitalize="words"
            autoComplete="family-name"
            maxLength={100}
            returnKeyType="done"
            onSubmitEditing={submit}
            error={errors.lastName}
          />

          {mutation.isError && <Notice message={apiError?.detail ?? 'Kaydedilemedi. Bağlantını kontrol et.'} />}
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
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  email: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
