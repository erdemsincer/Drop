import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiError } from '@/api/getApiError';
import { useBranch } from '@/features/businesses/hooks/useBranch';
import { useBranchQr } from '@/features/businesses/hooks/useBranchQr';
import { getBusinessErrorMessage } from '@/features/businesses/utils/businessLabels';
import { useCountdown } from '@/features/drops/hooks/useCountdown';
import {
  Button,
  IconButton,
  Notice,
  ProgressBar,
  colors,
  gradients,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

// Grows with the screen so a tablet on the counter scans from arm's length.
const MAX_QR = 420;
const LOGO = require('../../../../../../assets/images/icon.png');

export default function BranchQrScreen() {
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const qrSize = Math.min(MAX_QR, width - 2 * (spacing.xxl * 2), height * 0.42);

  // Customers scan this at the counter; don't let the screen sleep.
  useKeepAwake();

  const branchQuery = useBranch(branchId);
  // Codes rotate every ~30s and expire about a minute later, so a
  // photographed code is useless. Fetching has no side effects.
  const qrQuery = useBranchQr(branchId);

  const code = qrQuery.data;
  const apiError = qrQuery.error ? getApiError(qrQuery.error) : null;

  return (
    <LinearGradient colors={gradients.night} style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="close" tone="glass" accessibilityLabel="Kapat" onPress={() => router.back()} />
        <Text style={styles.topTitle}>Şube QR Kodu</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.business}>
          {branchQuery.data ? `${branchQuery.data.businessName} · ${branchQuery.data.name}` : ' '}
        </Text>
        <Text style={styles.branch}>Drop&apos;unu burada okut ⚡</Text>
        <Text style={styles.steps}>Uygulamada yakaladığın Drop&apos;u aç › QR Kodu Okut</Text>

        <View style={[styles.qrCard, { width: qrSize + spacing.xxl * 2, height: qrSize + spacing.xxl * 2 }]}>
          {code ? (
            // High error correction leaves room for the logo in the middle.
            <QRCode
              value={code.payload}
              size={qrSize}
              color={colors.ink}
              backgroundColor="#FFFFFF"
              ecl="H"
              logo={LOGO}
              logoSize={qrSize * 0.2}
              logoBorderRadius={qrSize * 0.05}
              logoBackgroundColor="#FFFFFF"
              logoMargin={4}
            />
          ) : qrQuery.isError ? (
            <Ionicons name="cloud-offline" size={48} color={colors.textSubtle} />
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
        </View>

        {code && <RotationBar refreshAt={code.refreshAt} periodSeconds={code.periodSeconds} />}

        <View style={styles.hintRow}>
          <Ionicons name="shield-checkmark" size={16} color={colors.lime} />
          <Text style={styles.hint}>
            Kod güvenlik için sürekli yenilenir; fotoğrafı çekilen kod bir dakika içinde geçersiz olur.
          </Text>
        </View>

        {qrQuery.isError && (
          <View style={styles.errorBox}>
            <Notice
              message={
                apiError
                  ? getBusinessErrorMessage(apiError.code, apiError.detail)
                  : 'Sunucuya ulaşılamadı. QR kodu için internet bağlantısı gerekli.'
              }
            />
            <Button title="Tekrar dene" icon="refresh" variant="light" size="md" onPress={() => qrQuery.refetch()} />
          </View>
        )}
      </View>

      <View style={{ height: insets.bottom + spacing.lg }} />
    </LinearGradient>
  );
}

function RotationBar({ refreshAt, periodSeconds }: { refreshAt: string; periodSeconds: number }) {
  const remaining = useCountdown(refreshAt);

  return (
    <View style={styles.rotation}>
      <ProgressBar
        value={remaining.totalSeconds / periodSeconds}
        color={colors.lime}
        trackColor="rgba(255,255,255,0.14)"
        height={5}
      />
      <Text style={styles.rotationText}>
        Yeni kod {Math.max(0, remaining.totalSeconds)} sn sonra
      </Text>
    </View>
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
  steps: {
    marginTop: -spacing.sm,
    color: colors.textOnDarkMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  qrCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl + 6,
    ...shadows.raised,
  },
  rotation: {
    alignSelf: 'stretch',
    marginHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  rotationText: {
    color: colors.textOnDarkMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
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
  errorBox: {
    alignSelf: 'stretch',
    gap: spacing.md,
  },
});
