import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, gradients } from '../theme';
import { DropLogo } from './DropLogo';

type Props = {
  size?: number;
  wordmark?: boolean;
  /** `light` puts the wordmark on dark backgrounds, `dark` on light ones. */
  tone?: 'light' | 'dark';
};

/** The Drop logo: the lime pin on the brand gradient tile, optionally with the wordmark. */
export function BrandMark({ size = 38, wordmark = true, tone = 'light' }: Props) {
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.mark, { width: size, height: size, borderRadius: size * 0.3 }]}
      >
        <DropLogo size={size * 0.68} boltColor={gradients.primary[1]} />
      </LinearGradient>
      {wordmark && (
        <Text style={[styles.wordmark, { fontSize: size * 0.66, color: tone === 'light' ? colors.textOnDark : colors.text }]}>
          drop
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontWeight: '900',
    letterSpacing: -1,
  },
});
