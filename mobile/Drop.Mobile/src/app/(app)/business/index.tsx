import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useMyBusinesses } from '@/features/businesses/hooks/useMyBusinesses';
import type { MyBusiness } from '@/features/businesses/types/business';
import { businessStatusInfo, roleLabels } from '@/features/businesses/utils/businessLabels';
import {
  Avatar,
  Badge,
  Header,
  IconButton,
  Screen,
  Skeleton,
  StateView,
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

export default function BusinessHomeScreen() {
  const businessesQuery = useMyBusinesses();
  const businesses = businessesQuery.data ?? [];

  const goCustomer = () => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)'));
  const goCreate = () => router.push('/(app)/business/create');

  if (businessesQuery.isError) {
    return (
      <Screen>
        <Header onBack={goCustomer} />
        <StateView
          icon="cloud-offline"
          tone="danger"
          title="İşletmeler yüklenemedi"
          description="Bağlantında bir sorun olabilir."
          actionLabel="Tekrar dene"
          onAction={() => businessesQuery.refetch()}
        />
      </Screen>
    );
  }

  // Only business members reach this screen; anyone else goes back to the feed.
  if (!businessesQuery.isLoading && businesses.length === 0) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Screen edges={['top']}>
      <Header
        onBack={goCustomer}
        right={<IconButton icon="add" accessibilityLabel="İşletme ekle" onPress={goCreate} />}
      />

      <FlatList
        data={businesses}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>İŞLETME PANELİ</Text>
            <Text style={styles.heading}>İşletmelerin</Text>
          </View>
        }
        ListEmptyComponent={
          businessesQuery.isLoading ? (
            <View style={styles.skeletons}>
              <Skeleton height={86} radius={radius.xl} />
              <Skeleton height={86} radius={radius.xl} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <BusinessCard
            business={item}
            onPress={() =>
              router.push({ pathname: '/(app)/business/[businessId]', params: { businessId: item.id } })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={businessesQuery.isRefetching}
            onRefresh={() => businessesQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      />
    </Screen>
  );
}

function BusinessCard({ business, onPress }: { business: MyBusiness; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={business.name}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Avatar name={business.name} size={52} />
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {business.name}
        </Text>
        <View style={styles.cardMeta}>
          <Badge label={roleLabels[business.role].toUpperCase()} tone="primary" />
          {business.status !== 'Approved' && (
            <Badge
              label={businessStatusInfo[business.status].label}
              tone={businessStatusInfo[business.status].tone}
              icon={businessStatusInfo[business.status].icon}
            />
          )}
          <Text style={styles.cardMetaText}>
            {business.branchCount} şube
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  intro: {
    marginBottom: spacing.xl,
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
  skeletons: {
    gap: spacing.md,
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
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 7,
  },
  cardMetaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
