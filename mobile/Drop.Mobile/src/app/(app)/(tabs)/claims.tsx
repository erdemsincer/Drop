import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { useMyClaims } from '@/features/claims/hooks/useMyClaims';
import type { ClaimStatus, MyClaim } from '@/features/claims/types/claim';
import { useCountdown } from '@/features/drops/hooks/useCountdown';
import {
  Avatar,
  Badge,
  Screen,
  Skeleton,
  StateView,
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

const statusBadge: Record<ClaimStatus, { label: string; tone: 'success' | 'primary' | 'neutral' | 'danger' }> = {
  Active: { label: 'AKTİF', tone: 'success' },
  Redeemed: { label: 'KULLANILDI', tone: 'primary' },
  Expired: { label: 'SÜRESİ DOLDU', tone: 'neutral' },
  Cancelled: { label: 'İPTAL EDİLDİ', tone: 'danger' },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MyClaimsScreen() {
  const claimsQuery = useMyClaims();
  const claims = claimsQuery.data ?? [];

  const active = claims.filter(claim => claim.status === 'Active');
  const past = claims.filter(claim => claim.status !== 'Active');
  const redeemedCount = claims.filter(claim => claim.status === 'Redeemed').length;

  const sections = [
    ...(active.length ? [{ title: 'Aktif', data: active }] : []),
    ...(past.length ? [{ title: 'Geçmiş', data: past }] : []),
  ];

  return (
    <Screen edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.claimId}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>DROP&apos;LARIM</Text>
            <Text style={styles.heading}>Yakaladıkların</Text>
            {redeemedCount > 0 && (
              <View style={styles.stat}>
                <Ionicons name="trophy" size={16} color={colors.warning} />
                <Text style={styles.statText}>
                  Şimdiye kadar <Text style={styles.statStrong}>{redeemedCount} Drop</Text> kullandın
                </Text>
              </View>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        renderItem={({ item }) => <ClaimCard claim={item} />}
        ListEmptyComponent={
          claimsQuery.isLoading ? (
            <View style={styles.skeletons}>
              <Skeleton height={96} radius={radius.xl} />
              <Skeleton height={96} radius={radius.xl} />
            </View>
          ) : claimsQuery.isError ? (
            <StateView
              icon="cloud-offline"
              tone="danger"
              title="Drop'ların yüklenemedi"
              actionLabel="Tekrar dene"
              onAction={() => claimsQuery.refetch()}
            />
          ) : (
            <StateView
              icon="ticket"
              title="Henüz Drop yakalamadın"
              description="Yakınındaki fırsatları keşfet, ilk Drop'unu yakala."
              actionLabel="Keşfet"
              onAction={() => router.navigate('/(app)/(tabs)')}
            />
          )
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

function ClaimCard({ claim }: { claim: MyClaim }) {
  const remaining = useCountdown(claim.expiresAt);
  const isActive = claim.status === 'Active' && !remaining.isExpired;
  const badge = statusBadge[isActive || claim.status !== 'Active' ? claim.status : 'Expired'];

  const content = (
    <>
      <Avatar name={claim.businessName} size={46} />
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {claim.dropTitle}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {claim.businessName} · {claim.branchName}
        </Text>
        <View style={styles.cardFooter}>
          <Badge label={badge.label} tone={badge.tone} live={isActive} />
          <Text style={styles.cardDate}>
            {isActive
              ? `${remaining.label} kaldı`
              : formatDate(claim.redeemedAt ?? claim.createdAt)}
          </Text>
        </View>
      </View>
      {isActive && <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />}
    </>
  );

  if (!isActive) {
    return <View style={[styles.card, styles.cardPast]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${claim.dropTitle}, aktif`}
      onPress={() =>
        router.push({ pathname: '/(app)/claim/[id]', params: { id: claim.claimId, expiresAt: claim.expiresAt } })
      }
      style={({ pressed }) => [styles.card, styles.cardActive, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
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
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.pill,
  },
  statText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  statStrong: {
    fontWeight: '900',
  },
  sectionTitle: {
    ...typography.heading,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    color: colors.text,
  },
  skeletons: {
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  cardActive: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  cardPast: {
    opacity: 0.8,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cardDate: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
