import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BadgeGrid } from '@/features/badges/components/BadgeGrid';
import { NewBadgeModal } from '@/features/badges/components/NewBadgeModal';
import { useBadges } from '@/features/badges/hooks/useBadges';
import { useMyBusinesses } from '@/features/businesses/hooks/useMyBusinesses';
import { roleLabels } from '@/features/businesses/utils/businessLabels';
import { useFollows, useToggleFollow } from '@/features/follows/hooks/useFollows';
import { useMe } from '@/features/users/hooks/useMe';
import { useMyStats } from '@/features/users/hooks/useMyStats';
import { useAuth } from '@/providers/AuthProvider';
import { formatCurrency } from '@/utils/formatCurrency';
import { openLegal } from '@/utils/openLegal';
import {
  Avatar,
  DropLogo,
  ProgressBar,
  Skeleton,
  Screen,
  colors,
  gradients,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Redeemed drops earn a title; the bar in the hero shows the way to the next one.
const tiers: { min: number; title: string; icon: IconName }[] = [
  { min: 0, title: 'Yeni avcı', icon: 'leaf' },
  { min: 1, title: 'Fırsat avcısı', icon: 'flash' },
  { min: 5, title: 'Usta avcı', icon: 'rocket' },
  { min: 15, title: 'Efsane', icon: 'trophy' },
];

const tierFor = (redeemed: number) => {
  let index = 0;
  while (index + 1 < tiers.length && redeemed >= tiers[index + 1].min) index++;
  const next = tiers[index + 1];
  const current = tiers[index];

  return {
    ...current,
    next,
    progress: next ? (redeemed - current.min) / (next.min - current.min) : 1,
  };
};

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const meQuery = useMe();
  const businessesQuery = useMyBusinesses();
  const stats = useMyStats().data;
  const follows = useFollows().data ?? [];
  const toggleFollow = useToggleFollow();

  const me = meQuery.data;
  const badges = useBadges(me?.id);
  const earnedCount = badges.badges.filter(badge => badge.earned).length;
  const fullName = me ? `${me.firstName} ${me.lastName}` : '';
  const businesses = businessesQuery.data ?? [];
  const redeemed = stats?.redeemed ?? 0;
  const tier = tierFor(redeemed);

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
          <View style={styles.orbLime} />
          {me ? (
            <>
              <View style={styles.avatarRing}>
                <Avatar name={fullName} size={72} />
                {me.emailVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={12} color={colors.ink} />
                  </View>
                )}
              </View>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.email}>{me.email}</Text>
            </>
          ) : (
            <>
              <Skeleton width={68} height={68} radius={22} />
              <Skeleton width="55%" height={24} style={styles.skeletonGap} />
            </>
          )}

          {stats && (
            <View style={styles.savings}>
              <Ionicons name="wallet" size={18} color={colors.ink} />
              <Text style={styles.savingsText}>
                {stats.saved > 0 ? (
                  <>
                    Drop ile <Text style={styles.savingsValue}>{formatCurrency(stats.saved)}</Text> tasarruf ettin
                  </>
                ) : (
                  'İlk tasarrufun bir Drop uzağında'
                )}
              </Text>
            </View>
          )}

          <View style={styles.tier}>
            <View style={styles.tierHead}>
              <View style={styles.tierIcon}>
                <Ionicons name={tier.icon} size={14} color={colors.ink} />
              </View>
              <Text style={styles.tierTitle}>{tier.title}</Text>
              <Text style={styles.tierNext}>
                {tier.next ? `${tier.next.min - redeemed} Drop sonra: ${tier.next.title}` : 'Zirvedesin'}
              </Text>
            </View>
            <ProgressBar
              value={tier.progress}
              color={colors.lime}
              trackColor="rgba(255,255,255,0.12)"
              height={6}
              style={styles.tierBar}
            />
          </View>

          <View style={styles.stats}>
            <Stat value={stats?.claimed ?? 0} label="Yakalanan" />
            <View style={styles.statDivider} />
            <Stat value={redeemed} label="Kullanılan" />
            <View style={styles.statDivider} />
            <Stat value={follows.length} label="Takip" />
          </View>
        </LinearGradient>

        {me && !me.emailVerified && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/account/verify-email')}
            style={({ pressed }) => [styles.verify, pressed && styles.rowPressed]}
          >
            <View style={styles.verifyIcon}>
              <Ionicons name="mail-unread" size={20} color={colors.warning} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>E-postanı doğrula</Text>
              <Text style={styles.rowSubtitle}>{me.email} adresine gelen kodu gir</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </Pressable>
        )}

        {badges.badges.length > 0 && (
          <Section title={`Rozetler · ${earnedCount}/${badges.badges.length}`}>
            <BadgeGrid badges={badges.badges} />
          </Section>
        )}

        {businesses.length > 0 && (
          <Section title="İşletme">
            {businesses.map(business => (
              <Row
                key={business.id}
                icon="storefront"
                tint="#12A36A"
                title={business.name}
                subtitle={roleLabels[business.role]}
                onPress={() =>
                  router.push({ pathname: '/(app)/business/[businessId]', params: { businessId: business.id } })
                }
              />
            ))}
          </Section>
        )}

        {me?.isAdmin && (
          <Section title="Yönetim">
            <Row
              icon="shield-checkmark"
              tint="#2D8CDB"
              title="İşletme onayları"
              subtitle="Başvuruları incele, onayla veya reddet"
              onPress={() => router.push('/(app)/admin')}
            />
          </Section>
        )}

        {follows.length > 0 && (
          <Section title="Takip ettiklerim">
            {follows.map(follow => (
              <Row
                key={follow.businessId}
                icon="notifications"
                tint="#E8900C"
                title={follow.name}
                subtitle="Yeni Drop'larında bildirim alırsın · Bırakmak için dokun"
                onPress={() =>
                  Alert.alert(`${follow.name} takibi bırakılsın mı?`, 'Bu işletmenin yeni Drop bildirimlerini almayacaksın.', [
                    { text: 'Vazgeç', style: 'cancel' },
                    {
                      text: 'Takibi bırak',
                      style: 'destructive',
                      onPress: () =>
                        toggleFollow.mutate({ businessId: follow.businessId, name: follow.name, follow: false }),
                    },
                  ])
                }
              />
            ))}
          </Section>
        )}

        <Section title="Hesap">
          <Row icon="person-circle" title="Profili düzenle" onPress={() => router.push('/(app)/account/edit')} />
          <Row
            icon="key"
            tint="#E8900C"
            title={me?.hasPassword === false ? 'Şifre belirle' : 'Şifreyi değiştir'}
            onPress={() => router.push('/(app)/account/password')}
          />
          <Row
            icon="ticket"
            tint="#12A36A"
            title="Drop'larım"
            onPress={() => router.navigate('/(app)/(tabs)/claims')}
          />
          <Row
            icon="sparkles"
            tint="#E0479E"
            title="Drop'u tanı"
            subtitle="Uygulama tanıtımını tekrar izle"
            onPress={() => router.push({ pathname: '/onboarding', params: { replay: '1' } })}
          />
          <Row icon="log-out" title="Çıkış yap" danger onPress={confirmLogout} />
        </Section>

        <Section title="Gizlilik">
          <Row
            icon="shield-checkmark"
            tint="#2D8CDB"
            title="Gizlilik ve KVKK Metni"
            onPress={() => void openLegal('privacy')}
          />
          <Row
            icon="document-text"
            tint="#686779"
            title="Kullanım Koşulları"
            onPress={() => void openLegal('terms')}
          />
          <Row icon="trash" title="Hesabımı sil" danger onPress={() => router.push('/(app)/account/delete')} />
        </Section>

        <View style={styles.footer}>
          <DropLogo size={22} color={colors.textSubtle} />
          <Text style={styles.footerText}>drop · v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </ScrollView>

      <NewBadgeModal badges={badges.fresh} onClose={() => void badges.markSeen()} />
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
    <Animated.View entering={FadeInDown.duration(320)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </Animated.View>
  );
}

type RowProps = {
  icon: IconName;
  /** Each kind of row gets its own colour, like a settings app. */
  tint?: string;
  title: string;
  subtitle?: string;
  danger?: boolean;
  onPress: () => void;
};

function Row({ icon, tint: rowTint = colors.primary, title, subtitle, danger = false, onPress }: RowProps) {
  const tint = danger ? colors.danger : rowTint;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={17} color="#FFFFFF" />
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
  verify: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
  },
  verifyIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
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
  orbLime: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.lime,
    opacity: 0.12,
  },
  avatarRing: {
    padding: 4,
    borderWidth: 2,
    borderColor: colors.lime,
    borderRadius: 30,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
    borderWidth: 3,
    borderColor: gradients.night[1],
    borderRadius: 12,
  },
  savings: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.lime,
    borderRadius: radius.lg,
  },
  savingsText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  savingsValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  tier: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
  tierHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tierIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
    borderRadius: 11,
  },
  tierTitle: {
    color: colors.textOnDark,
    fontSize: 14,
    fontWeight: '900',
  },
  tierNext: {
    flex: 1,
    color: colors.textOnDarkMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  tierBar: {
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xxxl,
  },
  footerText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
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
    marginTop: spacing.lg,
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
