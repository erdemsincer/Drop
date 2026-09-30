import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useBusinessStats } from '@/features/businesses/hooks/useBusinessStats';
import { useMyBusinesses } from '@/features/businesses/hooks/useMyBusinesses';
import type { BusinessStats } from '@/features/businesses/types/business';
import {
  ChoiceChips,
  Header,
  Screen,
  Skeleton,
  StateView,
  colors,
  gradients,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

const PERIODS = [
  { label: '7 gün', value: 7 },
  { label: '30 gün', value: 30 },
  { label: '90 gün', value: 90 },
];

const CHART_HEIGHT = 120;

export default function BusinessStatsScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [days, setDays] = useState(30);

  const business = useMyBusinesses().data?.find(item => item.id === businessId);
  const statsQuery = useBusinessStats(businessId, days);
  const stats = statsQuery.data;

  if (statsQuery.isError && !stats) {
    const denied = getApiError(statsQuery.error)?.code === 'business.access_denied';

    return (
      <Screen>
        <Header title="İstatistikler" onBack={() => router.back()} />
        <StateView
          icon={denied ? 'lock-closed' : 'cloud-offline'}
          tone="danger"
          title={denied ? 'Yetkin yok' : 'İstatistikler yüklenemedi'}
          description={denied ? 'İstatistikleri işletme sahibi ve yöneticiler görebilir.' : undefined}
          actionLabel={denied ? undefined : 'Tekrar dene'}
          onAction={denied ? undefined : () => statsQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <Header title={business?.name ?? 'İstatistikler'} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statsQuery.isRefetching}
            onRefresh={() => statsQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <ChoiceChips options={PERIODS} value={days} onChange={setDays} />

        {!stats ? (
          <View style={styles.skeletons}>
            <Skeleton height={150} radius={radius.xl} />
            <Skeleton height={200} radius={radius.xl} />
          </View>
        ) : (
          <View style={[styles.sections, statsQuery.isPlaceholderData && styles.stale]}>
            <Hero stats={stats} />

            <View style={styles.tiles}>
              <Tile icon="flash" label="Yayınlanan Drop" value={stats.dropsPublished} />
              <Tile icon="ticket" label="Rezervasyon" value={stats.reservations} />
              <Tile icon="people" label="Tekil müşteri" value={stats.uniqueCustomers} />
              <Tile icon="repeat" label="Geri gelen" value={stats.returningCustomers} />
            </View>

            <Card title="Günlük kullanım" subtitle="Kasada okutulan Drop sayısı">
              <DailyChart daily={stats.daily} />
            </Card>

            {stats.topDrops.length > 0 && (
              <Card title="En iyi Drop'lar">
                {stats.topDrops.map((drop, index) => (
                  <View key={drop.dropId} style={[styles.row, index > 0 && styles.rowBorder]}>
                    <Text style={styles.rank}>{index + 1}</Text>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {drop.title}
                      </Text>
                      <Text style={styles.rowSub}>
                        {drop.branchName} · {drop.reservations} rezervasyon
                      </Text>
                    </View>
                    <Text style={styles.rowValue}>{drop.redemptions}</Text>
                  </View>
                ))}
              </Card>
            )}

            {stats.branches.length > 1 && (
              <Card title="Şubeler" subtitle="Kullanılan Drop sayısı">
                {stats.branches.map((branch, index) => (
                  <View key={branch.branchId} style={[styles.row, index > 0 && styles.rowBorder]}>
                    <Ionicons name="storefront-outline" size={18} color={colors.primary} />
                    <Text style={[styles.rowTitle, styles.rowText]} numberOfLines={1}>
                      {branch.name}
                    </Text>
                    <Text style={styles.rowValue}>{branch.redemptions}</Text>
                  </View>
                ))}
              </Card>
            )}

            {stats.reservations === 0 && stats.redemptions === 0 && (
              <Text style={styles.empty}>
                Bu dönemde henüz hareket yok. İlk Drop&apos;unu yayınladığında rakamlar burada görünecek.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Hero({ stats }: { stats: BusinessStats }) {
  const rate = Math.round(stats.redemptionRate * 100);

  return (
    <LinearGradient colors={gradients.night} style={styles.hero}>
      <View style={styles.orb} />
      <Text style={styles.heroLabel}>SON {stats.days} GÜN</Text>
      <Text style={styles.heroValue}>{stats.redemptions}</Text>
      <Text style={styles.heroCaption}>müşteri Drop&apos;unu kasada kullandı</Text>

      <View style={styles.rate}>
        <View style={styles.rateTrack}>
          <View style={[styles.rateFill, { width: `${Math.min(rate, 100)}%` }]} />
        </View>
        <Text style={styles.rateText}>Rezervasyonların %{rate}&apos;i kullanıldı</Text>
      </View>
    </LinearGradient>
  );
}

function Tile({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: number }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

/** Bars per day; long periods are grouped into weeks so bars stay readable. */
function DailyChart({ daily }: { daily: BusinessStats['daily'] }) {
  const bucketSize = daily.length > 31 ? 7 : 1;
  const buckets: { label: string; value: number }[] = [];

  for (let i = 0; i < daily.length; i += bucketSize) {
    const slice = daily.slice(i, i + bucketSize);
    const first = new Date(`${slice[0].date}T12:00:00`);
    buckets.push({
      label: bucketSize === 1 ? String(first.getDate()) : first.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      value: slice.reduce((sum, day) => sum + day.redemptions, 0),
    });
  }

  const max = Math.max(1, ...buckets.map(bucket => bucket.value));
  // Label every bar when there are few, otherwise about six evenly spaced labels.
  const labelEvery = buckets.length <= 8 ? 1 : Math.ceil(buckets.length / 6);

  return (
    <View>
      <View style={styles.chart}>
        {buckets.map((bucket, index) => (
          <View key={index} style={styles.barColumn}>
            {bucket.value > 0 && buckets.length <= 14 && <Text style={styles.barValue}>{bucket.value}</Text>}
            <View
              style={[
                styles.bar,
                { height: Math.max(3, (bucket.value / max) * CHART_HEIGHT) },
                bucket.value === 0 && styles.barEmpty,
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        {buckets.map((bucket, index) => (
          <Text key={index} style={styles.axisLabel} numberOfLines={1}>
            {index % labelEvery === 0 ? bucket.label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  skeletons: {
    gap: spacing.lg,
  },
  sections: {
    gap: spacing.lg,
  },
  stale: {
    opacity: 0.6,
  },
  hero: {
    overflow: 'hidden',
    padding: spacing.xl,
    borderRadius: radius.xl,
  },
  orb: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primary,
    opacity: 0.45,
  },
  heroLabel: {
    ...typography.overline,
    color: colors.lime,
  },
  heroValue: {
    marginTop: spacing.xs,
    color: colors.textOnDark,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -2,
  },
  heroCaption: {
    color: colors.textOnDarkMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  rate: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  rateTrack: {
    height: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.pill,
  },
  rateFill: {
    height: '100%',
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
  },
  rateText: {
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: '700',
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexBasis: '46%',
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  tileIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
  },
  tileValue: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  tileLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
  },
  cardSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: CHART_HEIGHT + 18,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    marginBottom: 3,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  bar: {
    width: '100%',
    maxWidth: 22,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  barEmpty: {
    backgroundColor: colors.surfaceMuted,
  },
  axis: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 6,
  },
  axisLabel: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  rank: {
    width: 22,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  rowSub: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rowValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
