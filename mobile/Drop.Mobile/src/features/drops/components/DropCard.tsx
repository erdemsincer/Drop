import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formatCurrency } from '@/utils/formatCurrency';
import { useCountdown } from '../hooks/useCountdown';
import type { NearbyDrop } from '../types/drop';
import { formatDistance } from '../utils/formatDistance';

type Props = {
  drop: NearbyDrop;
  onPress: () => void;
};

export function DropCard({
  drop,
  onPress,
}: Props) {
  const remaining = useCountdown(drop.endsAt);

  if (remaining.isExpired) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${drop.businessName} fırsatı: ${drop.title}`}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.accentLine} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.businessSection}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>
                {drop.businessName
                  .trim()
                  .charAt(0)
                  .toLocaleUpperCase('tr-TR')}
              </Text>
            </View>

            <View style={styles.business}>
              <Text
                style={styles.businessName}
                numberOfLines={1}
              >
                {drop.businessName}
              </Text>

              <Text
                style={styles.branchName}
                numberOfLines={1}
              >
                {drop.branchName}
              </Text>
            </View>
          </View>

          <View style={styles.distanceBadge}>
            <Text style={styles.distanceIcon}>
              ◉
            </Text>

            <Text style={styles.distance}>
              {formatDistance(
                drop.distanceMeters,
              )}
            </Text>
          </View>
        </View>

        <View style={styles.dropBadge}>
          <View style={styles.liveDot} />

          <Text style={styles.dropBadgeText}>
            AKTİF DROP
          </Text>
        </View>

        <Text
          style={styles.title}
          numberOfLines={2}
        >
          {drop.title}
        </Text>

        {!!drop.description && (
          <Text
            style={styles.description}
            numberOfLines={2}
          >
            {drop.description}
          </Text>
        )}

        {drop.minimumSpend != null && (
          <View style={styles.spendBox}>
            <View style={styles.spendIcon}>
              <Text style={styles.spendIconText}>
                ₺
              </Text>
            </View>

            <View>
              <Text style={styles.spendLabel}>
                Minimum harcama
              </Text>

              <Text style={styles.spendValue}>
                {formatCurrency(
                  drop.minimumSpend,
                )}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.capacitySection}>
            <Text style={styles.capacityNumber}>
              {drop.remainingCapacity}
            </Text>

            <Text style={styles.capacityLabel}>
              fırsat kaldı
            </Text>
          </View>

          <View style={styles.timeBadge}>
            <Text style={styles.timeLabel}>
              Kalan süre
            </Text>

            <Text style={styles.time}>
              {remaining.label}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Text style={styles.actionText}>
            Fırsatı incele
          </Text>

          <View style={styles.arrowCircle}>
            <Text style={styles.arrow}>
              →
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECF2',
    borderRadius: 24,

    shadowColor: '#141A2A',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 18,

    elevation: 5,
  },

  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },

  accentLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 5,
    backgroundColor: '#6C5CE7',
  },

  content: {
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 18,
    paddingLeft: 23,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  businessSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  logo: {
    width: 46,
    height: 46,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EDFF',
    borderRadius: 15,
  },

  logoText: {
    color: '#6C5CE7',
    fontSize: 20,
    fontWeight: '900',
  },

  business: {
    flex: 1,
  },

  businessName: {
    color: '#171A24',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  branchName: {
    marginTop: 4,
    color: '#868B98',
    fontSize: 13,
    fontWeight: '500',
  },

  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: '#F5F6F9',
    borderRadius: 20,
  },

  distanceIcon: {
    marginRight: 5,
    color: '#6C5CE7',
    fontSize: 10,
  },

  distance: {
    color: '#424755',
    fontSize: 12,
    fontWeight: '700',
  },

  dropBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#EAFBF3',
    borderRadius: 9,
  },

  liveDot: {
    width: 7,
    height: 7,
    marginRight: 6,
    backgroundColor: '#16B96B',
    borderRadius: 4,
  },

  dropBadgeText: {
    color: '#119455',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  title: {
    marginTop: 11,
    color: '#151821',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 29,
    letterSpacing: -0.6,
  },

  description: {
    marginTop: 8,
    color: '#646A78',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },

  spendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    padding: 13,
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#EFF0F4',
    borderRadius: 16,
  },

  spendIcon: {
    width: 36,
    height: 36,
    marginRight: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1D8',
    borderRadius: 12,
  },

  spendIconText: {
    color: '#E18B00',
    fontSize: 18,
    fontWeight: '900',
  },

  spendLabel: {
    color: '#9297A3',
    fontSize: 11,
    fontWeight: '600',
  },

  spendValue: {
    marginTop: 2,
    color: '#262A35',
    fontSize: 15,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    marginVertical: 18,
    backgroundColor: '#EEEFF3',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  capacitySection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  capacityNumber: {
    color: '#6C5CE7',
    fontSize: 22,
    fontWeight: '900',
  },

  capacityLabel: {
    marginLeft: 5,
    color: '#6D7280',
    fontSize: 13,
    fontWeight: '600',
  },

  timeBadge: {
    alignItems: 'flex-end',
  },

  timeLabel: {
    marginBottom: 3,
    color: '#A0A4AF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  time: {
    color: '#F05252',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 17,
  },

  actionText: {
    marginRight: 9,
    color: '#6C5CE7',
    fontSize: 13,
    fontWeight: '800',
  },

  arrowCircle: {
    width: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 15,
  },

  arrow: {
    marginTop: -2,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});