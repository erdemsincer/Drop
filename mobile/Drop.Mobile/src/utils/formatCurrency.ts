/** "₺75" for whole amounts, "₺74,50" otherwise. */
export const formatCurrency = (value: number) => {
  const digits = Number.isInteger(value) ? 0 : 2;

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};
