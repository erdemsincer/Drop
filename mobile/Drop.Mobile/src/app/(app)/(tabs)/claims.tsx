import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/features/claims/components/StarRating';
import { useMyClaims } from '@/features/claims/hooks/useMyClaims';
import { useRateClaim } from '@/features/claims/hooks/useRateClaim';
import type { ClaimStatus, MyClaim } from '@/features/claims/types/claim';
import { useCountdown } from '@/features/drops/hooks/useCountdown';
import { categoryInfo, categoryOf } from '@/features/drops/utils/categories';
import { dealOf } from '@/features/drops/utils/pricing';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Badge,
  ChoiceChips,
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

type Filter = 'all' | ClaimStatus;

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Tümü', value: 'all' },
  { label: 'Kullanılan', value: 'Redeemed' },
  { label: 'Süresi dolan', value: 'Expired' },
  { label: 'İptal', value: 'Cancelled' },
];

const statusBadge: Record<Exclude<ClaimStatus, 'Active'>, { label: string; tone: 'primary' | 'neutral' | 'danger' }> = {
  Redeemed: { label: 'KULLANILDI', tone: 'primary' },
  Expired: { label: 'SÜRESİ DOLDU', tone: 'neutral' },
  Cancelled: { label: 'İPTAL', tone: 'danger' },
};

const formatDay = (value: string) =>
  new Date(value).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const monthTitle = (value: string) =>
  new Date(value).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toLocaleUpperCase('tr-TR'));

const isSameMonth = (value: string, reference: Date) => {
  const date = new Date(value);
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
};

