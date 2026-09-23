import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useCreateClaim } from '@/features/claims/hooks/useCreateClaim';
import { getClaimErrorMessage } from '@/features/claims/utils/getClaimErrorMessage';
import { useCountdown } from '@/features/drops/hooks/useCountdown';
import { useDropDetail } from '@/features/drops/hooks/useDropDetail';
import type { DropDetail } from '@/features/drops/types/drop';
import { formatCurrency } from '@/utils/formatCurrency';

export default function DropDetailScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const dropQuery =
    useDropDetail(id);

  const claimMutation =
    useCreateClaim();

  if (dropQuery.isLoading) {
    return (
      <ScreenState>
        <View style={styles.loadingIcon}>
          <ActivityIndicator
            size="large"
            color="#6C5CE7"
          />
        </View>

        <Text style={styles.stateTitle}>
          Drop yükleniyor
        </Text>

        <Text style={styles.stateDescription}>
          Fırsatın detaylarını
          hazırlıyoruz...
        </Text>
      </ScreenState>
    );
  }

  if (
    dropQuery.isError ||
    !dropQuery.data
  ) {
    return (
      <ScreenState>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>
            !
          </Text>
        </View>

        <Text style={styles.stateTitle}>
          Drop bulunamadı
        </Text>

        <Text style={styles.stateDescription}>
          Bu Drop kaldırılmış veya
          artık erişilemiyor olabilir.
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.stateButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text style={styles.stateButtonText}>
            Geri dön
          </Text>
        </Pressable>
      </ScreenState>
    );
  }

  return (
    <DropDetailContent
      drop={dropQuery.data}
      isClaiming={
        claimMutation.isPending
      }
      claimError={
        claimMutation.error
      }
      onClaim={() => {
        claimMutation.mutate(
          dropQuery.data.id,
          {
            onSuccess: claim => {
              router.replace({
                pathname:
                  '/(app)/claim/[id]',
                params: {
                  id: claim.claimId,
                  expiresAt:
                    claim.expiresAt,
                },
              });
            },
          },
        );
      }}
    />
  );
}

type ScreenStateProps = {
  children: React.ReactNode;
};

function ScreenState({
  children,
}: ScreenStateProps) {
  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.center}>
        {children}
      </View>
    </SafeAreaView>
  );
}

type ContentProps = {
  drop: DropDetail;
  isClaiming: boolean;
  claimError: unknown;
  onClaim: () => void;
};

