import { Ionicons } from '@expo/vector-icons';
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
import { DropsMap } from '@/features/drops/components/DropsMap';
import { EmptyRadar } from '@/features/drops/components/EmptyRadar';
import { StoryRings } from '@/features/drops/components/StoryRings';
import { UpcomingStrip } from '@/features/drops/components/UpcomingStrip';
import { RadiusFilter } from '@/features/drops/components/RadiusFilter';
import { type DropSort, SortMenu, sortDrops } from '@/features/drops/components/SortMenu';
import { useNearbyDrops } from '@/features/drops/hooks/useNearbyDrops';
import { useUpcomingDrops } from '@/features/drops/hooks/useUpcomingDrops';
import { type DropCategory, categoryInfo, categoryOf } from '@/features/drops/utils/categories';
import { mapAvailable } from '@/features/drops/utils/maps';
import { useMe } from '@/features/users/hooks/useMe';
import { useCurrentLocation } from '@/features/location/hooks/useCurrentLocation';
import {
  BrandMark,
  Screen,
  StateView,
  colors,
  haptics,
  radius,
  spacing,
  typography,
} from '@/ui';

export default function HomeScreen() {
  const [radiusKm, setRadiusKm] = useState(5);
  const [category, setCategory] = useState<DropCategory | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [sort, setSort] = useState<DropSort>('distance');

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

  const upcomingQuery = useUpcomingDrops({
    latitude: locationQuery.data?.latitude,
    longitude: locationQuery.data?.longitude,
    radiusKm,
  });

  const allDrops = nearbyQuery.data ?? [];
  const liveCount = allDrops.filter(drop => drop.remainingCapacity > 0).length;
  const me = useMe().data;

  // Filtered on the device: switching chips is instant and each chip shows its count.
  const counts: Partial<Record<DropCategory, number>> = {};
  for (const drop of allDrops) {
    const key = categoryOf(drop.category);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  // A category that just ran out of drops quietly falls back to "all".
  const activeCategory = category && counts[category] ? category : null;
  const drops = activeCategory ? allDrops.filter(drop => categoryOf(drop.category) === activeCategory) : allDrops;
  // The server already orders by distance; other orders are applied on the device.
  const listDrops = sortDrops(drops, sort);

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

  const topBar = (
    <View style={styles.topBar}>
      <BrandMark size={36} tone="dark" />

      <View style={styles.topActions}>
        {mapAvailable && <ViewToggle value={view} onChange={setView} />}
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
  );

  const openDrop = (id: string) => router.push({ pathname: '/(app)/drop/[id]', params: { id } });

  if (view === 'map' && mapAvailable && locationQuery.data) {
    return (
      <Screen edges={['top']}>
        <View style={styles.mapHeader}>
          {topBar}
          {activeClaimQuery.data && (
            <ActiveClaimBanner claim={activeClaimQuery.data} onPress={() => openClaim(activeClaimQuery.data!)} />
          )}
          <RadiusFilter value={radiusKm} onChange={setRadiusKm} />
          <CategoryFilter counts={counts} total={allDrops.length} value={activeCategory} onChange={setCategory} />
        </View>

        <DropsMap
          drops={drops}
          latitude={locationQuery.data.latitude}
          longitude={locationQuery.data.longitude}
          radiusKm={radiusKm}
          onOpenDrop={openDrop}
        />
      </Screen>
    );
  }

  const header = (
    <View>
      {topBar}

      <StoryRings
        drops={allDrops}
        onOpen={index =>
          router.push({ pathname: '/(app)/stories', params: { start: String(index), radiusKm: String(radiusKm) } })
        }
      />

      <Text style={styles.eyebrow}>
        {me?.firstName ? `MERHABA ${me.firstName.toLocaleUpperCase('tr-TR')}` : 'ŞU AN YAKININDA'}
      </Text>
      {liveCount > 0 ? (
        <Text style={styles.heading}>
          Yakınında <Text style={styles.headingAccent}>{liveCount} fırsat</Text>
          {'\n'}seni bekliyor
        </Text>
      ) : (
        <Text style={styles.heading}>Kaçırılmayacak{'\n'}anlık fırsatlar</Text>
      )}

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

      <UpcomingStrip drops={upcomingQuery.data ?? []} onOpen={openDrop} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeCategory ? categoryInfo[activeCategory].label : 'Aktif Drop\'lar'}
        </Text>
        {!nearbyQuery.isLoading && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{drops.length}</Text>
          </View>
        )}
        {drops.length > 1 && <SortMenu value={sort} onChange={setSort} />}
      </View>
    </View>
  );

  return (
    <Screen edges={['top']}>
      <FlatList
        data={nearbyQuery.isLoading || nearbyQuery.isError ? [] : listDrops}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DropCard
            drop={item}
            onPress={() => openDrop(item.id)}
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
            <EmptyRadar
              radiusKm={radiusKm}
              onWiden={radiusKm < 10 ? () => setRadiusKm(10) : undefined}
              onAddBusiness={() => router.push(hasBusiness ? '/(app)/business' : '/(app)/business/create')}
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
              void upcomingQuery.refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

function ViewToggle({ value, onChange }: { value: 'list' | 'map'; onChange: (value: 'list' | 'map') => void }) {
  const option = (target: 'list' | 'map', icon: 'list' | 'map', label: string) => {
    const selected = value === target;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={() => {
          if (selected) return;
          haptics.tap();
          onChange(target);
        }}
        style={[styles.toggleOption, selected && styles.toggleOptionSelected]}
      >
        <Ionicons name={selected ? icon : `${icon}-outline`} size={18} color={selected ? colors.textOnDark : colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <View style={styles.toggle}>
      {option('list', 'list', 'Liste görünümü')}
      {option('map', 'map', 'Harita görünümü')}
    </View>
  );
}

const styles = StyleSheet.create({
  mapHeader: {
    paddingHorizontal: spacing.xl,
  },
  toggle: {
    flexDirection: 'row',
    padding: 3,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  toggleOption: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  toggleOptionSelected: {
    backgroundColor: colors.ink,
  },
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
  headingAccent: {
    color: colors.primary,
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
