const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

export const formatNumber = (number) => {
  return numberFormatter.format(number);
};
