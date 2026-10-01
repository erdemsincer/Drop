import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Confetti, colors, gradients, haptics } from '@/ui';

import { MysteryBox } from './MysteryBox';

/** The moment a mystery drop opens: the box swells and bursts into confetti, then gets out of the way. */
export function UnlockReveal({ onDone }: { onDone: () => void }) {
  const grow = useSharedValue(0);

  useEffect(() => {
    haptics.success();
    grow.value = withSequence(
      withTiming(0.15, { duration: 250 }),
      withTiming(1, { duration: 450, easing: Easing.in(Easing.back(2)) }),
    );
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [grow, onDone]);

  const boxStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, grow.value - 0.6) / 0.4,
    transform: [{ scale: 1 + grow.value * 1.4 }, { rotate: `${grow.value * 25}deg` }],
  }));

  return (
    <Animated.View exiting={FadeOut.duration(350)} style={[StyleSheet.absoluteFill, styles.root]}>
      <Animated.View style={boxStyle}>
        <MysteryBox size={150} eager />
      </Animated.View>
      <Animated.Text style={styles.text}>Kutu açıldı! 🎉</Animated.Text>
      <Confetti burstKey={1} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: gradients.night[1],
  },
  text: {
    position: 'absolute',
    bottom: '22%',
    color: colors.lime,
    fontSize: 26,
    fontWeight: '900',
  },
});
