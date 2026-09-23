import { Ionicons } from '@expo/vector-icons';
import { type BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiError } from '@/api/getApiError';
import { useRedeemClaim } from '@/features/claims/hooks/useRedeemClaim';
import { getRedeemErrorMessage } from '@/features/claims/utils/getRedeemErrorMessage';
import {
  Button,
  IconButton,
  Notice,
  Screen,
  StateView,
  colors,
  haptics,
  radius,
  spacing,
} from '@/ui';

const FRAME = 250;
const CORNER = 34;

// Retrying with another scan cannot fix these; the claim itself is unusable.
const TERMINAL_CODES = new Set([
  'claim.expired',
  'claim.not_active',
  'claim.access_denied',
  'claim.not_found',
]);

export default function ClaimScannerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const redeemMutation = useRedeemClaim();

  // The scanner fires repeatedly while a QR stays in frame;
  // the ref locks synchronously, before React re-renders.
  const scannedRef = useRef(false);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  const scanLine = useSharedValue(0);

  useEffect(() => {
    scanLine.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [scanLine]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value * (FRAME - 4) }],
  }));

  if (!permission) {
    return (
      <Screen>
        <StateView loading title="Kamera hazırlanıyor" />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <StateView
          icon="camera"
          title="Kamera izni gerekli"
          description="İşletmedeki Drop QR kodunu okutabilmek için kameraya erişmemiz gerekiyor."
          actionLabel={permission.canAskAgain ? 'Kamera İzni Ver' : 'Ayarları Aç'}
          onAction={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
          secondaryLabel="Geri dön"
          onSecondary={() => router.back()}
        />
      </Screen>
    );
  }

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scannedRef.current || redeemMutation.isPending) {
      return;
    }

    scannedRef.current = true;
    setScanned(true);
    haptics.press();

    redeemMutation.mutate(
      { claimId: id, qrToken: data.trim() },
      {
        onSuccess: result => {
          haptics.success();
          router.replace({
            pathname: '/(app)/claim/redeemed/[id]',
            params: { id: result.claimId, redeemedAt: result.redeemedAt },
          });
        },
        onError: () => haptics.error(),
      },
    );
  };

  const handleRetry = () => {
    redeemMutation.reset();
    scannedRef.current = false;
    setScanned(false);
  };

  const apiError = redeemMutation.error ? getApiError(redeemMutation.error) : null;
  const terminal = !!apiError && TERMINAL_CODES.has(apiError.code);
  const errorMessage = redeemMutation.isError
    ? apiError
      ? getRedeemErrorMessage(apiError.code)
      : 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.'
    : null;

  const frameColor = redeemMutation.isError ? colors.danger : scanned ? colors.lime : '#FFFFFF';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.dim} />
        <View style={styles.middleRow}>
          <View style={styles.dim} />
          <View style={styles.frame}>
            <Corner position="topLeft" color={frameColor} />
            <Corner position="topRight" color={frameColor} />
            <Corner position="bottomLeft" color={frameColor} />
            <Corner position="bottomRight" color={frameColor} />
            {!scanned && <Animated.View style={[styles.scanLine, scanLineStyle]} />}
          </View>
          <View style={styles.dim} />
        </View>
        <View style={[styles.dim, styles.dimBottom]} />
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="close" tone="glass" accessibilityLabel="Tarayıcıyı kapat" onPress={() => router.back()} />
        <Text style={styles.topTitle}>QR Kodu Okut</Text>
        <IconButton
          icon={torch ? 'flashlight' : 'flashlight-outline'}
          tone="glass"
          accessibilityLabel={torch ? 'Feneri kapat' : 'Feneri aç'}
          onPress={() => setTorch(value => !value)}
        />
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        {redeemMutation.isPending ? (
          <View style={styles.sheetRow}>
            <ActivityIndicator color={colors.primary} />
            <View style={styles.sheetText}>
              <Text style={styles.sheetTitle}>Drop doğrulanıyor</Text>
              <Text style={styles.sheetDescription}>Bir saniye, işletmeyle eşleştiriyoruz...</Text>
            </View>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorContent}>
            <Notice message={errorMessage} />
            {terminal ? (
              <Button title="Ana Sayfaya Dön" variant="dark" icon="home" onPress={() => router.replace('/(app)')} />
            ) : (
              <Button title="Tekrar Tara" icon="refresh" onPress={handleRetry} />
            )}
          </View>
        ) : (
          <View style={styles.sheetRow}>
            <View style={styles.sheetIcon}>
              <Ionicons name="qr-code" size={22} color={colors.primary} />
            </View>
            <View style={styles.sheetText}>
              <Text style={styles.sheetTitle}>Kodu çerçeveye hizala</Text>
              <Text style={styles.sheetDescription}>
                İşletmedeki Drop QR kodunu okuttuğunda otomatik doğrulanır.
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

function Corner({ position, color }: { position: CornerPosition; color: string }) {
  return <View style={[styles.corner, styles[position], { borderColor: color }]} />;
}

const DIM = 'rgba(8,6,18,0.62)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  dim: {
    flex: 1,
    backgroundColor: DIM,
  },
  dimBottom: {
    flex: 1.35,
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME,
  },
  frame: {
    width: FRAME,
    height: FRAME,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 22,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 22,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 22,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 22,
  },
  scanLine: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.lime,
    shadowColor: colors.lime,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  sheetIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  sheetText: {
    flex: 1,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sheetDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  errorContent: {
    gap: spacing.md,
  },
});
