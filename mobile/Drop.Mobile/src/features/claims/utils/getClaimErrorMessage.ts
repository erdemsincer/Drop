export const getClaimErrorMessage = (
  code?: string,
  detail?: string,
) => {
  switch (code) {
    case 'drop.sold_out':
      return 'Bu Drop az önce tükendi.';

    case 'drop.not_active':
      return 'Bu Drop artık aktif değil.';

    case 'claim.already_exists':
      return 'Bu Drop\'u daha önce yakaladın.';

    case 'claim.active_exists':
      return 'Zaten aktif bir Drop\'un var. Önce onu kullan veya süresinin dolmasını bekle.';

    default:
      return (
        detail ??
        'Drop yakalanamadı. Tekrar deneyebilirsin.'
      );
  }
};
