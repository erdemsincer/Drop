import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiError } from '@/api/getApiError';
import { useCreateClaim } from '@/features/claims/hooks/useCreateClaim';
import { getClaimErrorMessage } from '@/features/claims/utils/getClaimErrorMessage';
import { useCountdown } from '@/features/drops/hooks/useCountdown';
import { useDropDetail } from '@/features/drops/hooks/useDropDetail';
import type { DropDetail } from '@/features/drops/types/drop';
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  Notice,
  ProgressBar,
  Screen,
  StateView,
  colors,
  gradients,
  haptics,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';
import { formatCurrency } from '@/utils/formatCurrency';

export default function DropDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dropQuery = useDropDetail(id);

  if (dropQuery.isLoading) {
    return (
      <Screen>
        <StateView loading title="Drop yükleniyor" description="Fırsatın detaylarını hazırlıyoruz." />
      </Screen>
    );
  }

  if (dropQuery.isError || !dropQuery.data) {
    return (
      <Screen>
        <StateView
          icon="search"
          tone="danger"
          title="Drop bulunamadı"
          description="Bu Drop kaldırılmış ya da artık erişilemiyor olabilir."
          actionLabel="Geri dön"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return <DropDetailContent drop={dropQuery.data} />;
}

function DropDetailContent({ drop }: { drop: DropDetail }) {
  const insets = useSafeAreaInsets();
  const remaining = useCountdown(drop.endsAt);
  const claimMutation = useCreateClaim();

  const apiError = claimMutation.error ? getApiError(claimMutation.error) : null;
  const soldOut = drop.remainingCapacity <= 0;
  const ended = remaining.isExpired;
  const unavailable = soldOut || ended;

  const handleClaim = () => {
    haptics.press();

    claimMutation.mutate(drop.id, {
      onSuccess: claim => {
        haptics.success();
        router.replace({
          pathname: '/(app)/claim/[id]',
          params: {
            id: claim.claimId,
            expiresAt: claim.expiresAt,
            durationMinutes: String(drop.claimDurationMinutes),
          },
        });
      },
      onError: () => haptics.error(),
    });
  };

  const claimedRatio = drop.capacity > 0 ? drop.claimedCount / drop.capacity : 1;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
      >
        <LinearGradient colors={gradients.night} style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.orb} />

          <View style={styles.heroBar}>
            <IconButton icon="chevron-back" tone="glass" accessibilityLabel="Geri dön" onPress={() => router.back()} />
            {soldOut ? (
              <Badge label="TÜKENDİ" tone="glass" />
            ) : ended ? (
              <Badge label="SONA ERDİ" tone="glass" />
            ) : (
              <Badge label="CANLI" tone="glass" live />
            )}
          </View>

          <View style={styles.businessRow}>
            <Avatar name={drop.businessName} size={52} />
            <View style={styles.businessInfo}>
              <Text style={styles.businessName} numberOfLines={1}>
                {drop.businessName}
              </Text>
              <View style={styles.branchRow}>
                <Ionicons name="location" size={13} color={colors.textOnDarkMuted} />
                <Text style={styles.branchName} numberOfLines={1}>
                  {drop.branchName}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>{drop.title}</Text>
          {!!drop.description && <Text style={styles.description}>{drop.description}</Text>}
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <Stat
                icon="people"
                label="Kalan"
                value={`${drop.remainingCapacity}`}
                suffix={`/${drop.capacity}`}
                danger={soldOut}
              />
              <View style={styles.statDivider} />
              <Stat
                icon="hourglass"
                label="Bitişe"
                value={ended ? '00:00' : remaining.label}
                danger={ended}
              />
              <View style={styles.statDivider} />
              <Stat icon="timer" label="Kullanım" value={`${drop.claimDurationMinutes}`} suffix=" dk" />
            </View>

            <ProgressBar
              value={claimedRatio}
              color={soldOut || drop.remainingCapacity <= 3 ? colors.danger : colors.primary}
              height={8}
              style={styles.progress}
            />
            <Text style={styles.progressCaption}>
              {drop.claimedCount} kişi yakaladı · {drop.remainingCapacity} yer kaldı
            </Text>
          </View>

          {drop.minimumSpend != null && (
            <View style={styles.spendCard}>
              <View style={styles.spendIcon}>
                <Ionicons name="wallet" size={20} color={colors.warning} />
              </View>
              <View style={styles.spendText}>
                <Text style={styles.spendLabel}>Minimum harcama</Text>
                <Text style={styles.spendValue}>{formatCurrency(drop.minimumSpend)}</Text>
              </View>
            </View>
          )}

          <View style={styles.steps}>
            <Text style={styles.stepsTitle}>Nasıl çalışır?</Text>

            <Step icon="flash" title="Drop'u yakala" description="Butona dokun, fırsat senin için ayrılsın." />
            <Step
              icon="walk"
              title="İşletmeye git"
              description={`${drop.claimDurationMinutes} dakika içinde ${drop.branchName} şubesine ulaş.`}
            />
            <Step icon="qr-code" title="QR kodu okut" description="Kasadaki Drop QR kodunu uygulamadan tara." />
            <Step icon="gift" title="Avantajını kullan" description="Doğrulama anında tamamlanır." isLast />
          </View>

          {apiError && (
            <Notice message={getClaimErrorMessage(apiError.code, apiError.detail)} />
          )}
          {claimMutation.isError && !apiError && (
            <Notice message="Sunucuya ulaşılamadı. Bağlantını kontrol et." />
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.bottomInfo}>
          <Ionicons name="timer-outline" size={16} color={colors.textMuted} />
          <Text style={styles.bottomInfoText}>
            Yakaladıktan sonra <Text style={styles.bottomInfoStrong}>{drop.claimDurationMinutes} dakikan</Text> var
          </Text>
        </View>

        <Button
          title={soldOut ? 'Tükendi' : ended ? 'Sona erdi' : "Drop'u Yakala"}
          icon={unavailable ? 'lock-closed' : 'flash'}
          disabled={unavailable}
          loading={claimMutation.isPending}
          onPress={handleClaim}
        />
      </View>
    </View>
  );
}

type StatProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  suffix?: string;
  danger?: boolean;
};

function Stat({ icon, label, value, suffix, danger = false }: StatProps) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={danger ? colors.danger : colors.primary} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, danger && styles.statValueDanger]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        {suffix && <Text style={styles.statSuffix}>{suffix}</Text>}
      </Text>
    </View>
  );
}

type StepProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  isLast?: boolean;
};

function Step({ icon, title, description, isLast = false }: StepProps) {
  return (
    <View style={styles.step}>
      <View style={styles.stepRail}>
        <View style={styles.stepIcon}>
          <Ionicons name={icon} size={17} color={colors.primary} />
        </View>
        {!isLast && <View style={styles.stepLine} />}
      </View>
      <View style={[styles.stepText, !isLast && styles.stepTextSpaced]}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
    paddingBottom: 64,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  orb: {
    position: 'absolute',
    top: -80,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    color: colors.textOnDark,
    fontSize: 17,
    fontWeight: '800',
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  branchName: {
    color: colors.textOnDarkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    ...typography.display,
    marginTop: spacing.xl,
    color: colors.textOnDark,
  },
  description: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.textOnDarkMuted,
  },
  body: {
    gap: spacing.lg,
    marginTop: -40,
    paddingHorizontal: spacing.xl,
  },
  statsCard: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.raised,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statValueDanger: {
    color: colors.danger,
  },
  statSuffix: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '700',
  },
  progress: {
    marginTop: spacing.xl,
  },
  progressCaption: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  spendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  spendIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
  },
  spendText: {
    flex: 1,
  },
  spendLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  spendValue: {
    marginTop: 2,
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  steps: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  stepsTitle: {
    ...typography.heading,
    marginBottom: spacing.lg,
    color: colors.text,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepRail: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  stepLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: 1,
  },
  stepText: {
    flex: 1,
    paddingTop: 2,
  },
  stepTextSpaced: {
    paddingBottom: spacing.lg,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  stepDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.raised,
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bottomInfoText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  bottomInfoStrong: {
    color: colors.text,
    fontWeight: '800',
  },
});
