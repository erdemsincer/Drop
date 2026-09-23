import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, haptics, radius, spacing } from '@/ui';

export function BusinessSignupLink() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="İşletmeni kaydet"
      onPress={() => {
        haptics.tap();
        router.push('/(auth)/business-register');
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name="storefront" size={18} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>İşletme sahibi misin?</Text>
        <Text style={styles.subtitle}>İşletmeni kaydet, Drop yayınlamaya başla</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  icon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  text: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
