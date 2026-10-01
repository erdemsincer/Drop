import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/ui';

type Props = {
  size?: number;
  /** Shake harder as the customer gets close. */
  eager?: boolean;
};

/** The sealed gift box of a mystery drop: it wobbles now and then and glows, begging to be opened. */
export function MysteryBox({ size = 64, eager = false }: Props) {
  const wobble = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    const swing = eager ? 14 : 8;
    const pause = eager ? 500 : 1800;

    wobble.value = withRepeat(
      withSequence(
        withTiming(-swing, { duration: 90 }),
        withTiming(swing, { duration: 120 }),
        withTiming(-swing / 2, { duration: 100 }),
        withTiming(0, { duration: 90 }),
        withDelay(pause, withTiming(0, { duration: 1 })),
      ),
      -1,
    );
    glow.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [eager, glow, wobble]);

  const boxStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + glow.value * 0.35,
    transform: [{ scale: 1 + glow.value * 0.18 }],
  }));

  const radius = size * 0.3;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.glow, { borderRadius: radius }, glowStyle]} />
      <Animated.View style={[StyleSheet.absoluteFill, boxStyle]}>
        <LinearGradient
          colors={['#8466FF', '#4B27E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.box, { borderRadius: radius }]}
        >
          {/* Ribbon */}
          <View style={[styles.ribbonV, { width: size * 0.16 }]} />
          <View style={[styles.ribbonH, { height: size * 0.16 }]} />
          <View style={[styles.badge, { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }]}>
            <Ionicons name="help" size={size * 0.34} color={colors.lime} />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    backgroundColor: colors.lime,
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ribbonV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(200,245,60,0.55)',
  },
  ribbonH: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(200,245,60,0.55)',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B1340',
  },
});
