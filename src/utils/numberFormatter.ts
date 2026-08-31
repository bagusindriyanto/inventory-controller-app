export const formatNumber = (number: number, fractionDigits: number = 0) => {
  const numberFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: fractionDigits,
  });

  return numberFormatter.format(number);
};
