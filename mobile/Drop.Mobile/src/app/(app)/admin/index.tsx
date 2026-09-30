import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiError } from '@/api/getApiError';
import type { AdminBusiness, ModerationAction } from '@/features/admin/api/adminApi';
import { useAdminBusinesses, useModerateBusiness } from '@/features/admin/hooks/useAdminBusinesses';
import type { BusinessStatus } from '@/features/businesses/types/business';
import { businessStatusInfo } from '@/features/businesses/utils/businessLabels';
import {
  Avatar,
  Badge,
  Button,
  ChoiceChips,
  Header,
  Notice,
  Screen,
  Skeleton,
  StateView,
  TextField,
  colors,
  haptics,
  radius,
  shadows,
  spacing,
} from '@/ui';

const FILTERS: { label: string; value: BusinessStatus }[] = [
  { label: 'Bekleyen', value: 'Pending' },
  { label: 'Onaylı', value: 'Approved' },
  { label: 'Red', value: 'Rejected' },
  { label: 'Askıda', value: 'Suspended' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

type ReasonPrompt = { business: AdminBusiness; action: Exclude<ModerationAction, 'approve'> };

export default function AdminBusinessesScreen() {
  const [status, setStatus] = useState<BusinessStatus>('Pending');
  const [prompt, setPrompt] = useState<ReasonPrompt | null>(null);

  const listQuery = useAdminBusinesses(status);
  const moderate = useModerateBusiness();

  const run = (business: AdminBusiness, action: ModerationAction, reason?: string) => {
    haptics.press();
    moderate.mutate(
      { businessId: business.id, action, reason },
      {
        onSuccess: () => {
          haptics.success();
          setPrompt(null);
        },
        onError: () => haptics.error(),
      },
    );
  };

  const listError = listQuery.error ? getApiError(listQuery.error) : null;

  if (listError?.code === 'admin.access_denied') {
    return (
      <Screen>
        <Header title="Yönetim" onBack={() => router.back()} />
        <StateView icon="lock-closed" tone="danger" title="Yetkin yok" description="Bu ekran yalnızca Drop yöneticileri içindir." />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <Header title="İşletme onayları" onBack={() => router.back()} />

      <FlatList
        data={listQuery.data ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.filters}>
            <ChoiceChips options={FILTERS} value={status} onChange={setStatus} />
            {moderate.isError && (
              <Notice
                message={
                  getApiError(moderate.error)?.code === 'business.owner_email_unverified'
                    ? 'İşletme sahibi e-postasını henüz doğrulamadı; doğrulayınca onaylayabilirsin.'
                    : (getApiError(moderate.error)?.detail ?? 'İşlem tamamlanamadı. Liste yenilendi.')
                }
              />
            )}
          </View>
        }
        ListEmptyComponent={
          listQuery.isLoading ? (
            <View style={styles.skeletons}>
              <Skeleton height={150} radius={radius.xl} />
              <Skeleton height={150} radius={radius.xl} />
            </View>
          ) : listQuery.isError ? (
            <StateView icon="cloud-offline" tone="danger" title="Liste yüklenemedi" actionLabel="Tekrar dene" onAction={() => listQuery.refetch()} />
          ) : (
            <StateView icon="checkmark-done" title="Burada kimse yok" description={status === 'Pending' ? 'Bekleyen başvuru yok.' : undefined} />
          )
        }
        renderItem={({ item }) => (
          <AdminBusinessCard
            business={item}
            busy={moderate.isPending && moderate.variables?.businessId === item.id}
            onApprove={() => run(item, 'approve')}
            onReject={() => setPrompt({ business: item, action: 'reject' })}
            onSuspend={() => setPrompt({ business: item, action: 'suspend' })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={listQuery.isRefetching} onRefresh={() => listQuery.refetch()} tintColor={colors.primary} />
        }
      />

      <ReasonSheet
        prompt={prompt}
        busy={moderate.isPending}
        onClose={() => setPrompt(null)}
        onSubmit={reason => prompt && run(prompt.business, prompt.action, reason)}
      />
    </Screen>
  );
}

function AdminBusinessCard({
  business,
  busy,
  onApprove,
  onReject,
  onSuspend,
}: {
  business: AdminBusiness;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
}) {
  const info = businessStatusInfo[business.status];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar name={business.name} size={46} />
        <View style={styles.cardTitle}>
          <Text style={styles.name} numberOfLines={1}>
            {business.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {business.branchCount} şube · {formatDate(business.createdAt)}
          </Text>
        </View>
        <Badge label={info.label} tone={info.tone} />
      </View>

      <View style={styles.owner}>
        <Ionicons name="person-circle-outline" size={18} color={colors.textMuted} />
        <Text style={styles.ownerText} numberOfLines={1}>
          {business.ownerName ?? 'Sahip yok'}
          {business.ownerEmail ? ` · ${business.ownerEmail}` : ''}
        </Text>
      </View>

      {business.ownerEmail && !business.ownerEmailVerified && (
        <View style={styles.unverified}>
          <Ionicons name="alert-circle" size={15} color={colors.warning} />
          <Text style={styles.unverifiedText}>E-posta doğrulanmadı · onay için doğrulanması gerekiyor</Text>
        </View>
      )}

      {!!business.statusReason && (
        <Text style={styles.reason}>
          <Text style={styles.reasonLabel}>Gerekçe: </Text>
          {business.statusReason}
        </Text>
      )}

      <View style={styles.actions}>
        {busy ? (
          <ActivityIndicator color={colors.primary} style={styles.busy} />
        ) : business.status === 'Pending' ? (
          <>
            <Button title="Reddet" variant="light" size="md" icon="close" style={styles.action} onPress={onReject} />
            <Button title="Onayla" size="md" icon="checkmark" style={styles.action} onPress={onApprove} />
          </>
        ) : business.status === 'Approved' ? (
          <Button title="Askıya al" variant="light" size="md" icon="pause" style={styles.action} onPress={onSuspend} />
        ) : (
          <Button title="Onayla" size="md" icon="checkmark" style={styles.action} onPress={onApprove} />
        )}
      </View>
    </View>
  );
}

function ReasonSheet({
  prompt,
  busy,
  onClose,
  onSubmit,
}: {
  prompt: ReasonPrompt | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const isSuspend = prompt?.action === 'suspend';

  return (
    <Modal
      visible={prompt !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        setReason('');
        setError('');
      }}
    >
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {isSuspend ? `${prompt?.business.name} askıya alınsın mı?` : `${prompt?.business.name} reddedilsin mi?`}
          </Text>
          <Text style={styles.sheetBody}>
            {isSuspend
              ? 'Yayındaki ve planlı tüm Drop’ları ile aktif rezervasyonları iptal edilir. Gerekçe işletme sahibine e-postayla gider.'
              : 'Gerekçe işletme sahibine e-postayla gider ve uygulamada görünür.'}
          </Text>

          <TextField
            label="Gerekçe"
            icon="document-text-outline"
            value={reason}
            onChangeText={value => {
              setReason(value);
              setError('');
            }}
            placeholder={isSuspend ? 'Örn. Müşteri şikayetleri inceleniyor' : 'Örn. Vergi levhası eksik'}
            multiline
            maxLength={500}
            error={error}
          />

          <View style={styles.sheetActions}>
            <Button title="Vazgeç" variant="light" size="md" style={styles.action} onPress={onClose} />
            <Button
              title={isSuspend ? 'Askıya al' : 'Reddet'}
              variant="dark"
              size="md"
              loading={busy}
              style={styles.action}
              onPress={() => {
                if (!reason.trim()) {
                  setError('Gerekçe zorunlu.');
                  haptics.error();
                  return;
                }
                onSubmit(reason.trim());
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  unverified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
  },
  unverifiedText: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  filters: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  skeletons: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitle: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  owner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ownerText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  reason: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  reasonLabel: {
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
  busy: {
    flex: 1,
    height: 48,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8,6,18,0.45)',
  },
  sheet: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sheetBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
