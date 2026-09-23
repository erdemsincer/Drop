import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/apiError';
import { getApiError } from '@/api/getApiError';
import { useCreateBranch } from '@/features/businesses/hooks/useCreateBranch';
import { getBusinessErrorMessage } from '@/features/businesses/utils/businessLabels';
import { useCurrentLocation } from '@/features/location/hooks/useCurrentLocation';
import {
  Button,
  Header,
  Notice,
  Screen,
  TextField,
  colors,
  haptics,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

export default function CreateBranchScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const locationQuery = useCurrentLocation();
  const mutation = useCreateBranch(businessId);

  const apiError = mutation.error ? getApiError(mutation.error) : null;
  const location = locationQuery.data;
  const permissionDenied = locationQuery.error?.message === 'location.permission_denied';

  const handleCreate = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      setNameError('Şube adı zorunludur.');
      haptics.error();
      return;
    }

    if (!location) {
      haptics.error();
      return;
    }

    mutation.mutate(
      { name: trimmed, latitude: location.latitude, longitude: location.longitude },
      {
        onSuccess: branch => {
          haptics.success();
          router.replace({ pathname: '/(app)/business/branch/[branchId]', params: { branchId: branch.id } });
        },
        onError: () => haptics.error(),
      },
    );
  };

  return (
    <Screen>
      <Header title="Yeni şube" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Şubeni ekle</Text>
          <Text style={styles.subheading}>
            Müşteriler Drop&apos;larını bu şubenin konumuna olan uzaklığa göre görecek. Şubedeyken oluşturman en doğrusu.
          </Text>

          <View style={styles.form}>
            <TextField
              label="Şube adı"
              icon="business-outline"
              value={name}
              onChangeText={value => {
                setName(value);
                setNameError('');
              }}
              placeholder="Örn. Merkez"
              autoCapitalize="words"
              maxLength={200}
              error={nameError || (apiError?.errors ? getApiErrorMessage(apiError, 'Name') : undefined)}
            />

            <View>
              <Text style={styles.label}>Konum</Text>
              <View style={styles.locationCard}>
                <View style={[styles.locationIcon, location && styles.locationIconReady]}>
                  {locationQuery.isFetching ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Ionicons
                      name={location ? 'location' : 'location-outline'}
                      size={22}
                      color={location ? colors.success : colors.warning}
                    />
                  )}
                </View>

                <View style={styles.locationText}>
                  <Text style={styles.locationTitle}>
                    {location
                      ? 'Mevcut konumun kullanılacak'
                      : locationQuery.isFetching
                        ? 'Konum alınıyor...'
                        : 'Konum alınamadı'}
                  </Text>
                  <Text style={styles.locationSubtitle}>
                    {location
                      ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                      : permissionDenied
                        ? 'Konum izni gerekli'
                        : 'Tekrar denemek için dokun'}
                  </Text>
                </View>

                <Pressable
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={permissionDenied ? 'Ayarları aç' : 'Konumu yenile'}
                  onPress={() => (permissionDenied ? Linking.openSettings() : locationQuery.refetch())}
                >
                  <Ionicons
                    name={permissionDenied ? 'settings-outline' : 'refresh'}
                    size={20}
                    color={colors.primary}
                  />
                </Pressable>
              </View>
            </View>

            {apiError && !apiError.errors && (
              <Notice message={getBusinessErrorMessage(apiError.code, apiError.detail)} />
            )}
            {mutation.isError && !apiError && <Notice message="Sunucuya ulaşılamadı." />}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Şubeyi Oluştur"
            icon="checkmark-circle"
            disabled={!location}
            loading={mutation.isPending}
            onPress={handleCreate}
          />
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
  label: {
    marginBottom: spacing.sm,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  locationIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
  },
  locationIconReady: {
    backgroundColor: colors.successSoft,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  locationSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