function DropDetailContent({
  drop,
  isClaiming,
  claimError,
  onClaim,
}: ContentProps) {
  const remaining =
    useCountdown(drop.endsAt);

  const apiError = claimError
    ? getApiError(claimError)
    : null;

  const soldOut =
    drop.remainingCapacity <= 0;

  const disabled =
    soldOut ||
    remaining.isExpired ||
    isClaiming;

  const buttonText = soldOut
    ? 'TÜKENDİ'
    : remaining.isExpired
      ? 'SONA ERDİ'
      : 'DROP’U YAKALA';

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.backgroundCircleOne} />
      <View style={styles.backgroundCircleTwo} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          style={({ pressed }) => [
            styles.backButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text style={styles.backIcon}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Drop Detayı
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.businessRow}>
          <View style={styles.businessLogo}>
            <Text
              style={styles.businessLogoText}
            >
              {drop.businessName
                .trim()
                .charAt(0)
                .toLocaleUpperCase(
                  'tr-TR',
                )}
            </Text>
          </View>

          <View style={styles.businessInfo}>
            <Text
              style={styles.business}
              numberOfLines={1}
            >
              {drop.businessName}
            </Text>

            <View style={styles.branchRow}>
              <Text style={styles.locationDot}>
                ●
              </Text>

              <Text
                style={styles.branch}
                numberOfLines={1}
              >
                {drop.branchName}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              (soldOut ||
                remaining.isExpired) &&
                styles.statusBadgePassive,
            ]}
          >
            {!soldOut &&
              !remaining.isExpired && (
                <View
                  style={styles.liveDot}
                />
              )}

            <Text
              style={[
                styles.statusBadgeText,
                (soldOut ||
                  remaining.isExpired) &&
                  styles.statusBadgeTextPassive,
              ]}
            >
              {soldOut
                ? 'TÜKENDİ'
                : remaining.isExpired
                  ? 'BİTTİ'
                  : 'AKTİF'}
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View
            style={
              styles.heroDecorationOne
            }
          />

          <View
            style={
              styles.heroDecorationTwo
            }
          />

          <View style={styles.heroTop}>
            <View style={styles.dropBadge}>
              <Text
                style={
                  styles.dropBadgeText
                }
              >
                ÖZEL FIRSAT
              </Text>
            </View>

            <Text style={styles.sparkle}>
              ✦
            </Text>
          </View>

          <Text style={styles.title}>
            {drop.title}
          </Text>

          {!!drop.description && (
            <Text
              style={styles.description}
            >
              {drop.description}
            </Text>
          )}
        </View>

        <View style={styles.quickInfoRow}>
          <View style={styles.quickInfoCard}>
            <View
              style={[
                styles.quickInfoIcon,
                styles.capacityIcon,
              ]}
            >
              <Text
                style={
                  styles.quickInfoIconText
                }
              >
                ◉
              </Text>
            </View>

            <Text style={styles.quickInfoLabel}>
              Kalan
            </Text>

            <Text
              style={[
                styles.quickInfoValue,
                soldOut &&
                  styles.dangerText,
              ]}
            >
              {drop.remainingCapacity}
            </Text>

            <Text style={styles.quickInfoUnit}>
              fırsat
            </Text>
          </View>

          <View style={styles.quickInfoCard}>
            <View
              style={[
                styles.quickInfoIcon,
                styles.timeIcon,
              ]}
            >
              <Text
                style={
                  styles.quickInfoIconText
                }
              >
                ◷
              </Text>
            </View>

            <Text style={styles.quickInfoLabel}>
              Kalan süre
            </Text>

            <Text
              style={[
                styles.quickInfoValue,
                styles.timeValue,
              ]}
              numberOfLines={1}
            >
              {remaining.isExpired
                ? '00:00'
                : remaining.label}
            </Text>

            <Text style={styles.quickInfoUnit}>
              sona erene kadar
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>
            Fırsat bilgileri
          </Text>

          {drop.minimumSpend != null && (
            <InfoRow
              icon="₺"
              iconStyle="orange"
              label="Minimum harcama"
              value={formatCurrency(
                drop.minimumSpend,
              )}
            />
          )}

          <InfoRow
            icon="◷"
            iconStyle="purple"
            label="Kullanım süresi"
            value={`${drop.claimDurationMinutes} dakika`}
          />

          <InfoRow
            icon="◎"
            iconStyle="green"
            label="Kalan kapasite"
            value={`${drop.remainingCapacity} kişi`}
            isLast
          />
        </View>

        <View style={styles.explanation}>
          <View
            style={
              styles.explanationHeader
            }
          >
            <View>
              <Text
                style={
                  styles.explanationTitle
                }
              >
                Nasıl çalışır?
              </Text>

              <Text
                style={
                  styles.explanationSubtitle
                }
              >
                Dört kolay adımda kullan
              </Text>
            </View>

            <View
              style={
                styles.explanationBadge
              }
            >
              <Text
                style={
                  styles.explanationBadgeText
                }
              >
                4 ADIM
              </Text>
            </View>
          </View>

          <Step
            number="1"
            title="Drop’u yakala"
            description="Aşağıdaki butona dokunarak fırsatı kendine ayır."
          />

          <Step
            number="2"
            title="İşletmeye git"
            description={`${drop.claimDurationMinutes} dakika içinde ilgili şubeye ulaş.`}
          />

          <Step
            number="3"
            title="QR kodu okut"
            description="İşletmede bulunan QR kodunu telefonundan okut."
          />

          <Step
            number="4"
            title="Avantajını kullan"
            description="Drop fırsatından hemen yararlan."
            isLast
          />
        </View>

        {apiError && (
          <View style={styles.apiErrorBox}>
            <View
              style={
                styles.apiErrorIcon
              }
            >
              <Text
                style={
                  styles.apiErrorIconText
                }
              >
                !
              </Text>
            </View>

            <Text style={styles.apiError}>
              {getClaimErrorMessage(
                apiError.code,
                apiError.detail,
              )}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.bottomInfo}>
          <View>
            <Text
              style={
                styles.bottomInfoLabel
              }
            >
              YAKALADIKTAN SONRA
            </Text>

            <Text
              style={
                styles.bottomInfoValue
              }
            >
              {drop.claimDurationMinutes}{' '}
              dakikan var
            </Text>
          </View>

          <Text style={styles.bottomClock}>
            ◷
          </Text>
        </View>

        <Pressable
          disabled={disabled}
          onPress={onClaim}
          accessibilityRole="button"
          accessibilityLabel={buttonText}
          style={({ pressed }) => [
            styles.claimButton,
            disabled &&
              styles.claimButtonDisabled,
            pressed &&
              !disabled &&
              styles.claimButtonPressed,
          ]}
        >
          {isClaiming ? (
            <>
              <ActivityIndicator
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.claimButtonText
                }
              >
                AYRILIYOR...
              </Text>
            </>
          ) : (
            <>
              {!disabled && (
                <View
                  style={
                    styles.claimButtonIcon
                  }
                >
                  <Text
                    style={
                      styles.claimButtonIconText
                    }
                  >
                    ⚡
                  </Text>
                </View>
              )}

              <Text
                style={[
                  styles.claimButtonText,
                  disabled &&
                    styles.claimButtonTextDisabled,
                ]}
              >
                {buttonText}
              </Text>

              {!disabled && (
                <Text
                  style={
                    styles.claimButtonArrow
                  }
                >
                  →
                </Text>
              )}
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type InfoRowProps = {
  icon: string;
  iconStyle:
    | 'orange'
    | 'purple'
    | 'green';
  label: string;
  value: string;
  isLast?: boolean;
};

function InfoRow({
  icon,
  iconStyle,
  label,
  value,
  isLast = false,
}: InfoRowProps) {
  return (
    <View
      style={[
        styles.infoRow,
        isLast &&
          styles.infoRowLast,
      ]}
    >
      <View
        style={[
          styles.infoIcon,
          iconStyle === 'orange' &&
            styles.infoIconOrange,
          iconStyle === 'purple' &&
            styles.infoIconPurple,
          iconStyle === 'green' &&
            styles.infoIconGreen,
        ]}
      >
        <Text
          style={[
            styles.infoIconText,
            iconStyle === 'orange' &&
              styles.infoIconTextOrange,
            iconStyle === 'purple' &&
              styles.infoIconTextPurple,
            iconStyle === 'green' &&
              styles.infoIconTextGreen,
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

type StepProps = {
  number: string;
  title: string;
  description: string;
  isLast?: boolean;
};

function Step({
  number,
  title,
  description,
  isLast = false,
}: StepProps) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIndicator}>
        <View style={styles.stepNumber}>
          <Text
            style={
              styles.stepNumberText
            }
          >
            {number}
          </Text>
        </View>

        {!isLast && (
          <View style={styles.stepLine} />
        )}
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text
          style={
            styles.stepDescription
          }
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  backgroundCircleOne: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    backgroundColor: '#ECE9FF',
    borderRadius: 125,
    opacity: 0.75,
  },

  backgroundCircleTwo: {
    position: 'absolute',
    top: 330,
    left: -100,
    width: 210,
    height: 210,
    backgroundColor: '#E8F9F1',
    borderRadius: 105,
    opacity: 0.6,
  },

  header: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },

  backButton: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#E5E6ED',
    borderRadius: 14,

    shadowColor: '#292638',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.07,
    shadowRadius: 10,

    elevation: 2,
  },

  backIcon: {
    marginTop: -3,
    color: '#2E3039',
    fontSize: 32,
    fontWeight: '400',
  },

  headerTitle: {
    color: '#242630',
    fontSize: 15,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 43,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 210,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },

  loadingIcon: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 18,

    elevation: 5,
  },

  errorIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCECEC',
    borderRadius: 26,
  },

  errorIconText: {
    color: '#D95050',
    fontSize: 34,
    fontWeight: '900',
  },

  stateTitle: {
    marginTop: 22,
    color: '#20222C',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },

  stateDescription: {
    maxWidth: 300,
    marginTop: 9,
    color: '#7D828F',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  stateButton: {
    marginTop: 23,
    paddingHorizontal: 23,
    paddingVertical: 13,
    backgroundColor: '#6C5CE7',
    borderRadius: 15,
  },

  stateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },

  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },

  businessLogo: {
    width: 48,
    height: 48,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDEAFF',
    borderRadius: 16,
  },

  businessLogoText: {
    color: '#6C5CE7',
    fontSize: 21,
    fontWeight: '900',
  },

  businessInfo: {
    flex: 1,
    marginRight: 10,
  },

  business: {
    color: '#20222B',
    fontSize: 16,
    fontWeight: '800',
  },

  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  locationDot: {
    marginRight: 5,
    color: '#6C5CE7',
    fontSize: 7,
  },

  branch: {
    flex: 1,
    color: '#7D828E',
    fontSize: 12,
    fontWeight: '500',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#E7F9F0',
    borderRadius: 18,
  },

  statusBadgePassive: {
    backgroundColor: '#FCECEC',
  },

  liveDot: {
    width: 7,
    height: 7,
    marginRight: 6,
    backgroundColor: '#1DBD70',
    borderRadius: 4,
  },

  statusBadgeText: {
    color: '#119455',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  statusBadgeTextPassive: {
    color: '#C84242',
  },

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    marginTop: 23,
    padding: 22,
    backgroundColor: '#272438',
    borderRadius: 27,

    shadowColor: '#1C192D',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,

    elevation: 7,
  },

  heroDecorationOne: {
    position: 'absolute',
    top: -55,
    right: -40,
    width: 165,
    height: 165,
    backgroundColor: '#6C5CE7',
    borderRadius: 83,
    opacity: 0.75,
  },

  heroDecorationTwo: {
    position: 'absolute',
    right: 70,
    bottom: -50,
    width: 110,
    height: 110,
    backgroundColor: '#A99FFF',
    borderRadius: 55,
    opacity: 0.12,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor:
      'rgba(255,255,255,0.13)',
    borderRadius: 10,
  },

  dropBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  sparkle: {
    color: '#FFFFFF',
    fontSize: 22,
  },

  title: {
    maxWidth: '90%',
    marginTop: 17,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -0.7,
  },

  description: {
    maxWidth: '92%',
    marginTop: 10,
    color: '#C8C5D7',
    fontSize: 14,
    lineHeight: 21,
  },

  quickInfoRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },

  quickInfoCard: {
    flex: 1,
    minHeight: 143,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EAF0',
    borderRadius: 20,
  },

  quickInfoIcon: {
    width: 34,
    height: 34,
    marginBottom: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },

  capacityIcon: {
    backgroundColor: '#E7F9F0',
  },

  timeIcon: {
    backgroundColor: '#EDEAFF',
  },

  quickInfoIconText: {
    color: '#6C5CE7',
    fontSize: 16,
    fontWeight: '900',
  },

  quickInfoLabel: {
    color: '#9296A1',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  quickInfoValue: {
    marginTop: 5,
    color: '#20232D',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  timeValue: {
    color: '#6C5CE7',
    fontSize: 18,
  },

  dangerText: {
    color: '#D95050',
  },

  quickInfoUnit: {
    marginTop: 2,
    color: '#A0A4AE',
    fontSize: 10,
    fontWeight: '500',
  },

  infoCard: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingTop: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EAF0',
    borderRadius: 22,
  },

  cardTitle: {
    marginBottom: 9,
    color: '#242630',
    fontSize: 17,
    fontWeight: '900',
  },

  infoRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFF0F4',
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoIcon: {
    width: 36,
    height: 36,
    marginRight: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  infoIconOrange: {
    backgroundColor: '#FFF2DB',
  },

  infoIconPurple: {
    backgroundColor: '#EDEAFF',
  },

  infoIconGreen: {
    backgroundColor: '#E7F9F0',
  },

  infoIconText: {
    fontSize: 17,
    fontWeight: '900',
  },

  infoIconTextOrange: {
    color: '#E18B00',
  },

  infoIconTextPurple: {
    color: '#6C5CE7',
  },

  infoIconTextGreen: {
    color: '#16A862',
  },

  infoLabel: {
    flex: 1,
    color: '#777C88',
    fontSize: 13,
    fontWeight: '600',
  },

  infoValue: {
    maxWidth: '45%',
    color: '#292C35',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },

  explanation: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EAF0',
    borderRadius: 22,
  },

  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  explanationTitle: {
    color: '#242630',
    fontSize: 18,
    fontWeight: '900',
  },

  explanationSubtitle: {
    marginTop: 4,
    color: '#989CA7',
    fontSize: 11,
    fontWeight: '500',
  },

  explanationBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#EDEAFF',
    borderRadius: 9,
  },

  explanationBadgeText: {
    color: '#6C5CE7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  step: {
    minHeight: 73,
    flexDirection: 'row',
  },

  stepIndicator: {
    width: 34,
    alignItems: 'center',
  },

  stepNumber: {
    zIndex: 2,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 10,
  },

  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E3E0F8',
  },

  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 18,
  },

  stepTitle: {
    color: '#353842',
    fontSize: 14,
    fontWeight: '800',
  },

  stepDescription: {
    marginTop: 4,
    color: '#8A8F9A',
    fontSize: 12,
    lineHeight: 18,
  },

  apiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 14,
    backgroundColor: '#FCECEC',
    borderWidth: 1,
    borderColor: '#F5D2D2',
    borderRadius: 16,
  },

  apiErrorIcon: {
    width: 31,
    height: 31,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D95050',
    borderRadius: 10,
  },

  apiErrorIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  apiError: {
    flex: 1,
    color: '#AC3A3A',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },

  bottom: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 18,
    backgroundColor:
      'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#E9EAF0',

    shadowColor: '#252039',
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,

    elevation: 12,
  },

  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 3,
  },

  bottomInfoLabel: {
    color: '#A1A4AD',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  bottomInfoValue: {
    marginTop: 2,
    color: '#4C505B',
    fontSize: 12,
    fontWeight: '700',
  },

  bottomClock: {
    color: '#6C5CE7',
    fontSize: 20,
    fontWeight: '800',
  },

  claimButton: {
    position: 'relative',
    height: 61,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 18,

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.27,
    shadowRadius: 14,

    elevation: 7,
  },

  claimButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  claimButtonDisabled: {
    backgroundColor: '#E0E1E6',
    shadowOpacity: 0,
    elevation: 0,
  },

  claimButtonIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.17)',
    borderRadius: 10,
  },

  claimButtonIconText: {
    fontSize: 15,
  },

  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  claimButtonTextDisabled: {
    color: '#979AA3',
  },

  claimButtonArrow: {
    position: 'absolute',
    right: 20,
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
  },
});