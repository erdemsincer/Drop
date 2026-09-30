import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, gradients } from '../theme';

type Props = {
  size?: number;
  wordmark?: boolean;
};

/** The Drop logo: a lime bolt on the brand gradient, optionally with the wordmark. */
export function BrandMark({ size = 38, wordmark = true }: Props) {
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.mark, { width: size, height: size, borderRadius: size * 0.32 }]}
      >
        <Ionicons name="flash" size={size * 0.53} color={colors.lime} />
      </LinearGradient>
      {wordmark && <Text style={[styles.wordmark, { fontSize: size * 0.63 }]}>drop</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    color: colors.textOnDark,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});
