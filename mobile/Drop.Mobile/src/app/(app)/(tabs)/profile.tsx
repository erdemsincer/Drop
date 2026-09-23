import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMyBusinesses } from '@/features/businesses/hooks/useMyBusinesses';
import { roleLabels } from '@/features/businesses/utils/businessLabels';
import { useMyClaims } from '@/features/claims/hooks/useMyClaims';
import { useMe } from '@/features/users/hooks/useMe';
import { useAuth } from '@/providers/AuthProvider';
import { Avatar, Skeleton, Screen, colors, gradients, radius, shadows, spacing, typography } from '@/ui';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const meQuery = useMe();
  const businessesQuery = useMyBusinesses();
  const claimsQuery = useMyClaims();

  const me = meQuery.data;
  const fullName = me ? `${me.firstName} ${me.lastName}` : '';
  const businesses = businessesQuery.data ?? [];
  const claims = claimsQuery.data ?? [];
  const redeemed = claims.filter(claim => claim.status === 'Redeemed').length;

  const confirmLogout = () =>
    Alert.alert('Çıkış yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.night} style={styles.hero}>
          <View style={styles.orb} />
          {me ? (
            <>
              <Avatar name={fullName} size={68} />
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.email}>{me.email}</Text>
            </>
          ) : (
            <>
              <Skeleton width={68} height={68} radius={22} />
              <Skeleton width="55%" height={24} style={styles.skeletonGap} />
            </>
          )}

          <View style={styles.stats}>
            <Stat value={claims.length} label="Yakalanan" />
            <View style={styles.statDivider} />
            <Stat value={redeemed} label="Kullanılan" />
          </View>
        </LinearGradient>

        {businesses.length > 0 && (
          <Section title="İşletme">
            {businesses.map(business => (
              <Row
                key={business.id}
                icon="storefront"
                title={business.name}
                subtitle={roleLabels[business.role]}
                onPress={() =>
                  router.push({ pathname: '/(app)/business/[businessId]', params: { businessId: business.id } })
                }
              />
            ))}
          </Section>
        )}

        <Section title="Hesap">
          <Row icon="ticket" title="Drop'larım" onPress={() => router.navigate('/(app)/(tabs)/claims')} />
          <Row icon="log-out" title="Çıkış yap" danger onPress={confirmLogout} />
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

type RowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  danger?: boolean;
  onPress: () => void;
};

function Row({ icon, title, subtitle, danger = false, onPress }: RowProps) {
  const tint = danger ? colors.danger : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && { color: colors.danger }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    overflow: 'hidden',
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: radius.xl + 4,
  },
  orb: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  name: {
    ...typography.title,
    marginTop: spacing.md,
    color: colors.textOnDark,
    textAlign: 'center',
  },
  email: {
    marginTop: 4,
    color: colors.textOnDarkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  skeletonGap: {
    marginTop: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  statValue: {
    color: colors.textOnDark,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 2,
    color: colors.textOnDarkMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    ...typography.overline,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    color: colors.textSubtle,
  },
  sectionCard: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  rowIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
  },
});
