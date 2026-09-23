import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiError } from '@/api/getApiError';
import { useBranch } from '@/features/businesses/hooks/useBranch';
import { useCreateBranchQrToken } from '@/features/businesses/hooks/useCreateBranchQrToken';
import { getBusinessErrorMessage } from '@/features/businesses/utils/businessLabels';
import {
  Button,
  IconButton,
  Notice,
  colors,
  gradients,
  haptics,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

const QR_SIZE = 240;

export default function BranchQrScreen() {
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  const insets = useSafeAreaInsets();

  // Customers scan this at the counter; don't let the screen sleep.
  useKeepAwake();

  const branchQuery = useBranch(branchId);
  // Explicit user action only: generating a token revokes the previous one,
  // so we never rotate it from an effect (StrictMode can double-run effects).
  const qrMutation = useCreateBranchQrToken();

  const token = qrMutation.data?.token;
  const apiError = qrMutation.error ? getApiError(qrMutation.error) : null;

  const generate = () => {
    haptics.press();
    qrMutation.mutate(branchId, {
      onSuccess: () => haptics.success(),
      onError: () => haptics.error(),
    });
  };

  const confirmRefresh = () =>
    Alert.alert(
      'QR kodu yenilensin mi?',
      'Eski QR kod hemen geçersiz olur. Basılı ya da fotoğrafı çekilmiş eski kodlar artık çalışmaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Yenile', style: 'destructive', onPress: generate },
      ],
    );

  return (
    <LinearGradient colors={gradients.night} style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="close" tone="glass" accessibilityLabel="Kapat" onPress={() => router.back()} />
        <Text style={styles.topTitle}>Şube QR Kodu</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.business}>{branchQuery.data?.businessName ?? ' '}</Text>
        <Text style={styles.branch}>{branchQuery.data?.name ?? ' '}</Text>

        <View style={styles.qrCard}>
          {token ? (
            <QRCode value={token} size={QR_SIZE} color={colors.ink} backgroundColor="#FFFFFF" ecl="M" />
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <Ionicons name="qr-code" size={44} color={colors.primary} />
              </View>
              <Text style={styles.placeholderTitle}>QR kodu hazır değil</Text>
              <Text style={styles.placeholderText}>
                Güvenlik için QR kodu her açılışta yeniden oluşturulur.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.hintRow}>
          <Ionicons name="scan" size={16} color={colors.lime} />
          <Text style={styles.hint}>
            {token
              ? 'Müşteri Drop’unu kullanmak için bu kodu uygulamadan okutmalı.'
              : 'Müşteri geldiğinde QR kodu göster.'}
          </Text>
        </View>

        {apiError && <Notice message={getBusinessErrorMessage(apiError.code, apiError.detail)} />}
        {qrMutation.isError && !apiError && <Notice message="Sunucuya ulaşılamadı." />}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {token ? (
          <Button title="QR Kodunu Yenile" icon="refresh" variant="light" loading={qrMutation.isPending} onPress={confirmRefresh} />
        ) : (
          <Button title="QR Kodunu Göster" icon="qr-code" loading={qrMutation.isPending} onPress={generate} />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  topTitle: {
    color: colors.textOnDark,
    fontSize: 16,
    fontWeight: '800',
  },
  topSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  business: {
    ...typography.overline,
    color: colors.lime,
  },
  branch: {
    ...typography.display,
    marginTop: -spacing.md,
    color: colors.textOnDark,
    textAlign: 'center',
  },
  qrCard: {
    width: QR_SIZE + spacing.xxl * 2,
    height: QR_SIZE + spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl + 6,
    ...shadows.raised,
  },
  placeholder: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  placeholderIcon: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
  },
  placeholderTitle: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  placeholderText: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 320,
  },
  hint: {
    flex: 1,
    color: colors.textOnDarkMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: spacing.xl,
  },
});
