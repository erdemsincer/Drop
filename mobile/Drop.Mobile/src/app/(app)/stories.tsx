import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiError } from '@/api/getApiError';
import { useCatchDrop } from '@/features/claims/hooks/useCatchDrop';
import { getClaimErrorMessage } from '@/features/claims/utils/getClaimErrorMessage';
import { DealPrice } from '@/features/drops/components/DealPrice';
import { FallingPrice } from '@/features/drops/components/FallingPrice';
import { MysteryBox } from '@/features/drops/components/MysteryBox';
import { useFallingPrice } from '@/features/drops/hooks/useFallingPrice';
import { useCountdown } from '@/features/drops/hooks/useCountdown';
import { useNearbyDrops } from '@/features/drops/hooks/useNearbyDrops';
import type { NearbyDrop } from '@/features/drops/types/drop';
import { categoryInfo, categoryOf } from '@/features/drops/utils/categories';
import { formatDistance } from '@/features/drops/utils/formatDistance';
import { dealOf } from '@/features/drops/utils/pricing';
import { useCurrentLocation } from '@/features/location/hooks/useCurrentLocation';
import { Avatar, IconButton, colors, gradients, haptics, radius, spacing } from '@/ui';
import { mediaUrl } from '@/utils/media';

/** Full-screen, swipe-up discovery of the drops nearby, like stories. */
export default function StoriesScreen() {
  const { start, radiusKm } = useLocalSearchParams<{ start?: string; radiusKm?: string }>();
  const { height } = useWindowDimensions();
  const location = useCurrentLocation().data;

  const nearby = useNearbyDrops({
    latitude: location?.latitude,
    longitude: location?.longitude,
    radiusKm: Number(radiusKm) || 5,
  });

  // Frozen on first load: a refetch reordering pages under your thumb would be disorienting.
  const [drops, setDrops] = useState<NearbyDrop[] | null>(null);
  if (drops === null && nearby.data) setDrops(nearby.data);

  const startIndex = Math.min(Number(start) || 0, Math.max(0, (drops?.length ?? 1) - 1));

  if (!drops) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.lime} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <FlatList
        data={drops}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        onMomentumScrollEnd={() => haptics.tap()}
        renderItem={({ item, index }) => (
          <Story drop={item} index={index} total={drops.length} height={height} showHint={index === startIndex} />
        )}
      />
    </View>
  );
}

type StoryProps = {
  drop: NearbyDrop;
  index: number;
  total: number;
  height: number;
  showHint: boolean;
};

