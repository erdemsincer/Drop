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
};

export const getBusinessErrorMessage = (code?: string, fallback?: string) => {
  switch (code) {
    case 'business.name_exists':
      return 'Bu isimde bir işletme zaten var. Farklı bir ad dene.';
    case 'business.access_denied':
      return 'Bu işlem için yetkin yok. İşletme sahibi veya yöneticisi olmalısın.';
    case 'business.not_found':
      return 'İşletme bulunamadı.';
    case 'branch.not_found':
      return 'Şube bulunamadı.';
    case 'validation.failed':
      return 'Lütfen alanları kontrol et.';
    default:
      return fallback ?? 'İşlem tamamlanamadı. Tekrar dene.';
  }
};
