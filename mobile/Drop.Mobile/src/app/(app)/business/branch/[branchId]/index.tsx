import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { BusinessDropCard } from '@/features/businesses/components/BusinessDropCard';
import { ScheduleList } from '@/features/businesses/components/ScheduleList';
import { BusinessStatusNotice } from '@/features/businesses/components/BusinessStatusNotice';
import { useBranch } from '@/features/businesses/hooks/useBranch';
import { useBranchDrops } from '@/features/businesses/hooks/useBranchDrops';
import { useDropLifecycle } from '@/features/businesses/hooks/useDropLifecycle';
import { useUpdateDrop } from '@/features/businesses/hooks/useUpdateDrop';
import type { BusinessDrop } from '@/features/businesses/types/business';
import {
  Badge,
  Button,
  Header,
  IconButton,
  Notice,
  Screen,
  Skeleton,
  StateView,
  colors,
  haptics,
  gradients,
  radius,
  spacing,
  typography,
} from '@/ui';

const isScheduled = (drop: BusinessDrop) =>
  drop.status === 'Scheduled' && !!drop.startsAt && new Date(drop.startsAt).getTime() > Date.now();

// A scheduled drop whose start passed counts as live until the sweep flips it.
const isLive = (drop: BusinessDrop) =>
  (drop.status === 'Active' || drop.status === 'Scheduled') &&
  !isScheduled(drop) &&
  !!drop.endsAt &&
  new Date(drop.endsAt).getTime() > Date.now();

