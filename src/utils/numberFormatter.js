export const formatNumber = (number, fractionDigits = 0) => {
  const numberFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: fractionDigits,
  });

  return numberFormatter.format(number);
};
