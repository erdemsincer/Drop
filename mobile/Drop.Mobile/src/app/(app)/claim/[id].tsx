import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useActiveClaim } from '@/features/claims/hooks/useActiveClaim';
import { useCancelClaim } from '@/features/claims/hooks/useCancelClaim';
import { useCountdown } from '@/features/drops/hooks/useCountdown';
import { openDirections } from '@/utils/openDirections';
import {
  Badge,
  Confetti,
  Button,
  IconButton,
  ProgressBar,
  Screen,
  colors,
  gradients,
  haptics,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

const URGENT_SECONDS = 3 * 60;

export default function ClaimScreen() {
  const { id, expiresAt, durationMinutes, celebrate } = useLocalSearchParams<{
    id: string;
    expiresAt: string;
    durationMinutes?: string;
    /** "1" right after catching the drop: confetti once. */
    celebrate?: string;
  }>();
  const [burst] = useState(celebrate === '1' ? 1 : 0);

  const remaining = useCountdown(expiresAt);
  // Location for "Yol tarifi" comes from the active claim (the route only carries the id).
  const activeClaim = useActiveClaim().data;
  const place = activeClaim?.claimId === id ? activeClaim : undefined;
  const expired = remaining.isExpired;
  const urgent = !expired && remaining.totalSeconds <= URGENT_SECONDS;

  const totalSeconds = Number(durationMinutes) * 60;
  const progress = totalSeconds > 0 ? remaining.totalSeconds / totalSeconds : null;

  const goHome = () => router.replace('/(app)/(tabs)');

  const cancelMutation = useCancelClaim();

  const confirmCancel = () =>
    Alert.alert(
      'Rezervasyondan vazgeçilsin mi?',
      "Yerin başka birine açılacak ve bu Drop'u tekrar yakalayamayacaksın.",
      [
        { text: 'Vazgeçme', style: 'cancel' },
        {
          text: 'Evet, iptal et',
          style: 'destructive',
          onPress: () =>
            cancelMutation.mutate(id, {
              onSuccess: () => {
                haptics.success();
                goHome();
              },
              onError: error => {
                haptics.error();
                const code = getApiError(error)?.code;
                Alert.alert(
                  'İptal edilemedi',
                  code === 'claim.expired'
                    ? 'Rezervasyonun süresi zaten dolmuş.'
                    : code === 'claim.not_active'
                      ? 'Bu rezervasyon zaten kullanılmış ya da iptal edilmiş.'
                      : 'Bir sorun oluştu, lütfen tekrar dene.',
                );
              },
            }),
        },
      ],
    );

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon="close" accessibilityLabel="Ana sayfaya dön" onPress={goHome} />
        <Text style={styles.topTitle}>Drop biletin</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.ticket}>
          <LinearGradient
            colors={expired ? gradients.danger : gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ticketTop}
          >
            <View style={styles.orb} />

            <View style={styles.statusIcon}>
              <Ionicons name={expired ? 'close' : 'checkmark'} size={34} color={expired ? colors.danger : colors.primary} />
            </View>

            <Badge
              label={expired ? 'SÜRE DOLDU' : urgent ? 'ACELE ET!' : 'YAKALADIN'}
              tone="glass"
              live={!expired}
              style={styles.badge}
            />

            <Text style={styles.title}>
              {expired ? 'Bu fırsatın süresi doldu' : 'Drop senin için ayrıldı!'}
            </Text>

            <Text style={styles.timerLabel}>KALAN SÜRE</Text>
            <Text style={styles.timer}>{expired ? '00:00' : remaining.label}</Text>

            {progress !== null && !expired && (
              <ProgressBar
                value={progress}
                color={urgent ? colors.lime : '#FFFFFF'}
                trackColor="rgba(255,255,255,0.22)"
                height={8}
                style={styles.progress}
              />
            )}
          </LinearGradient>

          <View style={styles.perforation}>
            <View style={[styles.notch, styles.notchLeft]} />
            <View style={styles.dashes}>
              {Array.from({ length: 18 }).map((_, index) => (
                <View key={index} style={styles.dash} />
              ))}
            </View>
            <View style={[styles.notch, styles.notchRight]} />
          </View>

          <View style={styles.ticketBottom}>
            {expired ? (
              <Text style={styles.expiredText}>
                Bu Drop artık kullanılamıyor. Yakınındaki yeni fırsatları keşfetmek için ana sayfaya dönebilirsin.
              </Text>
            ) : (
              <>
                <Step icon="walk" text="İşletmeye git" />
                <Step icon="qr-code" text="Kasadaki QR kodu okut" />
                <Step icon="gift" text="Avantajını kullan" />
              </>
            )}

            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>CLAIM KODU</Text>
              <Text style={styles.code} numberOfLines={1} selectable>
                {id}
              </Text>
            </View>
          </View>
        </View>

        {!expired && (
          <Pressable
            accessibilityRole="button"
            disabled={cancelMutation.isPending}
            hitSlop={8}
            onPress={confirmCancel}
            style={({ pressed }) => [styles.cancel, (pressed || cancelMutation.isPending) && styles.cancelPressed]}
          >
            <Text style={styles.cancelText}>
              {cancelMutation.isPending ? 'İptal ediliyor…' : 'Rezervasyondan vazgeç'}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.actions}>
        {expired ? (
          <Button title="Yeni Drop'lara göz at" icon="compass" onPress={goHome} />
        ) : (
          <>
          {place && (
            <Button
              title="Yol tarifi al"
              icon="navigate"
              variant="light"
              size="md"
              style={styles.directions}
              onPress={() =>
                openDirections(place.latitude, place.longitude, `${place.businessName} ${place.branchName}`)
              }
            />
          )}
          <Button
            title="QR Kodu Okut"
            icon="scan"
            onPress={() => router.push({ pathname: '/(app)/claim/scanner/[id]', params: { id } })}
          />
          </>
        )}
      </View>
      <Confetti burstKey={burst} />
    </Screen>
  );
}

function Step({ icon, text }: { icon: ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  topTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  topSpacer: {
    width: 44,
  },
  content: {
    padding: spacing.xl,
  },
  ticket: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.raised,
  },
  ticketTop: {
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  orb: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
  },
  badge: {
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  title: {
    ...typography.title,
    marginTop: spacing.md,
    color: colors.textOnDark,
    textAlign: 'center',
  },
  timerLabel: {
    ...typography.overline,
    marginTop: spacing.xl,
    color: colors.textOnDarkMuted,
  },
  timer: {
    marginTop: 2,
    color: colors.textOnDark,
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  progress: {
    marginTop: spacing.md,
  },
  perforation: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
  },
  notch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg,
  },
  notchLeft: {
    marginLeft: -14,
  },
  notchRight: {
    marginRight: -14,
  },
  dashes: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  dash: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  ticketBottom: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 11,
  },
  stepText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  expiredText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  codeBox: {
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  codeLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textSubtle,
  },
  code: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  directions: {
    marginBottom: spacing.sm,
  },
  cancel: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  cancelPressed: {
    opacity: 0.6,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
