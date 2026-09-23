import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiError } from '@/api/getApiError';
import { useAddMember, useMembers, useRemoveMember } from '@/features/businesses/hooks/useMembers';
import { useMyBusinesses } from '@/features/businesses/hooks/useMyBusinesses';
import type { AddMemberRequest, BusinessMember } from '@/features/businesses/types/business';
import { getBusinessErrorMessage, roleLabels } from '@/features/businesses/utils/businessLabels';
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
  typography,
} from '@/ui';

type AddableRole = AddMemberRequest['role'];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TeamScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const businessesQuery = useMyBusinesses();
  const membersQuery = useMembers(businessId);
  const addMutation = useAddMember(businessId);
  const removeMutation = useRemoveMember(businessId);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [role, setRole] = useState<AddableRole>('Staff');

  const myRole = businessesQuery.data?.find(item => item.id === businessId)?.role;
  const canAdd = myRole === 'Owner' || myRole === 'Manager';
  const roleOptions =
    myRole === 'Owner'
      ? [
          { label: 'Personel', value: 'Staff' as const },
          { label: 'Yönetici', value: 'Manager' as const },
        ]
      : [{ label: 'Personel', value: 'Staff' as const }];

  const addError = addMutation.error ? getApiError(addMutation.error) : null;

  const handleAdd = () => {
    const trimmed = email.trim();

    if (!emailPattern.test(trimmed)) {
      setEmailError('Geçerli bir e-posta gir.');
      haptics.error();
      return;
    }

    addMutation.mutate(
      { email: trimmed, role },
      {
        onSuccess: () => {
          haptics.success();
          setEmail('');
        },
        onError: () => haptics.error(),
      },
    );
  };

  const confirmRemove = (member: BusinessMember) => {
    const name = `${member.firstName} ${member.lastName}`;

    Alert.alert(
      member.isCurrentUser ? 'Ekipten ayrılmak istiyor musun?' : `${name} çıkarılsın mı?`,
      member.isCurrentUser
        ? 'Bu işletmenin paneline erişimin kalkar.'
        : 'Bu kişi işletme paneline ve şube QR koduna erişemez.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: member.isCurrentUser ? 'Ayrıl' : 'Çıkar',
          style: 'destructive',
          onPress: () =>
            removeMutation.mutate(member.userId, {
              onSuccess: () => {
                haptics.success();
                if (member.isCurrentUser) router.replace('/(app)/(tabs)');
              },
              onError: error => {
                haptics.error();
                const apiError = getApiError(error);
                Alert.alert('İşlem tamamlanamadı', getBusinessErrorMessage(apiError?.code, apiError?.detail));
              },
            }),
        },
      ],
    );
  };

  if (membersQuery.isError) {
    return (
      <Screen>
        <Header title="Ekip" onBack={() => router.back()} />
        <StateView
          icon="alert-circle"
          tone="danger"
          title="Ekip yüklenemedi"
          actionLabel="Tekrar dene"
          onAction={() => membersQuery.refetch()}
        />
      </Screen>
    );
  }

  const addForm = canAdd ? (
    <View style={styles.addCard}>
      <View style={styles.addHeader}>
        <Ionicons name="person-add" size={16} color={colors.primary} />
        <Text style={styles.addTitle}>Ekibe kişi ekle</Text>
      </View>
      <Text style={styles.addHint}>Kişinin önce Drop uygulamasına kayıt olmuş olması gerekir.</Text>

      <TextField
        label="E-posta"
        icon="mail-outline"
        value={email}
        onChangeText={value => {
          setEmail(value);
          setEmailError('');
        }}
        placeholder="calisan@ornek.com"
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="done"
        onSubmitEditing={handleAdd}
        error={emailError}
      />

      <ChoiceChips options={roleOptions} value={role} onChange={setRole} />

      <Text style={styles.roleHint}>
        {role === 'Manager'
          ? 'Yönetici: Drop oluşturur, QR gösterir, personel ekler.'
          : 'Personel: Drop’ları görür ve kasada şube QR kodunu gösterir.'}
      </Text>

      {addError && <Notice message={getBusinessErrorMessage(addError.code, addError.detail)} />}
      {addMutation.isError && !addError && <Notice message="Sunucuya ulaşılamadı." />}

      <Button title="Ekle" icon="add" size="md" loading={addMutation.isPending} onPress={handleAdd} />
    </View>
  ) : null;

  return (
    <Screen edges={['top']}>
      <Header title="Ekip" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={membersQuery.data ?? []}
          keyExtractor={item => item.userId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {addForm}
              <Text style={styles.sectionTitle}>
                Üyeler{membersQuery.data ? ` · ${membersQuery.data.length}` : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={
            membersQuery.isLoading ? (
              <View style={styles.skeletons}>
                <Skeleton height={72} radius={radius.lg} />
                <Skeleton height={72} radius={radius.lg} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              busy={removeMutation.isPending && removeMutation.variables === item.userId}
              onRemove={() => confirmRemove(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={membersQuery.isRefetching}
              onRefresh={() => membersQuery.refetch()}
              tintColor={colors.primary}
            />
          }
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

function MemberRow({ member, busy, onRemove }: { member: BusinessMember; busy: boolean; onRemove: () => void }) {
  const name = `${member.firstName} ${member.lastName}`;

  return (
    <View style={styles.row}>
      <Avatar name={name} size={44} />
      <View style={styles.rowText}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {member.isCurrentUser && <Text style={styles.you}>(sen)</Text>}
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {member.email}
        </Text>
      </View>

      <Badge
        label={roleLabels[member.role].toUpperCase()}
        tone={member.role === 'Owner' ? 'primary' : member.role === 'Manager' ? 'warning' : 'neutral'}
      />

      {member.canRemove &&
        (busy ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={member.isCurrentUser ? 'Ekipten ayrıl' : `${name} kişisini çıkar`}
            onPress={onRemove}
          >
            <Ionicons
              name={member.isCurrentUser ? 'exit-outline' : 'trash-outline'}
              size={20}
              color={colors.danger}
            />
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  addCard: {
    gap: spacing.md,
    padding: spacing.lg + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addTitle: {
    ...typography.heading,
    fontSize: 16,
    color: colors.text,
  },
  addHint: {
    marginTop: -spacing.sm,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  roleHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    ...typography.heading,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    color: colors.text,
  },
  skeletons: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  rowText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  you: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  email: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
  },
});
