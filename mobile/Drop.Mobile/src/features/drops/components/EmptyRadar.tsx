import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button, DropLogo, colors, spacing, typography } from '@/ui';

type Props = {
  radiusKm: number;
  onWiden?: () => void;
  onAddBusiness: () => void;
};

const RING_COUNT = 3;
const RING_SIZE = 220;
const RING_MS = 2400;

/** Nothing nearby yet: a radar that keeps "scanning", and two ways forward. */
export function EmptyRadar({ radiusKm, onWiden, onAddBusiness }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.root}>
      <View style={styles.radar}>
        {Array.from({ length: RING_COUNT }, (_, index) => (
          <Ring key={index} delay={(RING_MS / RING_COUNT) * index} />
        ))}
        <View style={styles.core}>
          <DropLogo size={44} />
        </View>
      </View>

      <Text style={styles.title}>Buralar şimdilik sakin</Text>
      <Text style={styles.description}>
        {radiusKm} km çevrende şu an aktif Drop yok. Yeni fırsatlar her an düşebilir; takip ettiğin işletmeler Drop
        açınca sana haber veririz.
      </Text>

      <View style={styles.actions}>
        {onWiden && <Button title="Mesafeyi artır" icon="expand" size="md" onPress={onWiden} />}
        <Button title="İşletmen mi var? Drop aç" icon="storefront" variant="ghost" size="md" onPress={onAddBusiness} />
      </View>
    </Animated.View>
  );
}

function Ring({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: RING_MS, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - progress.value),
    transform: [{ scale: 0.3 + progress.value * 0.7 }],
  }));

  return <Animated.View style={[styles.ring, style]} />;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  radar: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: RING_SIZE / 2,
  },
  core: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    borderRadius: 42,
  },
  title: {
    ...typography.title,
    marginTop: spacing.lg,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
