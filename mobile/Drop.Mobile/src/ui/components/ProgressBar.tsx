import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '../theme';

type Props = {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
  value,
  color = colors.primary,
  trackColor = colors.surfaceMuted,
  height = 6,
  style,
}: Props) {
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.pill,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
