import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DealPrice } from '@/features/drops/components/DealPrice';
import { RatingPill } from '@/features/drops/components/RatingPill';
import { useCountdown } from '@/features/drops/hooks/useCountdown';
import { useDropReminders } from '@/features/drops/hooks/useDropReminders';
import { categoryInfo, categoryOf } from '@/features/drops/utils/categories';
import { formatStartsAt } from '@/features/drops/utils/formatStartsAt';
import { dealOf } from '@/features/drops/utils/pricing';
import { FollowButton } from '@/features/follows/components/FollowButton';
import type { Place, PlaceDrop } from '@/features/places/api/placeApi';
import { usePlace } from '@/features/places/hooks/usePlace';
import {
  Avatar,
  IconButton,
  Screen,
  StateView,
  colors,
  gradients,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';
import { mediaUrl } from '@/utils/media';
import { openDirections } from '@/utils/openDirections';

export default function PlaceScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const placeQuery = usePlace(businessId);

  if (placeQuery.isLoading) {
    return (
      <Screen>
        <StateView loading title="İşletme yükleniyor" />
      </Screen>
    );
  }

  if (placeQuery.isError || !placeQuery.data) {
    return (
      <Screen>
        <StateView
          icon="storefront"
          tone="danger"
          title="İşletme bulunamadı"
          description="Bu işletme artık Drop'ta olmayabilir."
          actionLabel="Geri dön"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <PlaceContent place={placeQuery.data} refreshing={placeQuery.isRefetching} onRefresh={() => placeQuery.refetch()} />
  );
}

function PlaceContent({ place, refreshing, onRefresh }: { place: Place; refreshing: boolean; onRefresh: () => void }) {
  const insets = useSafeAreaInsets();
  const openDrop = (id: string) => router.push({ pathname: '/(app)/drop/[id]', params: { id } });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textOnDark} />}
      >
        <LinearGradient colors={gradients.night} style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.orb} />
          <IconButton icon="chevron-back" tone="glass" accessibilityLabel="Geri dön" onPress={() => router.back()} />

          <View style={styles.identity}>
            <Avatar name={place.name} size={76} />
            <Text style={styles.name}>{place.name}</Text>
            <RatingPill rating={place.rating} count={place.ratingCount} inverted />
            <FollowButton businessId={place.id} businessName={place.name} />
          </View>

          <View style={styles.stats}>
            <Stat value={place.followerCount} label="Takipçi" />
            <View style={styles.divider} />
            <Stat value={place.redeemedCount} label="Kullanılan Drop" />
            <View style={styles.divider} />
            <Stat value={place.branches.length} label="Şube" />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Section title="Şu an aktif" icon="flash" count={place.liveDrops.length}>
            {place.liveDrops.length === 0 ? (
              <Text style={styles.empty}>
                Şu an aktif Drop yok. Takip edersen yeni bir Drop açtıklarında sana haber veririz.
              </Text>
            ) : (
              place.liveDrops.map(drop => <LiveRow key={drop.id} drop={drop} onPress={() => openDrop(drop.id)} />)
            )}
          </Section>

          {place.upcomingDrops.length > 0 && (
            <Section title="Yakında" icon="hourglass" count={place.upcomingDrops.length}>
              {place.upcomingDrops.map(drop => (
                <UpcomingRow key={drop.id} drop={drop} businessName={place.name} onPress={() => openDrop(drop.id)} />
              ))}
            </Section>
          )}

          <Section title="Şubeler" icon="location" count={place.branches.length}>
            {place.branches.map(branch => (
              <View key={branch.id} style={styles.branch}>
                <View style={styles.branchIcon}>
                  <Ionicons name="storefront" size={17} color={colors.primary} />
                </View>
                <Text style={styles.branchName} numberOfLines={1}>
                  {branch.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${branch.name} yol tarifi`}
                  onPress={() => openDirections(branch.latitude, branch.longitude, `${place.name} ${branch.name}`)}
                  style={({ pressed }) => [styles.route, pressed && styles.pressed]}
                >
                  <Ionicons name="navigate" size={13} color={colors.lime} />
                  <Text style={styles.routeText}>Yol tarifi</Text>
                </Pressable>
              </View>
            ))}
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: 'flash' | 'hourglass' | 'location';
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(320)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={16} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {count > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      <View style={styles.card}>{children}</View>
    </Animated.View>
  );
}

function Thumb({ drop }: { drop: PlaceDrop }) {
  const category = categoryInfo[categoryOf(drop.category)];

  return (
    <View style={[styles.thumb, { backgroundColor: category.tint }]}>
      {drop.photoId ? (
        <Image source={{ uri: mediaUrl(drop.photoId) }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Ionicons name={category.icon} size={22} color="#FFFFFF" />
      )}
    </View>
  );
}

function LiveRow({ drop, onPress }: { drop: PlaceDrop; onPress: () => void }) {
  const remaining = useCountdown(drop.endsAt);
  const deal = dealOf(drop);
  const soldOut = drop.remainingCapacity <= 0;

  if (remaining.isExpired) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={drop.title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Thumb drop={drop} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {drop.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {drop.branchName} · {soldOut ? 'Tükendi' : `${drop.remainingCapacity} yer`} · {remaining.label}
        </Text>
        {deal && (
          <View style={styles.rowDeal}>
            <DealPrice deal={deal} />
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

function UpcomingRow({ drop, businessName, onPress }: { drop: PlaceDrop; businessName: string; onPress: () => void }) {
  const reminders = useDropReminders();
  const on = reminders.isSet(drop.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={drop.title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Thumb drop={drop} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {drop.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {formatStartsAt(drop.startsAt)} · {drop.branchName}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={on ? 'Hatırlatmayı kapat' : 'Başlayınca hatırlat'}
        hitSlop={8}
        onPress={() => reminders.toggle({ id: drop.id, title: drop.title, businessName, startsAt: drop.startsAt })}
        style={[styles.bell, on && styles.bellOn]}
      >
        <Ionicons name={on ? 'notifications' : 'notifications-outline'} size={17} color={on ? colors.ink : colors.primary} />
      </Pressable>
    </Pressable>
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
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  orb: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  identity: {
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  name: {
    ...typography.title,
    marginTop: spacing.sm,
    color: colors.textOnDark,
    textAlign: 'center',
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
  statValue: {
    color: colors.textOnDark,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 2,
    color: colors.textOnDarkMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  body: {
    paddingHorizontal: spacing.xl,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  countPill: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
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
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  empty: {
    padding: spacing.lg,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  thumb: {
    width: 56,
    height: 56,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
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
    fontVariant: ['tabular-nums'],
  },
  rowDeal: {
    marginTop: 4,
  },
  bell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
  },
  bellOn: {
    backgroundColor: colors.lime,
  },
  branch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  branchIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  branchName: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
  },
  routeText: {
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
