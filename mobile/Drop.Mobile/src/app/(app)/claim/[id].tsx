import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useCountdown } from '@/features/drops/hooks/useCountdown';

export default function ClaimScreen() {
  const { id, expiresAt } =
    useLocalSearchParams<{
      id: string;
      expiresAt: string;
    }>();

  const remaining =
    useCountdown(expiresAt);

  const isExpired =
    remaining.isExpired;

  const handleOpenScanner = () => {
    // 107. adımda QR scanner açılacak.
  };

  const handleGoHome = () => {
    router.replace('/(app)');
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.backgroundCircleOne} />
      <View style={styles.backgroundCircleTwo} />

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.header}>
          <Pressable
            onPress={handleGoHome}
            accessibilityRole="button"
            accessibilityLabel="Ana sayfaya dön"
            style={({ pressed }) => [
              styles.closeButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text style={styles.closeIcon}>
              ×
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Drop Detayı
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View
          style={[
            styles.statusIconOuter,
            isExpired &&
              styles.statusIconOuterExpired,
          ]}
        >
          <View
            style={[
              styles.statusIconInner,
              isExpired &&
                styles.statusIconInnerExpired,
            ]}
          >
            <Text style={styles.statusIcon}>
              {isExpired ? '×' : '✓'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            isExpired &&
              styles.statusBadgeExpired,
          ]}
        >
          {!isExpired && (
            <View style={styles.liveDot} />
          )}

          <Text
            style={[
              styles.statusBadgeText,
              isExpired &&
                styles.statusBadgeTextExpired,
            ]}
          >
            {isExpired
              ? 'SÜRE DOLDU'
              : 'DROP’U YAKALADIN'}
          </Text>
        </View>

        <Text style={styles.title}>
          {isExpired
            ? 'Bu fırsatın süresi doldu.'
            : 'Drop senin için ayrıldı!'}
        </Text>

        <Text style={styles.description}>
          {isExpired
            ? 'Bu Drop artık kullanılamıyor. Yeni fırsatları keşfetmek için ana sayfaya dönebilirsin.'
            : 'Süre dolmadan işletmeye git ve fırsatını kullanmak için QR kodu okut.'}
        </Text>

        <View
          style={[
            styles.ticket,
            isExpired &&
              styles.ticketExpired,
          ]}
        >
          <View style={styles.ticketNotchLeft} />
          <View style={styles.ticketNotchRight} />

          <View style={styles.timerHeader}>
            <View>
              <Text style={styles.timerLabel}>
                KALAN SÜRE
              </Text>

              <Text style={styles.timerHint}>
                Fırsatını kullanmak için
              </Text>
            </View>

            <View
              style={[
                styles.timerIconBox,
                isExpired &&
                  styles.timerIconBoxExpired,
              ]}
            >
              <Text style={styles.timerIcon}>
                ◷
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.timer,
              isExpired &&
                styles.timerExpired,
            ]}
          >
            {isExpired
              ? '00:00'
              : remaining.label}
          </Text>

          <View style={styles.divider}>
            {Array.from({
              length: 22,
            }).map((_, index) => (
              <View
                key={index}
                style={styles.dividerDot}
              />
            ))}
          </View>

          <View style={styles.instructionRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>
                1
              </Text>
            </View>

            <Text style={styles.instructionText}>
              İşletmeye git
            </Text>
          </View>

          <View style={styles.instructionRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>
                2
              </Text>
            </View>

            <Text style={styles.instructionText}>
              QR kodu okut
            </Text>
          </View>

          <View style={styles.instructionRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>
                3
              </Text>
            </View>

            <Text style={styles.instructionText}>
              Fırsatını kullan
            </Text>
          </View>
        </View>

        <Pressable
          disabled={isExpired}
          onPress={handleOpenScanner}
          accessibilityRole="button"
          accessibilityLabel="QR kodu okut"
          style={({ pressed }) => [
            styles.qrButton,
            isExpired &&
              styles.qrButtonDisabled,
            pressed &&
              !isExpired &&
              styles.qrButtonPressed,
          ]}
        >
          <View style={styles.qrIcon}>
            <View style={styles.qrSquare} />
            <View style={styles.qrSquare} />
            <View style={styles.qrSquare} />
            <View style={styles.qrSquare} />
          </View>

          <Text
            style={[
              styles.qrButtonText,
              isExpired &&
                styles.qrButtonTextDisabled,
            ]}
          >
            {isExpired
              ? 'DROP SÜRESİ DOLDU'
              : 'QR KODU OKUT'}
          </Text>

          {!isExpired && (
            <Text style={styles.buttonArrow}>
              →
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleGoHome}
          style={({ pressed }) => [
            styles.homeButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text style={styles.homeIcon}>
            ‹
          </Text>

          <Text style={styles.homeText}>
            Ana sayfaya dön
          </Text>
        </Pressable>

        <View style={styles.claimInfo}>
          <Text style={styles.claimInfoLabel}>
            CLAIM KODU
          </Text>

          <Text
            style={styles.claimId}
            numberOfLines={1}
            selectable
          >
            {id}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FC',
  },

  backgroundCircleOne: {
    position: 'absolute',
    top: -90,
    right: -95,
    width: 250,
    height: 250,
    backgroundColor: '#EDEAFF',
    borderRadius: 125,
    opacity: 0.8,
  },

  backgroundCircleTwo: {
    position: 'absolute',
    bottom: -100,
    left: -110,
    width: 230,
    height: 230,
    backgroundColor: '#E8F9F1',
    borderRadius: 115,
    opacity: 0.7,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 32,
  },

  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 24,
  },

  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E8EE',
    borderRadius: 14,

    shadowColor: '#242136',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,

    elevation: 2,
  },

  closeIcon: {
    marginTop: -2,
    color: '#393643',
    fontSize: 27,
    fontWeight: '400',
  },

  headerTitle: {
    color: '#22242D',
    fontSize: 15,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 42,
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  statusIconOuter: {
    width: 106,
    height: 106,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6FAF0',
    borderRadius: 53,
  },

  statusIconOuterExpired: {
    backgroundColor: '#FCECEC',
  },

  statusIconInner: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20BE72',
    borderRadius: 38,

    shadowColor: '#20BE72',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.27,
    shadowRadius: 15,

    elevation: 7,
  },

  statusIconInnerExpired: {
    backgroundColor: '#D95050',
    shadowColor: '#D95050',
  },

  statusIcon: {
    color: '#FFFFFF',
    fontSize: 39,
    fontWeight: '700',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#E8FAF1',
    borderRadius: 20,
  },

  statusBadgeExpired: {
    backgroundColor: '#FCECEC',
  },

  liveDot: {
    width: 7,
    height: 7,
    marginRight: 7,
    backgroundColor: '#1EBE71',
    borderRadius: 4,
  },

  statusBadgeText: {
    color: '#139758',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  statusBadgeTextExpired: {
    color: '#C84141',
  },

  title: {
    maxWidth: 330,
    marginTop: 15,
    color: '#191B24',
    fontSize: 29,
    fontWeight: '900',
    lineHeight: 35,
    textAlign: 'center',
    letterSpacing: -0.7,
  },

  description: {
    maxWidth: 335,
    marginTop: 11,
    color: '#737885',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  ticket: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    marginTop: 27,
    padding: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E8F1',
    borderRadius: 25,

    shadowColor: '#252039',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,

    elevation: 5,
  },

  ticketExpired: {
    opacity: 0.75,
  },

  ticketNotchLeft: {
    position: 'absolute',
    top: 144,
    left: -13,
    width: 26,
    height: 26,
    backgroundColor: '#F7F7FC',
    borderRadius: 13,
  },

  ticketNotchRight: {
    position: 'absolute',
    top: 144,
    right: -13,
    width: 26,
    height: 26,
    backgroundColor: '#F7F7FC',
    borderRadius: 13,
  },

  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timerLabel: {
    color: '#888D9A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  timerHint: {
    marginTop: 4,
    color: '#A1A5AF',
    fontSize: 11,
    fontWeight: '500',
  },

  timerIconBox: {
    width: 41,
    height: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDEAFF',
    borderRadius: 14,
  },

  timerIconBoxExpired: {
    backgroundColor: '#FCECEC',
  },

  timerIcon: {
    color: '#6C5CE7',
    fontSize: 23,
    fontWeight: '700',
  },

  timer: {
    marginTop: 11,
    color: '#6C5CE7',
    fontSize: 53,
    fontWeight: '900',
    letterSpacing: -2,
  },

  timerExpired: {
    color: '#D95050',
  },

  divider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 19,
  },

  dividerDot: {
    width: 6,
    height: 2,
    backgroundColor: '#DDDCE5',
    borderRadius: 1,
  },

  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  stepNumber: {
    width: 26,
    height: 26,
    marginRight: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EDFF',
    borderRadius: 9,
  },

  stepNumberText: {
    color: '#6C5CE7',
    fontSize: 11,
    fontWeight: '900',
  },

  instructionText: {
    color: '#4F5360',
    fontSize: 13,
    fontWeight: '700',
  },

  qrButton: {
    width: '100%',
    height: 61,
    marginTop: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 18,

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.28,
    shadowRadius: 15,

    elevation: 7,
  },

  qrButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  qrButtonDisabled: {
    backgroundColor: '#E1E2E7',
    shadowOpacity: 0,
    elevation: 0,
  },

  qrIcon: {
    width: 23,
    height: 23,
    marginRight: 11,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  qrSquare: {
    width: 9,
    height: 9,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 2,
  },

  qrButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  qrButtonTextDisabled: {
    color: '#969AA4',
  },

  buttonArrow: {
    position: 'absolute',
    right: 20,
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
  },

  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 23,
    paddingVertical: 8,
  },

  homeIcon: {
    marginRight: 7,
    color: '#6C5CE7',
    fontSize: 25,
    fontWeight: '500',
  },

  homeText: {
    color: '#555A67',
    fontSize: 13,
    fontWeight: '700',
  },

  claimInfo: {
    width: '100%',
    marginTop: 21,
    alignItems: 'center',
    padding: 13,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 13,
  },

  claimInfoLabel: {
    color: '#A3A6AF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  claimId: {
    maxWidth: '90%',
    marginTop: 4,
    color: '#858994',
    fontSize: 10,
    fontWeight: '600',
  },
});