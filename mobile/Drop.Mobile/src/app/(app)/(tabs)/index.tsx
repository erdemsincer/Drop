import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ActiveClaimBanner } from '@/features/claims/components/ActiveClaimBanner';
import { useMyBusinesses } from '@/features/businesses/hooks/useMyBusinesses';
import { useActiveClaim } from '@/features/claims/hooks/useActiveClaim';
import type { ActiveClaim } from '@/features/claims/types/claim';
import { CategoryFilter } from '@/features/drops/components/CategoryFilter';
import { DropCard } from '@/features/drops/components/DropCard';
import { DropCardSkeleton } from '@/features/drops/components/DropCardSkeleton';
import { RadiusFilter } from '@/features/drops/components/RadiusFilter';
import { useNearbyDrops } from '@/features/drops/hooks/useNearbyDrops';
import { type DropCategory, categoryInfo, categoryOf } from '@/features/drops/utils/categories';
import { useCurrentLocation } from '@/features/location/hooks/useCurrentLocation';
import {
  Screen,
  StateView,
  colors,
  gradients,
  radius,
  spacing,
  typography,
} from '@/ui';

export default function HomeScreen() {
  const [radiusKm, setRadiusKm] = useState(5);
  const [category, setCategory] = useState<DropCategory | null>(null);

  const locationQuery = useCurrentLocation();
  const activeClaimQuery = useActiveClaim();
  // Business mode is only offered to members of at least one business.
  const businessesQuery = useMyBusinesses();
  const hasBusiness = (businessesQuery.data?.length ?? 0) > 0;

  const nearbyQuery = useNearbyDrops({
    latitude: locationQuery.data?.latitude,
    longitude: locationQuery.data?.longitude,
    radiusKm,
  });

  const allDrops = nearbyQuery.data ?? [];

  // Filtered on the device: switching chips is instant and each chip shows its count.
  const counts: Partial<Record<DropCategory, number>> = {};
  for (const drop of allDrops) {
    const key = categoryOf(drop.category);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  // A category that just ran out of drops quietly falls back to "all".
  const activeCategory = category && counts[category] ? category : null;
  const drops = activeCategory ? allDrops.filter(drop => categoryOf(drop.category) === activeCategory) : allDrops;

  const openClaim = (claim: ActiveClaim) =>
    router.push({
      pathname: '/(app)/claim/[id]',
      params: { id: claim.claimId, expiresAt: claim.expiresAt },
    });

  if (locationQuery.isLoading) {
    return (
      <Screen>
        <StateView
          loading
          title="Konumun alınıyor"
          description="Sana en yakın Drop'ları bulmak üzereyiz."
        />
      </Screen>
    );
  }

  if (locationQuery.isError) {
    const denied = locationQuery.error.message === 'location.permission_denied';

    return (
      <Screen>
        <StateView
          icon="location"
          tone="warning"
          title="Konumuna erişemedik"
          description="Yakınındaki fırsatları gösterebilmemiz için konum iznine ihtiyacımız var."
          actionLabel={denied ? 'Ayarları Aç' : 'Tekrar dene'}
          onAction={() => (denied ? Linking.openSettings() : locationQuery.refetch())}
          secondaryLabel={denied ? 'Tekrar dene' : undefined}
          onSecondary={denied ? () => locationQuery.refetch() : undefined}
        />
      </Screen>
    );
  }

  const header = (
    <View>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <LinearGradient colors={gradients.primary} style={styles.logoMark}>
            <Ionicons name="flash" size={18} color={colors.lime} />
          </LinearGradient>
          <Text style={styles.logo}>drop</Text>
        </View>

        <View style={styles.topActions}>
          {hasBusiness && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="İşletme moduna geç"
              onPress={() => router.push('/(app)/business')}
              style={({ pressed }) => [styles.modeButton, pressed && styles.modeButtonPressed]}
            >
              <Ionicons name="storefront" size={15} color={colors.textOnDark} />
              <Text style={styles.modeButtonText}>İşletme</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Text style={styles.eyebrow}>ŞU AN YAKININDA</Text>
      <Text style={styles.heading}>Kaçırılmayacak{'\n'}anlık fırsatlar</Text>

      {activeClaimQuery.data && (
        <View style={styles.banner}>
          <ActiveClaimBanner
            claim={activeClaimQuery.data}
            onPress={() => openClaim(activeClaimQuery.data!)}
          />
        </View>
      )}

      <RadiusFilter value={radiusKm} onChange={setRadiusKm} />

      <CategoryFilter counts={counts} total={allDrops.length} value={activeCategory} onChange={setCategory} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeCategory ? categoryInfo[activeCategory].label : 'Aktif Drop\'lar'}
        </Text>
        {!nearbyQuery.isLoading && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{drops.length}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Screen edges={['top']}>
      <FlatList
        data={nearbyQuery.isLoading || nearbyQuery.isError ? [] : drops}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DropCard
            drop={item}
            onPress={() => router.push({ pathname: '/(app)/drop/[id]', params: { id: item.id } })}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          nearbyQuery.isLoading ? (
            <>
              <DropCardSkeleton />
              <DropCardSkeleton />
            </>
          ) : nearbyQuery.isError ? (
            <StateView
              icon="cloud-offline"
              tone="danger"
              title="Drop'lar yüklenemedi"
              description="Bağlantında bir sorun olabilir. Birazdan tekrar dene."
              actionLabel="Tekrar dene"
              onAction={() => nearbyQuery.refetch()}
            />
          ) : (
            <StateView
              icon="cafe"
              title="Buralar şimdilik sakin"
              description={`${radiusKm} km çevrende aktif Drop yok. Mesafeyi artırabilir ya da biraz sonra tekrar bakabilirsin.`}
              actionLabel={radiusKm < 10 ? 'Mesafeyi artır' : undefined}
              onAction={radiusKm < 10 ? () => setRadiusKm(10) : undefined}
            />
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={nearbyQuery.isRefetching}
            onRefresh={() => {
              void nearbyQuery.refetch();
              void activeClaimQuery.refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: colors.ink,
    borderRadius: 14,
  },
  modeButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  modeButtonText: {
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: '800',
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.primary,
  },
  heading: {
    ...typography.display,
    marginTop: 6,
    marginBottom: spacing.xl,
    color: colors.text,
  },
  banner: {
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  countPill: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
  countText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
});
