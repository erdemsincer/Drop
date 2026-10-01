import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { CategoryPicker } from '@/features/businesses/components/CategoryPicker';
import { PhotoPicker } from '@/features/businesses/components/PhotoPicker';
import { StartTimePicker } from '@/features/businesses/components/StartTimePicker';
import { useBranch } from '@/features/businesses/hooks/useBranch';
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
  dropToTemplateValues,
  recentTemplates,
  withOption,
  toCreateDropRequest,
  toUpdateDropRequest,
  validateDropForm,
} from '@/features/businesses/utils/dropForm';
import { DropCard } from '@/features/drops/components/DropCard';
import type { NearbyDrop } from '@/features/drops/types/drop';
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
  startsAt: null,
  category: 'Other',
  originalPrice: '',
  dealPrice: '',
  photoId: null,
};

/**
 * Creates a drop, edits a live one (dropId), or republishes a previous one
 * (fromDropId: every field, durations included, prefilled).
 */
export default function DropFormScreen() {
  const { branchId, dropId, fromDropId } = useLocalSearchParams<{
    branchId: string;
    dropId?: string;
    fromDropId?: string;
  }>();
  const dropsQuery = useBranchDrops(branchId);
  const drops = dropsQuery.data ?? [];
  const editing = dropId ? drops.find(drop => drop.id === dropId) : undefined;
  const template = fromDropId ? drops.find(drop => drop.id === fromDropId) : undefined;
  const isEdit = Boolean(dropId);
  const taken = editing ? editing.activeClaimCount + editing.redeemedCount : 0;
  const templates = isEdit ? [] : recentTemplates(drops);

  const [values, setValues] = useState(() =>
    editing ? dropToFormValues(editing) : template ? dropToTemplateValues(template) : initialValues,
  );
  const [appliedTemplateId, setAppliedTemplateId] = useState(template?.id);

  const applyTemplate = (drop: (typeof drops)[number]) => {
    haptics.tap();
    setValues(dropToTemplateValues(drop));
    setErrors({});
    setAppliedTemplateId(drop.id);
  };
  const [errors, setErrors] = useState<DropFormErrors>({});
  const branch = useBranch(branchId).data;
  const preview = usePreviewDrop(values, branch?.businessName, branch?.name);
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
          {templates.length > 0 && (
            <View style={styles.templates}>
              <Text style={styles.templatesTitle}>Öncekilerden doldur</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templatesRow}
              >
                {templates.map(drop => {
                  const selected = drop.id === appliedTemplateId;

                  return (
                    <Pressable
                      key={drop.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${drop.title} ile doldur`}
                      onPress={() => applyTemplate(drop)}
                      style={({ pressed }) => [
                        styles.template,
                        selected && styles.templateSelected,
                        pressed && styles.templatePressed,
                      ]}
                    >
                      <Ionicons
                        name={selected ? 'checkmark-circle' : 'copy-outline'}
                        size={16}
                        color={selected ? colors.textOnDark : colors.primary}
                      />
                      <View style={styles.templateText}>
                        <Text style={[styles.templateName, selected && styles.templateNameSelected]} numberOfLines={1}>
                          {drop.title}
                        </Text>
                        <Text style={[styles.templateMeta, selected && styles.templateMetaSelected]} numberOfLines={1}>
                          {drop.capacity} kişi · {drop.claimDurationMinutes} dk
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

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

          <Section title="Fotoğraf" icon="image">
            <PhotoPicker value={values.photoId} onChange={value => set('photoId', value)} />
          </Section>

          <Section title="Fiyat" icon="pricetags">
            <View style={styles.row}>
              <View style={styles.half}>
                <TextField
                  label="Normal fiyat"
                  icon="cash-outline"
                  value={values.originalPrice}
                  onChangeText={value => set('originalPrice', value.replace(/[^0-9.,]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="₺120"
                  error={errorFor('originalPrice')}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="Drop fiyatı"
                  icon="flash-outline"
                  value={values.dealPrice}
                  onChangeText={value => set('dealPrice', value.replace(/[^0-9.,]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="₺60"
                  error={errorFor('dealPrice')}
                />
              </View>
            </View>
            <Text style={styles.hint}>
              İsteğe bağlı. Yazarsan kartta indirim oranı görünür ve müşterinin tasarrufuna eklenir. Bedava ise Drop fiyatına 0 yaz.
            </Text>
          </Section>

          <Section title="Kategori" icon="grid">
            <CategoryPicker value={values.category} onChange={value => set('category', value)} />
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
            <Section title="Ne zaman başlasın?" icon="calendar">
              <StartTimePicker
                value={values.startsAt}
                onChange={value => set('startsAt', value)}
                error={errorFor('startsAt')}
              />
            </Section>

            <Section title="Drop ne kadar yayında kalsın?" icon="hourglass">
              <ChoiceChips
                options={withOption(DROP_DURATIONS, values.durationMinutes)}
                value={values.durationMinutes}
                onChange={value => set('durationMinutes', value)}
              />
            </Section>

            <Section title="Yakalandıktan sonra kullanım süresi" icon="timer">
              <ChoiceChips
                options={withOption(CLAIM_DURATIONS, values.claimDurationMinutes)}
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

          <View style={styles.preview}>
            <View style={styles.previewHeader}>
              <Ionicons name="eye" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Müşteriler böyle görecek</Text>
            </View>
            <View pointerEvents="none">
              <DropCard drop={preview} onPress={() => {}} />
            </View>
          </View>

          {apiError && !apiError.errors && (
            <Notice message={getBusinessErrorMessage(apiError.code, apiError.detail)} />
          )}
          {mutation.isError && !apiError && <Notice message="Sunucuya ulaşılamadı." />}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={isEdit ? 'Değişiklikleri Kaydet' : values.startsAt ? "Drop'u Planla" : "Drop'u Yayınla"}
            icon={isEdit ? 'checkmark-circle' : values.startsAt ? 'calendar' : 'rocket'}
            loading={mutation.isPending}
            onPress={handlePublish}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** The form as a feed card, so the owner sees the deal the way a customer will. */
function usePreviewDrop(values: DropFormValues, businessName = 'İşletmen', branchName = 'Şuben'): NearbyDrop {
  // Counted from when the form opened, so the preview countdown ticks instead of resetting on every keystroke.
  const [openedAt] = useState(() => Date.now());
  const endsAt = new Date(openedAt + values.durationMinutes * 60_000).toISOString();
  const capacity = Math.max(1, Number(values.capacity) || 1);
  const spend = Number(values.minimumSpend.trim().replace(',', '.'));

  return {
    id: 'preview',
    branchId: 'preview',
    businessName,
    branchName,
    title: values.title.trim() || 'Fırsatının başlığı burada görünecek',
    description: values.description.trim() || null,
    minimumSpend: values.minimumSpend.trim() && Number.isFinite(spend) ? spend : null,
    capacity,
    claimedCount: 0,
    remainingCapacity: capacity,
    distanceMeters: 250,
    endsAt,
    category: values.category,
    latitude: 0,
    longitude: 0,
  };
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
  preview: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.xs,
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
  templates: {
    gap: spacing.sm,
  },
  templatesTitle: {
    marginLeft: spacing.xs,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  templatesRow: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  template: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 220,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  templateSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  templatePressed: {
    opacity: 0.8,
  },
  templateText: {
    flexShrink: 1,
  },
  templateName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  templateNameSelected: {
    color: colors.textOnDark,
  },
  templateMeta: {
    marginTop: 1,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  templateMetaSelected: {
    color: colors.textOnDarkMuted,
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
