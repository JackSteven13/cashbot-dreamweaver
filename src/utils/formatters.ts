
/**
 * Format revenue with correct spacing for thousands and € symbol
 * @param value Number to format as currency
 * @returns Formatted string with Euro currency symbol
 */
export const formatRevenue = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    currencyDisplay: 'symbol'
  }).format(value);
};