export default function MyClaimsScreen() {
  const claimsQuery = useMyClaims();
  const [filter, setFilter] = useState<Filter>('all');
  const claims = claimsQuery.data ?? [];

  const active = claims.find(claim => claim.status === 'Active');
  const past = claims.filter(claim => claim.status !== 'Active');
  const redeemed = past.filter(claim => claim.status === 'Redeemed');
  const now = new Date();
  const redeemedThisMonth = redeemed.filter(claim => isSameMonth(claim.redeemedAt ?? claim.createdAt, now)).length;

  // Past claims, filtered, grouped by the month they happened in (newest first, as served).
  const shown = filter === 'all' ? past : past.filter(claim => claim.status === filter);
  const sections: { title: string; data: MyClaim[] }[] = [];
  for (const claim of shown) {
    const title = monthTitle(claim.redeemedAt ?? claim.createdAt);
    const section = sections.at(-1);
    if (section?.title === title) section.data.push(claim);
    else sections.push({ title, data: [claim] });
  }

  const header = (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>DROP&apos;LARIM</Text>
      <Text style={styles.heading}>Yakaladıkların</Text>

      {claims.length > 0 && (
        <LinearGradient colors={gradients.night} style={styles.summary}>
          <View style={styles.orb} />
          <SummaryStat value={claims.length} label="Yakalanan" />
          <View style={styles.summaryDivider} />
          <SummaryStat value={redeemed.length} label="Kullanılan" highlight />
          <View style={styles.summaryDivider} />
          <SummaryStat value={redeemedThisMonth} label="Bu ay" />
        </LinearGradient>
      )}

      {active && <ActiveTicket claim={active} />}

      {past.length > 0 && (
        <View style={styles.filters}>
          <Text style={styles.sectionLabel}>Geçmiş</Text>
          <ChoiceChips options={FILTERS} value={filter} onChange={setFilter} />
        </View>
      )}
    </View>
  );

  return (
    <Screen edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.claimId}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => <Text style={styles.month}>{section.title}</Text>}
        renderItem={({ item }) => <PastClaimRow claim={item} />}
        ListEmptyComponent={
          claimsQuery.isLoading ? (
            <View style={styles.skeletons}>
              <Skeleton height={110} radius={radius.xl} />
              <Skeleton height={76} radius={radius.lg} />
              <Skeleton height={76} radius={radius.lg} />
            </View>
          ) : claimsQuery.isError ? (
            <StateView
              icon="cloud-offline"
              tone="danger"
              title="Drop'ların yüklenemedi"
              actionLabel="Tekrar dene"
              onAction={() => claimsQuery.refetch()}
            />
          ) : claims.length === 0 ? (
            <StateView
              icon="ticket"
              title="Henüz Drop yakalamadın"
              description="Yakınındaki fırsatları keşfet, ilk Drop'unu yakala."
              actionLabel="Keşfet"
              onAction={() => router.navigate('/(app)/(tabs)')}
            />
          ) : past.length > 0 ? (
            <Text style={styles.emptyFilter}>Bu filtrede Drop yok.</Text>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={claimsQuery.isRefetching}
            onRefresh={() => claimsQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      />
    </Screen>
  );
}

function SummaryStat({ value, label, highlight = false }: { value: number; label: string; highlight?: boolean }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

/** The one live reservation, styled like the ticket it opens. */
function ActiveTicket({ claim }: { claim: MyClaim }) {
  const remaining = useCountdown(claim.expiresAt);

  if (remaining.isExpired) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${claim.dropTitle}, aktif rezervasyon, ${remaining.label} kaldı`}
      onPress={() =>
        router.push({ pathname: '/(app)/claim/[id]', params: { id: claim.claimId, expiresAt: claim.expiresAt } })
      }
      style={({ pressed }) => [styles.ticketWrap, pressed && styles.pressed]}
    >
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ticket}>
        <View style={styles.ticketTop}>
          <Badge label="AKTİF REZERVASYON" tone="glass" live />
          <Ionicons name="qr-code" size={22} color={colors.textOnDark} />
        </View>
        <Text style={styles.ticketTitle} numberOfLines={2}>
          {claim.dropTitle}
        </Text>
        <Text style={styles.ticketPlace} numberOfLines={1}>
          {claim.businessName} · {claim.branchName}
        </Text>
        <View style={styles.ticketBottom}>
          <View>
            <Text style={styles.ticketLabel}>KALAN SÜRE</Text>
            <Text style={styles.ticketTimer}>{remaining.label}</Text>
          </View>
          <View style={styles.ticketCta}>
            <Text style={styles.ticketCtaText}>Bileti aç</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.ink} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function PastClaimRow({ claim }: { claim: MyClaim }) {
  const category = categoryInfo[categoryOf(claim.category)];
  const badge = statusBadge[claim.status === 'Active' ? 'Expired' : claim.status];
  const used = claim.status === 'Redeemed';
  // The locked-in price wins: on a falling-price drop that's what they paid.
  const deal = used ? dealOf({ originalPrice: claim.originalPrice, dealPrice: claim.price ?? claim.dealPrice }) : null;
  const rate = useRateClaim();

  return (
    <View style={[styles.row, !used && styles.rowFaded]}>
      <View style={styles.rowTop}>
        <View style={[styles.rowIcon, { backgroundColor: used ? category.tint : colors.surfaceMuted }]}>
          <Ionicons name={category.icon} size={20} color={used ? '#FFFFFF' : colors.textSubtle} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {claim.dropTitle}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {claim.businessName} · {formatDay(claim.redeemedAt ?? claim.createdAt)}
          </Text>
        </View>
        <Badge label={badge.label} tone={badge.tone} />
      </View>

      {used && (
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>
            {claim.rating ? 'Puanın' : 'Nasıldı?'}
            {deal && deal.saving > 0 && <Text style={styles.saved}>  · {formatCurrency(deal.saving)} tasarruf</Text>}
          </Text>
          <StarRating
            value={claim.rating}
            size={22}
            onChange={stars => rate.mutate({ claimId: claim.claimId, stars })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingTop: spacing.xl,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.primary,
  },
  heading: {
    ...typography.display,
    marginTop: 6,
    color: colors.text,
  },
  summary: {
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
  },
  orb: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  summaryValue: {
    color: colors.textOnDark,
    fontSize: 26,
    fontWeight: '900',
  },
  summaryValueHighlight: {
    color: colors.lime,
  },
  summaryLabel: {
    marginTop: 2,
    color: colors.textOnDarkMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  ticketWrap: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.primary,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  ticket: {
    padding: spacing.xl,
    borderRadius: radius.xl,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketTitle: {
    marginTop: spacing.md,
    color: colors.textOnDark,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  ticketPlace: {
    marginTop: 4,
    color: colors.textOnDarkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  ticketBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  ticketLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textOnDarkMuted,
  },
  ticketTimer: {
    color: colors.textOnDark,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  ticketCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
  },
  ticketCtaText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  filters: {
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  sectionLabel: {
    ...typography.heading,
    color: colors.text,
  },
  month: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rateLabel: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  saved: {
    color: colors.success,
    fontWeight: '800',
  },
  rowFaded: {
    opacity: 0.75,
  },
  rowIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  rowMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  skeletons: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  emptyFilter: {
    marginTop: spacing.xl,
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
