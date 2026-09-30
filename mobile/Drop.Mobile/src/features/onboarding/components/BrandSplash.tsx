import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { BrandMark, gradients } from '@/ui';

/** Shown while the session and first-run flag load; matches the native splash colour. */
export function BrandSplash() {
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [breathe]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breathe.value * 0.06 }] }));

  return (
    <LinearGradient colors={gradients.night} style={styles.root}>
      <StatusBar style="light" />
      <Animated.View style={style}>
        <BrandMark size={56} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
