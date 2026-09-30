import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { type ComponentProps, type PropsWithChildren, type ReactNode, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, PulseDot, colors, gradients, radius, shadows, spacing, typography } from '@/ui';

type Props = PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

export function AuthShell({ eyebrow, title, subtitle, footer, children }: Props) {
  const insets = useSafeAreaInsets();
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift]);

  const orbOne = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [0, -30]) },
      { translateY: interpolate(drift.value, [0, 1], [0, 24]) },
      { scale: interpolate(drift.value, [0, 1], [1, 1.12]) },
    ],
  }));

  const orbTwo = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [0, 40]) },
      { translateY: interpolate(drift.value, [0, 1], [0, -16]) },
    ],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
        >
          <LinearGradient colors={gradients.night} style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
            <Animated.View style={[styles.orbOne, orbOne]} />
            <Animated.View style={[styles.orbTwo, orbTwo]} />
            <DotGrid />

            <View style={styles.brandRow}>
              <BrandMark />
              <View style={styles.livePill}>
                <PulseDot color={colors.lime} size={7} />
                <Text style={styles.liveText}>Anlık fırsatlar</Text>
              </View>
            </View>

            <Animated.Text entering={FadeInDown.delay(80).duration(420)} style={styles.eyebrow}>
              {eyebrow}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(160).duration(420)} style={styles.title}>
              {title}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(240).duration(420)} style={styles.subtitle}>
              {subtitle}
            </Animated.Text>

            <Animated.View entering={FadeInDown.delay(320).duration(420)}>
              <DealTicker />
            </Animated.View>
          </LinearGradient>

          <Animated.View entering={FadeInUp.delay(120).springify().damping(18)} style={styles.sheet}>
            {children}
          </Animated.View>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ------------------------------ decorations ------------------------------ */

const GRID_COLUMNS = 7;
const GRID_ROWS = 5;

function DotGrid() {
  return (
    <View pointerEvents="none" style={styles.grid}>
      {Array.from({ length: GRID_ROWS }, (_, row) => (
        <View key={row} style={styles.gridRow}>
          {Array.from({ length: GRID_COLUMNS }, (_, column) => (
            <View key={column} style={[styles.gridDot, { opacity: 0.05 + ((row + column) % 4) * 0.04 }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

type Deal = { icon: ComponentProps<typeof Ionicons>['name']; label: string };

// Illustrative categories, not live data: it hints at what the app is for.
const deals: Deal[] = [
  { icon: 'cafe', label: 'Kahve %40' },
  { icon: 'pizza', label: 'Pizza 1+1' },
  { icon: 'ice-cream', label: 'Tatlı %25' },
  { icon: 'restaurant', label: 'Menü %30' },
  { icon: 'cut', label: 'Kuaför %20' },
  { icon: 'beer', label: 'Happy hour' },
];

/** An endless, slow marquee of deal chips. */
function DealTicker() {
  const [rowWidth, setRowWidth] = useState(0);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (!rowWidth) return;
    offset.value = 0;
    offset.value = withRepeat(withTiming(-rowWidth, { duration: rowWidth * 28, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(offset);
  }, [offset, rowWidth]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  // Two identical rows back to back, so shifting by one row width loops seamlessly.
  return (
    <View style={styles.ticker} pointerEvents="none">
      <Animated.View style={[styles.tickerTrack, style]}>
        <View style={styles.tickerRow} onLayout={event => setRowWidth(event.nativeEvent.layout.width)}>
          {deals.map(deal => (
            <DealChip key={deal.label} {...deal} />
          ))}
        </View>
        <View style={styles.tickerRow}>
          {deals.map(deal => (
            <DealChip key={deal.label} {...deal} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function DealChip({ icon, label }: Deal) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={13} color={colors.lime} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

/* --------------------------------- styles -------------------------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    overflow: 'hidden',
    paddingBottom: 72,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  orbOne: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  orbTwo: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.lime,
    opacity: 0.1,
  },
  grid: {
    position: 'absolute',
    top: 70,
    right: 18,
    gap: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
  },
  gridDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
  },
  liveText: {
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: '800',
  },
  eyebrow: {
    ...typography.overline,
    paddingHorizontal: spacing.xxl,
    color: colors.lime,
  },
  title: {
    ...typography.display,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xxl,
    color: colors.textOnDark,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xxl,
    color: colors.textOnDarkMuted,
  },
  ticker: {
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  tickerTrack: {
    flexDirection: 'row',
  },
  tickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill,
  },
  chipText: {
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: '700',
  },
  sheet: {
    gap: spacing.lg,
    marginTop: -44,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.raised,
  },
});
