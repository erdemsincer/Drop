import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useBranchDrops } from '@/features/businesses/hooks/useBranchDrops';
import { useCreateDrop } from '@/features/businesses/hooks/useCreateDrop';
import { useUpdateDrop } from '@/features/businesses/hooks/useUpdateDrop';
import { getBusinessErrorMessage } from '@/features/businesses/utils/businessLabels';
import {
  CLAIM_DURATIONS,
  DROP_DURATIONS,
  type DropFormErrors,
  type DropFormValues,
  apiFieldMap,
  dropToFormValues,
  toCreateDropRequest,
  toUpdateDropRequest,
  validateDropForm,
} from '@/features/businesses/utils/dropForm';
import {
  Button,
  ChoiceChips,
  Header,
  Notice,
  Screen,
  TextField,
  colors,
  haptics,
  radius,
  shadows,
  spacing,
  typography,
} from '@/ui';

const initialValues: DropFormValues = {
  title: '',
  description: '',
  minimumSpend: '',
  capacity: '10',
  durationMinutes: 60,
  claimDurationMinutes: 15,
};

/** Creates a drop, or edits a live one when a dropId param is given. */
export default function DropFormScreen() {
  const { branchId, dropId } = useLocalSearchParams<{ branchId: string; dropId?: string }>();
  const dropsQuery = useBranchDrops(branchId);
  const editing = dropId ? dropsQuery.data?.find(drop => drop.id === dropId) : undefined;
  const isEdit = Boolean(dropId);
  const taken = editing ? editing.activeClaimCount + editing.redeemedCount : 0;

  const [values, setValues] = useState(() => (editing ? dropToFormValues(editing) : initialValues));
  const [errors, setErrors] = useState<DropFormErrors>({});
  const createMutation = useCreateDrop(branchId);
  const updateMutation = useUpdateDrop(branchId);
  const mutation = isEdit ? updateMutation : createMutation;

  const apiError = mutation.error ? getApiError(mutation.error) : null;

  const apiFieldErrors: DropFormErrors = {};
  for (const [field, messages] of Object.entries(apiError?.errors ?? {})) {
    const key = apiFieldMap[field];
    if (key && messages[0]) apiFieldErrors[key] = messages[0].message;
  }

  const errorFor = (key: keyof DropFormValues) => errors[key] || apiFieldErrors[key];

  const set = <K extends keyof DropFormValues>(key: K, value: DropFormValues[K]) => {
    setValues(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
  };

  const handlePublish = () => {
    const validation = validateDropForm(values);

    if (isEdit && !validation.capacity && Number(values.capacity) < taken) {
      validation.capacity = `En az ${taken} olmalı; bu kadar yer zaten yakalandı.`;
    }

    setErrors(validation);

    if (Object.keys(validation).length) {
      haptics.error();
      return;
    }

    const done = {
      onSuccess: () => {
        haptics.success();
        router.back();
      },
      onError: () => haptics.error(),
    };

    if (isEdit && dropId) {
      updateMutation.mutate({ dropId, request: toUpdateDropRequest(values) }, done);
    } else {
      createMutation.mutate(toCreateDropRequest(values), done);
    }
  };

  return (
    <Screen>
      <Header title={isEdit ? "Drop'u düzenle" : 'Yeni Drop'} onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section title="Fırsat" icon="sparkles">
            <TextField
              label="Başlık"
              icon="pricetag-outline"
              value={values.title}
              onChangeText={value => set('title', value)}
              placeholder="2 kahve alana cheesecake bizden"
              maxLength={200}
              error={errorFor('title')}
            />
            <TextField
              label="Açıklama (isteğe bağlı)"
              icon="document-text-outline"
              value={values.description}
              onChangeText={value => set('description', value)}
              placeholder="Bugüne özel, stoklarla sınırlı..."
              multiline
              maxLength={1000}
              error={errorFor('description')}
            />
          </Section>

          <Section title="Koşullar" icon="options">
            <View style={styles.row}>
              <View style={styles.half}>
                <TextField
                  label="Kaç kişi?"
                  icon="people-outline"
                  value={values.capacity}
                  onChangeText={value => set('capacity', value.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={4}
                  error={errorFor('capacity')}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="Min. harcama"
                  icon="wallet-outline"
                  value={values.minimumSpend}
                  onChangeText={value => set('minimumSpend', value.replace(/[^0-9.,]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="₺ yok"
                  error={errorFor('minimumSpend')}
                />
              </View>
            </View>
          </Section>

          {isEdit ? (
            <View style={styles.editNote}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={styles.editNoteText}>
                Yayın ve kullanım süresi Drop yayındayken değiştirilemez. Gerekirse Drop&apos;u erken bitirip yenisini aç.
              </Text>
            </View>
          ) : (
            <>
            <Section title="Drop ne kadar yayında kalsın?" icon="hourglass">
              <ChoiceChips
                options={DROP_DURATIONS}
                value={values.durationMinutes}
                onChange={value => set('durationMinutes', value)}
              />
            </Section>

            <Section title="Yakalandıktan sonra kullanım süresi" icon="timer">
              <ChoiceChips
                options={CLAIM_DURATIONS}
                value={values.claimDurationMinutes}
                onChange={value => set('claimDurationMinutes', value)}
              />
              {errorFor('claimDurationMinutes') && (
                <Text style={styles.inlineError}>{errorFor('claimDurationMinutes')}</Text>
              )}
              <Text style={styles.hint}>
                Müşteri Drop&apos;u yakaladıktan sonra bu süre içinde gelip QR okutmalı. Süre dolarsa yer yeniden açılır.
              </Text>
            </Section>
            </>
          )}

          {apiError && !apiError.errors && (
            <Notice message={getBusinessErrorMessage(apiError.code, apiError.detail)} />
          )}
          {mutation.isError && !apiError && <Notice message="Sunucuya ulaşılamadı." />}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={isEdit ? 'Değişiklikleri Kaydet' : "Drop'u Yayınla"}
            icon={isEdit ? 'checkmark-circle' : 'rocket'}
            loading={mutation.isPending}
            onPress={handlePublish}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={16} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  section: {
    gap: spacing.md,
    padding: spacing.lg + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  inlineError: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  editNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
  editNoteText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
