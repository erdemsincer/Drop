export const getRedeemErrorMessage = (
  code?: string,
) => {
  switch (code) {
    case 'qr.invalid':
      return 'QR kodu geçersiz ya da süresi geçmiş. Kasadaki güncel kodu okut.';

    case 'claim.expired':
      return 'Drop kullanım süren doldu.';

    case 'claim.not_active':
      return 'Bu Drop artık kullanılamıyor.';

    case 'claim.access_denied':
      return 'Bu Drop hesabına ait değil.';

    case 'claim.not_found':
      return 'Drop kaydı bulunamadı.';

    default:
      return 'QR doğrulanamadı. Tekrar deneyebilirsin.';
  }
};
