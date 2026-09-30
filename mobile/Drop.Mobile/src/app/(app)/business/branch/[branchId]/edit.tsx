import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/apiError';
import { getApiError } from '@/api/getApiError';
import { useBranch } from '@/features/businesses/hooks/useBranch';
import { useBranchLifecycle } from '@/features/businesses/hooks/useBranchLifecycle';
import { useUpdateBranch } from '@/features/businesses/hooks/useUpdateBranch';
import { getBusinessErrorMessage } from '@/features/businesses/utils/businessLabels';
import { useCurrentLocation } from '@/features/location/hooks/useCurrentLocation';
import {
  Button,
  Header,
  Notice,
  Screen,
  StateView,
  TextField,
  colors,
  haptics,
  radius,
  shadows,
  spacing,
} from '@/ui';

export default function EditBranchScreen() {
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  const branchQuery = useBranch(branchId);

  if (!branchQuery.data) {
    return (
      <Screen>
        <Header title="Şubeyi düzenle" onBack={() => router.back()} />
        <StateView loading={branchQuery.isLoading} icon="alert-circle" title="Şube yükleniyor" />
      </Screen>
    );
  }

  return <EditBranchForm branch={branchQuery.data} />;
}

function EditBranchForm({ branch }: { branch: NonNullable<ReturnType<typeof useBranch>['data']> }) {
  const [name, setName] = useState(branch.name);
  const [nameError, setNameError] = useState('');
  const [moveHere, setMoveHere] = useState(false);

  const locationQuery = useCurrentLocation();
  const mutation = useUpdateBranch(branch.id);
  const lifecycle = useBranchLifecycle(branch.id);

  const runLifecycle = (action: 'close' | 'reopen') =>
    lifecycle.mutate(action, {
      onSuccess: () => {
        haptics.success();
        if (action === 'close') router.back();
      },
      onError: () => {
        haptics.error();
        Alert.alert('İşlem tamamlanamadı', 'Şubenin durumu değişmiş olabilir. Sayfayı yenileyip tekrar dene.');
      },
    });

  const confirmClose = () =>
    Alert.alert(
      'Şube kapatılsın mı?',
      "Yayındaki ve planlanan tüm Drop'lar iptal edilir, müşterilerin kullanılmamış rezervasyonları da düşer. Şubeyi istediğin zaman yeniden açabilirsin.",
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Şubeyi kapat', style: 'destructive', onPress: () => runLifecycle('close') },
      ],
    );
  const apiError = mutation.error ? getApiError(mutation.error) : null;
  const here = locationQuery.data;

  const handleSave = () => {
    if (!name.trim()) {
      setNameError('Şube adı zorunludur.');
      haptics.error();
      return;
    }

    if (moveHere && !here) {
      haptics.error();
      return;
    }

    mutation.mutate(
      {
        name: name.trim(),
        ...(moveHere && here ? { latitude: here.latitude, longitude: here.longitude } : {}),
      },
      {
        onSuccess: () => {
          haptics.success();
          router.back();
        },
        onError: () => haptics.error(),
      },
    );
  };

  return (
    <Screen>
      <Header title="Şubeyi düzenle" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField
            label="Şube adı"
            icon="business-outline"
            value={name}
            onChangeText={value => {
              setName(value);
              setNameError('');
            }}
            maxLength={200}
            error={nameError || (apiError?.errors ? getApiErrorMessage(apiError, 'Name') : undefined)}
          />

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={styles.text}>
                <Text style={styles.title}>Kayıtlı konum</Text>
                <Text style={styles.coords}>
                  {branch.latitude.toFixed(5)}, {branch.longitude.toFixed(5)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.text}>
                <Text style={styles.title}>Şu anki konumuma taşı</Text>
                <Text style={styles.subtitle}>
                  {moveHere
                    ? here
                      ? `${here.latitude.toFixed(5)}, ${here.longitude.toFixed(5)}`
                      : 'Konum alınıyor...'
                    : 'Şubedeyken aç; müşteriler mesafeyi buna göre görür.'}
                </Text>
              </View>
              {moveHere && locationQuery.isFetching ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Switch
                  value={moveHere}
                  onValueChange={value => {
                    setMoveHere(value);
                    if (value) void locationQuery.refetch();
                  }}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              )}
            </View>
          </View>

          {apiError && !apiError.errors && (
            <Notice message={getBusinessErrorMessage(apiError.code, apiError.detail)} />
          )}
          {mutation.isError && !apiError && <Notice message="Sunucuya ulaşılamadı." />}

          <View style={[styles.lifecycle, branch.isClosed ? styles.lifecycleReopen : styles.lifecycleClose]}>
            <Text style={styles.lifecycleTitle}>{branch.isClosed ? 'Şube kapalı' : 'Şubeyi kapat'}</Text>
            <Text style={styles.lifecycleText}>
              {branch.isClosed
                ? "Yeniden açtığında bu şubeden tekrar Drop yayınlayabilirsin. Geçmiş Drop'lar korunur."
                : "Taşındıysan ya da bir süre hizmet vermeyeceksen şubeyi kapat. Aktif Drop'lar iptal edilir, geçmiş kayıtlar silinmez."}
            </Text>
            <Button
              title={branch.isClosed ? 'Şubeyi yeniden aç' : 'Şubeyi kapat'}
              icon={branch.isClosed ? 'refresh' : 'close-circle-outline'}
              variant={branch.isClosed ? 'primary' : 'light'}
              size="md"
              loading={lifecycle.isPending}
              onPress={branch.isClosed ? () => runLifecycle('reopen') : confirmClose}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Kaydet"
            icon="checkmark-circle"
            disabled={moveHere && !here}
            loading={mutation.isPending}
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lifecycle: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  lifecycleClose: {
    backgroundColor: colors.dangerSoft,
  },
  lifecycleReopen: {
    backgroundColor: colors.primarySoft,
  },
  lifecycleTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  lifecycleText: {
    marginBottom: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  coords: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
