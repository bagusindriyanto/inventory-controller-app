export const formatNumber = (
  value: number | string | undefined,
  fractionDigits: number = 0,
) => {
  if (typeof value === 'undefined') return '-';
  if (typeof value === 'string') return value;

  const numberFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: fractionDigits,
  });

  return numberFormatter.format(value);
};