export default function BranchDashboardScreen() {
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  const branchQuery = useBranch(branchId);
  const dropsQuery = useBranchDrops(branchId);
  const lifecycle = useDropLifecycle(branchId);
  const updateDrop = useUpdateDrop(branchId);

  const addCapacity = (drop: BusinessDrop, step: number) => {
    haptics.press();
    updateDrop.mutate(
      {
        dropId: drop.id,
        request: {
          title: drop.title,
          description: drop.description,
          minimumSpend: drop.minimumSpend,
          capacity: drop.capacity + step,
        },
      },
      {
        onSuccess: () => haptics.success(),
        onError: () => {
          haptics.error();
          Alert.alert('Kapasite artırılamadı', 'Drop sona ermiş olabilir. Liste yenilendi.');
          void dropsQuery.refetch();
        },
      },
    );
  };

  const runLifecycle = (dropId: string, action: 'end' | 'cancel') => {
    haptics.press();
    lifecycle.mutate(
      { dropId, action },
      {
        onSuccess: () => haptics.success(),
        onError: () => {
          haptics.error();
          Alert.alert('İşlem tamamlanamadı', 'Drop zaten sona ermiş olabilir. Liste yenilendi.');
          void dropsQuery.refetch();
        },
      },
    );
  };

  const confirmEnd = (drop: BusinessDrop) =>
    Alert.alert(
      'Drop erken bitirilsin mi?',
      'Yeni müşteri yakalayamaz. Şu an rezervasyonu olan müşteriler süreleri içinde yine kullanabilir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Erken bitir', onPress: () => runLifecycle(drop.id, 'end') },
      ],
    );

  const confirmCancel = (drop: BusinessDrop) =>
    Alert.alert(
      isScheduled(drop) ? 'Planlanan Drop iptal edilsin mi?' : 'Drop iptal edilsin mi?',
      isScheduled(drop)
        ? 'Drop hiç yayına girmeyecek.'
        : drop.activeClaimCount > 0
          ? `${drop.activeClaimCount} müşterinin rezervasyonu da iptal olacak ve kullanamayacaklar.`
          : 'Drop yayından kaldırılacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'İptal et', style: 'destructive', onPress: () => runLifecycle(drop.id, 'cancel') },
      ],
    );

  if (branchQuery.isError) {
    return (
      <Screen>
        <Header onBack={() => router.back()} />
        <StateView
          icon="alert-circle"
          tone="danger"
          title="Şube yüklenemedi"
          description="Bu şubeyi görüntüleme yetkin olmayabilir ya da bağlantında sorun var."
          actionLabel="Tekrar dene"
          onAction={() => branchQuery.refetch()}
        />
      </Screen>
    );
  }

  const branch = branchQuery.data;
  const drops = dropsQuery.data ?? [];
  const scheduled = drops
    .filter(isScheduled)
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());
  const live = drops.filter(isLive);
  const past = drops.filter(drop => !isLive(drop) && !isScheduled(drop));

  const totals = live.reduce(
    (sum, drop) => ({
      active: sum.active + drop.activeClaimCount,
      redeemed: sum.redeemed + drop.redeemedCount,
    }),
    { active: 0, redeemed: 0 },
  );

  const sections = [
    ...(live.length ? [{ title: 'Yayında', data: live }] : []),
    ...(scheduled.length ? [{ title: 'Planlanan', data: scheduled }] : []),
    ...(past.length ? [{ title: 'Geçmiş', data: past }] : []),
  ];

  const header = (
    <View>
      <LinearGradient colors={gradients.night} style={styles.hero}>
        <View style={styles.orb} />
        {branch ? (
          <>
            <Text style={styles.business}>{branch.businessName}</Text>
            <Text style={styles.branch}>{branch.name}</Text>
          </>
        ) : (
          <Skeleton width="60%" height={30} />
        )}

        <View style={styles.stats}>
          <HeroStat label="Yayında" value={live.length} />
          <View style={styles.statDivider} />
          <HeroStat label="Rezervasyon" value={totals.active} />
          <View style={styles.statDivider} />
          <HeroStat label="Kullanıldı" value={totals.redeemed} />
        </View>
      </LinearGradient>

      {branch && branch.businessStatus !== 'Approved' && (
        <View style={styles.notice}>
          <BusinessStatusNotice status={branch.businessStatus} />
        </View>
      )}

      {branch?.isClosed && (
        <View style={styles.notice}>
          <Notice
            tone="warning"
            message="Bu şube kapalı. Drop yayınlamak için şube ayarlarından yeniden açabilirsin."
          />
        </View>
      )}

      {branch?.canManage ? (
        <View style={styles.actions}>
          <Button
            title="Drop Oluştur"
            icon="flash"
            disabled={!branch.canPublishDrops}
            style={styles.action}
            onPress={() =>
              router.push({ pathname: '/(app)/business/branch/[branchId]/create-drop', params: { branchId } })
            }
          />
          <Button
            title="Şube QR"
            icon="qr-code"
            variant="dark"
            style={styles.action}
            onPress={() => router.push({ pathname: '/(app)/business/branch/[branchId]/qr', params: { branchId } })}
          />
        </View>
      ) : (
        branch && (
          <View style={styles.readOnly}>
            {branch.canShowQr && (
              <Button
                title="Şube QR Kodunu Göster"
                icon="qr-code"
                onPress={() => router.push({ pathname: '/(app)/business/branch/[branchId]/qr', params: { branchId } })}
              />
            )}
            <Badge label="PERSONEL" tone="neutral" icon="person-outline" />
            <Text style={styles.readOnlyText}>
              Drop oluşturmak ve yönetmek için işletme sahibi veya yöneticisi olmalısın.
            </Text>
          </View>
        )
      )}

      {branch?.canManage && <ScheduleList branchId={branchId} />}
    </View>
  );

  return (
    <Screen edges={['top']}>
      <Header
        title={branch?.name}
        onBack={() => router.back()}
        right={
          branch?.canManage ? (
            <IconButton
              icon="create-outline"
              accessibilityLabel="Şubeyi düzenle"
              onPress={() => router.push({ pathname: '/(app)/business/branch/[branchId]/edit', params: { branchId } })}
            />
          ) : undefined
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <BusinessDropCard
            drop={item}
            canManage={branch?.canManage}
            busy={
              (lifecycle.isPending && lifecycle.variables?.dropId === item.id) ||
              (updateDrop.isPending && updateDrop.variables?.dropId === item.id)
            }
            onAddCapacity={step => addCapacity(item, step)}
            onEdit={() =>
              router.push({
                pathname: '/(app)/business/branch/[branchId]/create-drop',
                params: { branchId, dropId: item.id },
              })
            }
            onRepublish={!branch?.canPublishDrops ? undefined : () =>
              router.push({
                pathname: '/(app)/business/branch/[branchId]/create-drop',
                params: { branchId, fromDropId: item.id },
              })
            }
            onEnd={() => confirmEnd(item)}
            onCancel={() => confirmCancel(item)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>
            {section.title} · {section.data.length}
          </Text>
        )}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={
          dropsQuery.isLoading ? (
            <View style={styles.skeletons}>
              <Skeleton height={170} radius={radius.xl} />
            </View>
          ) : dropsQuery.isError ? (
            <StateView
              icon="cloud-offline"
              tone="danger"
              title="Drop'lar yüklenemedi"
              actionLabel="Tekrar dene"
              onAction={() => dropsQuery.refetch()}
            />
          ) : (
            <StateView
              icon="flash"
              title="Henüz Drop yok"
              description="İlk Drop'unu yayınla; yakındaki müşteriler anında görsün."
            />
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dropsQuery.isRefetching}
            onRefresh={() => {
              void dropsQuery.refetch();
              void branchQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      />
    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    overflow: 'hidden',
    padding: spacing.xl,
    borderRadius: radius.xl + 2,
  },
  orb: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  business: {
    ...typography.overline,
    color: colors.lime,
  },
  branch: {
    ...typography.display,
    marginTop: 4,
    color: colors.textOnDark,
  },
  stats: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  statValue: {
    color: colors.textOnDark,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 2,
    color: colors.textOnDarkMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  notice: {
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  action: {
    flex: 1,
  },
  readOnly: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  readOnlyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    ...typography.heading,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    color: colors.text,
  },
  skeletons: {
    marginTop: spacing.xxl,
  },
});
