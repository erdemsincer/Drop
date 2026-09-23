import type { BusinessRole, BusinessStatus, DropStatus } from '../types/business';

export const roleLabels: Record<BusinessRole, string> = {
  Owner: 'Sahip',
  Manager: 'Yönetici',
  Staff: 'Personel',
};

export const businessStatusInfo: Record<
  BusinessStatus,
  { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral'; icon: 'time' | 'checkmark-circle' | 'close-circle' | 'pause-circle' }
> = {
  Pending: { label: 'İNCELENİYOR', tone: 'warning', icon: 'time' },
  Approved: { label: 'ONAYLI', tone: 'success', icon: 'checkmark-circle' },
  Rejected: { label: 'REDDEDİLDİ', tone: 'danger', icon: 'close-circle' },
  Suspended: { label: 'ASKIDA', tone: 'neutral', icon: 'pause-circle' },
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
    case 'business.not_approved':
      return 'İşletmen onaylanmadan Drop yayınlayamazsın. İnceleme genellikle kısa sürer.';
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
