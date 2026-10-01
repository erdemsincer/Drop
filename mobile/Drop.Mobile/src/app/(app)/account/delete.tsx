import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useMyBusinesses } from '@/features/businesses/hooks/useMyBusinesses';
import { useMe } from '@/features/users/hooks/useMe';
import { deleteAccount } from '@/features/users/api/userApi';
import { useAuth } from '@/providers/AuthProvider';
import { Button, Header, Notice, Screen, TextField, colors, haptics, radius, spacing, typography } from '@/ui';

const CONFIRM_WORD = 'SİL';

export default function DeleteAccountScreen() {
  const { signOut } = useAuth();
  const businessesQuery = useMyBusinesses();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  // Apple/Google accounts have no password; typing the word stands in for it.
  const hasPassword = useMe().data?.hasPassword ?? true;

  const owned = (businessesQuery.data ?? []).filter(business => business.role === 'Owner');

  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      haptics.success();
      await signOut();
    },
    onError: () => haptics.error(),
  });

  const apiError = mutation.error ? getApiError(mutation.error) : null;

  const submit = () => {
    if (!hasPassword) {
      if (password.trim().toLocaleUpperCase('tr-TR') !== CONFIRM_WORD) {
        setPasswordError(`Onay için ${CONFIRM_WORD} yaz.`);
        haptics.error();
        return;
      }

      mutation.mutate(null);
      return;
    }

    if (!password) {
      setPasswordError('Onay için şifreni gir.');
      haptics.error();
      return;
    }

    mutation.mutate(password);
  };

  return (
    <Screen>
      <Header title="Hesabı sil" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.icon}>
            <Ionicons name="warning" size={34} color={colors.danger} />
          </View>

          <Text style={styles.title}>Bu işlem geri alınamaz</Text>

          <View style={styles.list}>
            <Item text="Hesabın ve kişisel bilgilerin (ad, e-posta) kalıcı olarak silinir." />
            <Item text="Aktif Drop rezervasyonların iptal edilir." />
            <Item text="Tüm cihazlardaki oturumların kapanır." />
            {owned.length > 0 && (
              <Item
                strong
                text={`Sahibi olduğun ${owned.length === 1 ? `"${owned[0].name}" işletmesi` : `${owned.length} işletme`} şubeleri ve Drop'larıyla birlikte silinir.`}
              />
            )}
          </View>

          <TextField
            label={hasPassword ? 'Şifren' : `Onay için ${CONFIRM_WORD} yaz`}
            icon={hasPassword ? 'lock-closed-outline' : 'create-outline'}
            value={password}
            onChangeText={value => {
              setPassword(value);
              setPasswordError('');
            }}
            placeholder={hasPassword ? 'Onay için şifreni gir' : CONFIRM_WORD}
            secureTextEntry={hasPassword}
            autoCapitalize={hasPassword ? 'none' : 'characters'}
            autoComplete={hasPassword ? 'current-password' : 'off'}
            error={
              passwordError ||
              (apiError?.code === 'auth.invalid_credentials' ? 'Şifre hatalı.' : undefined)
            }
          />

          {mutation.isError && apiError?.code !== 'auth.invalid_credentials' && (
            <Notice message="Hesap silinemedi. Bağlantını kontrol edip tekrar dene." />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Hesabımı Kalıcı Olarak Sil"
            icon="trash"
            variant="dark"
            loading={mutation.isPending}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Item({ text, strong = false }: { text: string; strong?: boolean }) {
  return (
    <View style={styles.item}>
      <Ionicons name="close-circle" size={18} color={colors.danger} />
      <Text style={[styles.itemText, strong && styles.itemStrong]}>{text}</Text>
    </View>
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
  icon: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: 24,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  itemText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  itemStrong: {
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
