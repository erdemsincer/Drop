import type { BusinessRole, DropStatus } from '../types/business';

export const roleLabels: Record<BusinessRole, string> = {
  Owner: 'Sahip',
  Manager: 'Yönetici',
  Staff: 'Personel',
};

export const canManageRole = (role?: BusinessRole) => role === 'Owner' || role === 'Manager';

export const statusLabels: Record<DropStatus, string> = {
  Draft: 'TASLAK',
  Active: 'YAYINDA',
  Expired: 'SONA ERDİ',
  Cancelled: 'İPTAL',
  Scheduled: 'PLANLANDI',
};

export const getBusinessErrorMessage = (code?: string, fallback?: string) => {
  switch (code) {
    case 'business.access_denied':
      return 'Bu işlem için yetkin yok. İşletme sahibi veya yöneticisi olmalısın.';
    case 'business.not_found':
      return 'İşletme bulunamadı.';
    case 'branch.not_found':
      return 'Şube bulunamadı.';
    case 'member.user_not_found':
      return 'Bu e-postayla kayıtlı bir Drop hesabı yok. Kişinin önce uygulamaya kayıt olması gerekiyor.';
    case 'member.already_exists':
      return 'Bu kişi zaten ekipte.';
    case 'member.cannot_remove_owner':
      return 'İşletme sahibi ekipten çıkarılamaz.';
    case 'member.not_found':
      return 'Bu kişi artık ekipte değil.';
    case 'validation.failed':
      return 'Lütfen alanları kontrol et.';
    default:
      return fallback ?? 'İşlem tamamlanamadı. Tekrar dene.';
  }
};
