import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useCreateDrop } from '@/features/businesses/hooks/useCreateDrop';
import { getBusinessErrorMessage } from '@/features/businesses/utils/businessLabels';
import {
  CLAIM_DURATIONS,
  DROP_DURATIONS,
  type DropFormErrors,
  type DropFormValues,
  apiFieldMap,
  toCreateDropRequest,
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

export default function CreateDropScreen() {
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<DropFormErrors>({});
  const mutation = useCreateDrop(branchId);

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
    setErrors(validation);

    if (Object.keys(validation).length) {
      haptics.error();
      return;
    }

    mutation.mutate(toCreateDropRequest(values), {
      onSuccess: () => {
        haptics.success();
        router.back();
      },
      onError: () => haptics.error(),
    });
  };

  return (
    <Screen>
      <Header title="Yeni Drop" onBack={() => router.back()} />

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

          {apiError && !apiError.errors && (
            <Notice message={getBusinessErrorMessage(apiError.code, apiError.detail)} />
          )}
          {mutation.isError && !apiError && <Notice message="Sunucuya ulaşılamadı." />}
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Drop'u Yayınla" icon="rocket" loading={mutation.isPending} onPress={handlePublish} />
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
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