function Story({ drop, index, total, height, showHint }: StoryProps) {
  const insets = useSafeAreaInsets();
  const remaining = useCountdown(drop.endsAt);
  const { catchDrop, mutation } = useCatchDrop();
  const category = categoryInfo[categoryOf(drop.category)];
  const deal = dealOf(drop);
  const falling = useFallingPrice(drop);
  const soldOut = drop.remainingCapacity <= 0;
  const locked = drop.isLocked === true;
  const unavailable = soldOut || remaining.isExpired || locked;

  const apiError = mutation.error ? getApiError(mutation.error) : null;
  const error = apiError
    ? getClaimErrorMessage(apiError.code, apiError.detail)
    : mutation.isError
      ? 'Sunucuya ulaşılamadı.'
      : null;

  return (
    <View style={{ height }}>
      {locked ? (
        <LinearGradient colors={gradients.night} style={[StyleSheet.absoluteFill, styles.center]}>
          <MysteryBox size={170} />
        </LinearGradient>
      ) : drop.photoId ? (
        <Image source={{ uri: mediaUrl(drop.photoId) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <LinearGradient colors={[category.tint, gradients.night[1]]} style={[StyleSheet.absoluteFill, styles.center]}>
          <Ionicons name={category.icon} size={220} color="rgba(255,255,255,0.12)" />
        </LinearGradient>
      )}
      <LinearGradient
        colors={['rgba(14,11,26,0.55)', 'rgba(14,11,26,0)', 'rgba(14,11,26,0.25)', 'rgba(14,11,26,0.92)']}
        locations={[0, 0.22, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.business}>
          <Avatar name={drop.businessName} size={40} />
          <View style={styles.businessText}>
            <Text style={styles.businessName} numberOfLines={1}>
              {drop.businessName}
            </Text>
            <Text style={styles.where} numberOfLines={1}>
              {formatDistance(drop.distanceMeters)} · {drop.branchName}
            </Text>
          </View>
        </View>
        <IconButton icon="close" tone="glass" accessibilityLabel="Kapat" onPress={() => router.back()} />
      </View>

      {/* Where you are in the stack, along the right edge. */}
      <View style={[styles.rail, { top: insets.top + 90 }]}>
        {Array.from({ length: Math.min(total, 12) }, (_, dot) => (
          <View key={dot} style={[styles.railDot, dot === Math.min(index, 11) && styles.railDotActive]} />
        ))}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={[styles.chip, { backgroundColor: category.tint }]}>
          <Ionicons name={category.icon} size={13} color="#FFFFFF" />
          <Text style={styles.chipText}>{category.label.toLocaleUpperCase('tr-TR')}</Text>
        </View>

        <Text style={styles.title}>{drop.title}</Text>
        {!!drop.description && (
          <Text style={styles.description} numberOfLines={3}>
            {drop.description}
          </Text>
        )}

        {falling ? (
          <View style={styles.deal}>
            <FallingPrice state={falling} original={drop.originalPrice} size="lg" inverted />
          </View>
        ) : (
          deal && (
            <View style={styles.deal}>
              <DealPrice deal={deal} size="lg" inverted />
            </View>
          )
        )}

        <View style={styles.meta}>
          <View style={styles.timer}>
            <Ionicons name="time" size={15} color={colors.ink} />
            <Text style={styles.timerText}>{remaining.isExpired ? 'Bitti' : remaining.label}</Text>
          </View>
          <Text style={styles.left}>{soldOut ? 'Tükendi' : `${drop.remainingCapacity} / ${drop.capacity} yer kaldı`}</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/(app)/drop/[id]', params: { id: drop.id } })}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>Detaylar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: unavailable && !locked }}
            disabled={(unavailable && !locked) || mutation.isPending}
            // A sealed box opens on the detail screen, which follows you there.
            onPress={() =>
              locked ? router.push({ pathname: '/(app)/drop/[id]', params: { id: drop.id } }) : catchDrop(drop)
            }
            style={({ pressed }) => [
              styles.primary,
              unavailable && !locked && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <>
                <Ionicons name={locked ? 'gift' : unavailable ? 'lock-closed' : 'flash'} size={18} color={colors.ink} />
                <Text style={styles.primaryText}>
                  {locked ? 'Yaklaş ve aç' : soldOut ? 'Tükendi' : remaining.isExpired ? 'Bitti' : 'Yakala'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {showHint && index < total - 1 && <SwipeHint />}
      </View>
    </View>
  );
}

function SwipeHint() {
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) }),
      ),
      -1,
    );
  }, [bob]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * bob.value }] }));

  return (
    <Animated.View entering={FadeIn.delay(600)} style={[styles.hint, style]}>
      <Ionicons name="chevron-up" size={18} color="rgba(255,255,255,0.8)" />
      <Text style={styles.hintText}>Sonraki Drop için kaydır</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: gradients.night[1],
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  business: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  businessText: {
    flex: 1,
  },
  businessName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  where: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  rail: {
    position: 'absolute',
    right: 10,
    gap: 6,
  },
  railDot: {
    width: 4,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  railDotActive: {
    height: 26,
    backgroundColor: colors.lime,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    marginTop: spacing.md,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 40,
  },
  description: {
    marginTop: spacing.sm,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 21,
  },
  deal: {
    marginTop: spacing.lg,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
  },
  timerText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  left: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    marginTop: spacing.md,
    color: '#FF8A8A',
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  secondary: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.md + 2,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  primary: {
    flex: 2,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime,
    borderRadius: radius.md + 2,
  },
  primaryDisabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  hint: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  hintText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
  },
});
