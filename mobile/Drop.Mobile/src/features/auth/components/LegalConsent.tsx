import { StyleSheet, Text } from 'react-native';

import { colors } from '@/ui';
import { openLegal } from '@/utils/openLegal';

/** The line under sign-up buttons: continuing means accepting the terms and the privacy notice. */
export function LegalConsent({ action = 'Hesap oluşturarak' }: { action?: string }) {
  return (
    <Text style={styles.text}>
      {action}{' '}
      <Text accessibilityRole="link" style={styles.link} onPress={() => void openLegal('terms')}>
        Kullanım Koşulları
      </Text>
      &apos;nı kabul etmiş olursun. Verilerinin nasıl işlendiğini{' '}
      <Text accessibilityRole="link" style={styles.link} onPress={() => void openLegal('privacy')}>
        Gizlilik ve KVKK Metni
      </Text>
      &apos;nde bulabilirsin.
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
});
