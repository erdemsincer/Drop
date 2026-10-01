import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { colors } from '../theme';

const PALETTE = [colors.lime, '#8466FF', '#FF5C8A', '#FFB020', '#2BD48A', '#FFFFFF'];
const PIECES = 36;

// Deterministic "randomness" so a re-render never reshuffles pieces mid-flight.
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

type Props = {
  /** Change it to fire another burst. */
  burstKey: number;
};

/** A one-shot confetti burst from the top of the screen. Purely decorative: it never takes touches. */
export function Confetti({ burstKey }: Props) {
  const { width, height } = useWindowDimensions();

  if (burstKey === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: PIECES }, (_, index) => (
        <Piece
          key={`${burstKey}-${index}`}
          startX={width / 2 + (noise(index + burstKey) - 0.5) * 80}
          driftX={(noise(index * 3 + burstKey) - 0.5) * width * 1.2}
          fall={height * (0.55 + noise(index * 7) * 0.4)}
          spin={(noise(index * 5) - 0.5) * 1080}
          delay={noise(index * 11) * 180}
          color={PALETTE[index % PALETTE.length]}
          wide={index % 3 === 0}
        />
      ))}
    </View>
  );
}

type PieceProps = {
  startX: number;
  driftX: number;
  fall: number;
  spin: number;
  delay: number;
  color: string;
  wide: boolean;
};

// Only numbers cross into the worklet; capturing objects there crashed Expo Go before.
function Piece({ startX, driftX, fall, spin, delay, color, wide }: PieceProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }));
  }, [delay, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t < 0.85 ? 1 : (1 - t) / 0.15,
      transform: [
        { translateX: startX + driftX * t },
        // Up first, then down: a burst rather than a drizzle.
        { translateY: -40 + fall * t * t - 160 * t * (1 - t) },
        { rotate: `${spin * t}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.piece, { backgroundColor: color, width: wide ? 12 : 7, height: wide ? 6 : 11 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 2,
  },
});
