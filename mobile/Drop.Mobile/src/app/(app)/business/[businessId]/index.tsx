import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useBranches } from '@/features/businesses/hooks/useBranches';
import { useMyBusinesses } from '@/features/businesses/hooks/useMyBusinesses';
import type { Branch } from '@/features/businesses/types/business';
import { canManageRole, roleLabels } from '@/features/businesses/utils/businessLabels';
import {
  Avatar,
  Badge,
  Button,
  Header,
  Screen,
  Skeleton,
  StateView,
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

export default function BusinessDetailScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const businessesQuery = useMyBusinesses();
  const branchesQuery = useBranches(businessId);

  const business = businessesQuery.data?.find(item => item.id === businessId);
  const canManage = canManageRole(business?.role);
  const branches = branchesQuery.data ?? [];

  const goCreateBranch = () =>
    router.push({ pathname: '/(app)/business/[businessId]/create-branch', params: { businessId } });

  if (branchesQuery.isError) {
    return (
      <Screen>
        <Header onBack={() => router.back()} />
        <StateView
          icon="alert-circle"
          tone="danger"
          title="Şubeler yüklenemedi"
          description="Bu işletmeyi görüntüleme yetkin olmayabilir ya da bağlantında sorun var."
          actionLabel="Tekrar dene"
          onAction={() => branchesQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <Header
        onBack={() => router.back()}
        right={
          <Button
            title="Ekip"
            icon="people"
            variant="light"
            size="md"
            onPress={() => router.push({ pathname: '/(app)/business/[businessId]/team', params: { businessId } })}
          />
        }
      />

      <FlatList
        data={branches}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.intro}>
            <View style={styles.identity}>
              <Avatar name={business?.name ?? '?'} size={64} />
              <View style={styles.identityText}>
                <Text style={styles.name} numberOfLines={2}>
                  {business?.name ?? 'İşletme'}
                </Text>
                {business && <Badge label={roleLabels[business.role].toUpperCase()} tone="primary" />}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Şubeler</Text>
              {canManage && branches.length > 0 && (
                <Button title="Yeni Şube" icon="add" variant="ghost" size="md" onPress={goCreateBranch} />
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          branchesQuery.isLoading ? (
            <View style={styles.skeletons}>
              <Skeleton height={92} radius={radius.xl} />
              <Skeleton height={92} radius={radius.xl} />
            </View>
          ) : (
            <StateView
              icon="location"
              title="İlk şubeni ekle"
              description="Drop'lar bir şubeye bağlı yayınlanır. Şubeni şu anki konumunla dakikalar içinde oluştur."
              actionLabel={canManage ? 'Şube Oluştur' : undefined}
              onAction={canManage ? goCreateBranch : undefined}
            />
          )
        }
        renderItem={({ item }) => (
          <BranchCard
            branch={item}
            onPress={() =>
              router.push({ pathname: '/(app)/business/branch/[branchId]', params: { branchId: item.id } })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={branchesQuery.isRefetching}
            onRefresh={() => branchesQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      />
    </Screen>
  );
}

function BranchCard({ branch, onPress }: { branch: Branch; onPress: () => void }) {
  const live = branch.activeDropCount > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${branch.name} şubesi`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardIcon}>
        <Ionicons name="storefront" size={22} color={colors.primary} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {branch.name}
        </Text>
        <Text style={styles.cardSubtitle}>Drop&apos;ları ve QR kodunu yönet</Text>
      </View>
      {live ? (
        <Badge label={`${branch.activeDropCount} YAYINDA`} tone="success" live />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
      )}
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
    marginBottom: spacing.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identityText: {
    flex: 1,
    gap: spacing.sm,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    minHeight: 48,
  },
  sectionTitle: {
    ...typography.heading,
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
  cardIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
