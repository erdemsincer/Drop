import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type Props = {
  color: string;
  size?: number;
};

/** A dot with an expanding ring, for "live" indicators. */
export function PulseDot({ color, size = 8 }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
  }, [progress]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 1.6 }],
  }));

  const dot = { width: size, height: size, borderRadius: size / 2, backgroundColor: color };

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, dot, ring]} />
      <View style={dot} />
    </View>
  );
}
