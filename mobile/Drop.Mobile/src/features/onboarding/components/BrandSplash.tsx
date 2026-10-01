import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { DropLogo, colors, gradients } from '@/ui';

// Sized to sit exactly where the native splash image (imageWidth 140) left the pin.
const LOGO_SIZE = 73;

/** Shown while the session and first-run flag load; picks up where the native splash ends. */
export function BrandSplash() {
  const bounce = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    // The pin hops like a marker dropping onto a map, and a ring ripples out where it lands.
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 420, easing: Easing.bounce }),
      ),
      -1,
    );
    ring.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) }), -1);
  }, [bounce, ring]);

  const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bounce.value * 14 }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - ring.value),
    transform: [{ scaleX: 0.4 + ring.value * 1.6 }, { scaleY: 0.4 + ring.value * 1.6 }],
  }));

  return (
    <LinearGradient colors={gradients.night} style={styles.root}>
      <StatusBar style="light" />
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={pinStyle}>
        <DropLogo size={LOGO_SIZE} />
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(250).duration(400)} style={styles.wordmark}>
        drop
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 70,
    height: 22,
    marginTop: LOGO_SIZE - 4,
    borderWidth: 2,
    borderColor: colors.lime,
    borderRadius: 35,
  },
  wordmark: {
    position: 'absolute',
    bottom: 80,
    color: colors.textOnDark,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
});
